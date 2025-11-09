"""V2 API routes using LangGraph orchestration"""
from fastapi import APIRouter, HTTPException, Form, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import json
import os

from graph.graph import create_conversation_graph
from graph.memory import ConversationMemory
from graph.state import ConversationState
from graph.nodes import retrieve_node, persist_node
from services.transcription_service import transcribe_audio
from services.voice_service import text_to_speech_cartesia
from services.streaming_service import SentenceBuffer
from utils.storage import load_lecture
from langchain_core.messages import HumanMessage
import uuid

router = APIRouter(prefix="/api/v2", tags=["graph"])

# Initialize memory manager
memory = ConversationMemory()

# Create graph (singleton)
conversation_graph = create_conversation_graph()


class SessionStartRequest(BaseModel):
    lecture_id: str
    language: str = "en"


class QueryRequest(BaseModel):
    session_id: str
    question: str


@router.post("/session/start")
async def start_session(request: SessionStartRequest):
    """Initialize a new conversation session"""
    try:
        # Load lecture to get voice_id
        lecture = load_lecture(request.lecture_id)
        if not lecture:
            raise HTTPException(status_code=404, detail="Lecture not found")
        
        voice_id = lecture.get("cloned_voice_id", "a0e99841-438c-4a64-b679-ae501e7d6091")
        
        # Create session
        session = await memory.create_session(
            lecture_id=request.lecture_id,
            voice_id=voice_id,
            language=request.language
        )
        
        return {
            "session_id": session.session_id,
            "lecture_id": session.lecture_id,
            "voice_id": session.voice_id,
            "language": session.language,
            "created_at": session.created_at.isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/graph/query")
async def query_graph(request: QueryRequest):
    """Non-streaming query (fallback)"""
    try:
        # Get session
        session = await memory.get_session(request.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get conversation history
        conversation = await memory.get_conversation(request.session_id)
        
        # Build messages list from history
        messages = []
        if conversation and conversation.messages:
            for msg in conversation.messages:
                if msg.role == "user":
                    messages.append(HumanMessage(content=msg.content))
                # AI messages will be added by the graph
        
        # Add new user question
        messages.append(HumanMessage(content=request.question))
        
        # Initialize state
        initial_state: ConversationState = {
            "session_id": session.session_id,
            "lecture_id": session.lecture_id,
            "voice_id": session.voice_id,
            "language": session.language,
            "messages": messages,
            "relevant_chunks": None,
            "response_text": None,
            "audio_chunks": None,
            "summary": conversation.summary if conversation else None,
            "message_count": conversation.message_count if conversation else 0
        }
        
        # Run graph
        result = await conversation_graph.ainvoke(initial_state)
        
        # Generate audio for full response
        audio_path = await text_to_speech_cartesia(
            result["response_text"],
            voice_id=session.voice_id,
            language=session.language
        )
        audio_filename = os.path.basename(audio_path)
        
        return {
            "session_id": session.session_id,
            "question": request.question,
            "answer": result["response_text"],
            "audio_url": f"/api/audio/{audio_filename}",
            "relevant_chunks": result.get("relevant_chunks", []),
            "language": session.language
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/graph/query-stream")
async def query_graph_stream(
    session_id: str = Form(...),
    question: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None)
):
    """Streaming query with SSE (text + audio)"""
    try:
        # Get session
        session = await memory.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Handle voice input if provided
        question_text = question
        if audio:
            # Save and transcribe audio
            audio_id = str(uuid.uuid4())
            audio_path = f"/app/data/uploads/question_{audio_id}.wav"
            with open(audio_path, "wb") as f:
                content = await audio.read()
                f.write(content)
            
            question_text = await transcribe_audio(audio_path)
        
        if not question_text:
            raise HTTPException(status_code=400, detail="Question or audio required")
        
        # Get conversation history
        conversation = await memory.get_conversation(session_id)
        
        # Build messages from history
        messages = []
        if conversation and conversation.messages:
            for msg in conversation.messages[-10:]:  # Last 10 messages for context
                if msg.role == "user":
                    messages.append(HumanMessage(content=msg.content))
        
        # Add new question
        messages.append(HumanMessage(content=question_text))
        
        # Initialize state
        initial_state: ConversationState = {
            "session_id": session.session_id,
            "lecture_id": session.lecture_id,
            "voice_id": session.voice_id,
            "language": session.language,
            "messages": messages,
            "relevant_chunks": None,
            "response_text": None,
            "audio_chunks": None,
            "summary": conversation.summary if conversation else None,
            "message_count": conversation.message_count if conversation else 0
        }
        
        async def event_generator():
            """Generate SSE events"""
            try:
                # Send question
                yield f"data: {json.dumps({'type': 'question', 'data': {'text': question_text}})}\n\n"
                
                # Send start event
                yield f"data: {json.dumps({'type': 'start', 'data': {'message': 'AI is thinking...'}})}\n\n"
                
                # Stream through graph with text streaming
                from langchain_openai import ChatOpenAI
                from langchain_core.messages import SystemMessage, AIMessage
                
                # Run retrieve node first
                print("🔍 Running retrieve node...")
                retrieve_result = await retrieve_node(initial_state)
                initial_state["relevant_chunks"] = retrieve_result["relevant_chunks"]
                
                # Stream reasoning with TTS
                print("🧠 Streaming reasoning node...")
                
                # Language instructions
                language_instructions = {
                    "en": "Respond in English.",
                    "es": "Responde en español. Provide entire answer in Spanish.",
                    "hi": "हिंदी में जवाब दें. Provide entire answer in Hindi."
                }
                
                lang_instruction = language_instructions.get(session.language, language_instructions["en"])
                
                # Build system message
                system_content = f"""You are an expert AI tutor helping students understand lecture content.
Use the provided lecture transcript excerpts to answer the student's question accurately and helpfully.
Keep your answers clear, conversational, and well-paced for audio output.
If the answer is not in the provided context, say so and provide general guidance.
{lang_instruction}"""
                
                if initial_state.get("summary"):
                    system_content += f"\n\nConversation summary so far: {initial_state['summary']}"
                
                # Build context
                context = ""
                if initial_state.get("relevant_chunks"):
                    context = "\n\nLecture Context:\n" + "\n\n".join(initial_state["relevant_chunks"])
                
                # Prepare messages
                llm_messages = [SystemMessage(content=system_content)]
                
                # Add recent history
                for msg in messages[:-1]:  # All except the last one (we'll add it with context)
                    llm_messages.append(msg)
                
                # Add current question with context
                llm_messages.append(HumanMessage(content=context + "\n\n" + question_text))
                
                # Stream LLM response with phrase-level TTS
                llm = ChatOpenAI(
                    model="gpt-4o",
                    api_key=os.getenv("OPENAI_API_KEY"),
                    temperature=0.7,
                    max_tokens=500,
                    streaming=True
                )
                
                sentence_buffer = SentenceBuffer()
                full_response = ""
                
                async for chunk in llm.astream(llm_messages):
                    if chunk.content:
                        token = chunk.content
                        full_response += token
                        
                        # Buffer and get complete phrases
                        chunks_to_speak = sentence_buffer.add(token)
                        
                        for text_chunk in chunks_to_speak:
                            if text_chunk and len(text_chunk.strip()) > 3:
                                # Send text
                                yield f"data: {json.dumps({'type': 'text', 'data': {'text': text_chunk}})}\n\n"
                                
                                # Generate audio
                                try:
                                    audio_path = await text_to_speech_cartesia(
                                        text_chunk,
                                        voice_id=session.voice_id,
                                        language=session.language
                                    )
                                    audio_filename = os.path.basename(audio_path)
                                    audio_url = f"/api/audio/{audio_filename}"
                                    
                                    yield f"data: {json.dumps({'type': 'audio', 'data': {'audio_url': audio_url, 'text': text_chunk}})}\n\n"
                                except Exception as e:
                                    print(f"❌ TTS error: {e}")
                
                # Flush remaining buffer
                remaining = sentence_buffer.flush()
                if remaining and len(remaining.strip()) > 3:
                    yield f"data: {json.dumps({'type': 'text', 'data': {'text': remaining}})}\n\n"
                    
                    try:
                        audio_path = await text_to_speech_cartesia(
                            remaining,
                            voice_id=session.voice_id,
                            language=session.language
                        )
                        audio_filename = os.path.basename(audio_path)
                        audio_url = f"/api/audio/{audio_filename}"
                        
                        yield f"data: {json.dumps({'type': 'audio', 'data': {'audio_url': audio_url, 'text': remaining}})}\n\n"
                    except Exception as e:
                        print(f"❌ Final TTS error: {e}")
                
                # Persist conversation
                print("💾 Persisting conversation...")
                initial_state["messages"].append(AIMessage(content=full_response))
                initial_state["response_text"] = full_response
                
                from graph.nodes import persist_node
                await persist_node(initial_state)
                
                # Send complete
                yield f"data: {json.dumps({'type': 'complete', 'data': {'full_response': full_response, 'relevant_chunks': initial_state.get('relevant_chunks', [])}})}\n\n"
                
            except Exception as e:
                print(f"❌ Stream error: {e}")
                import traceback
                traceback.print_exc()
                yield f"data: {json.dumps({'type': 'error', 'data': {'message': str(e)}})}\n\n"
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}")
async def get_session_info(session_id: str):
    """Get session details and conversation history"""
    try:
        session = await memory.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        conversation = await memory.get_conversation(session_id)
        
        return {
            "session": session.model_dump(),
            "conversation": conversation.model_dump() if conversation else None
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
