"""Graph nodes for conversation processing"""
import os
from typing import Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from graph.state import ConversationState
from graph.memory import ConversationMemory
from services.embedding_service import generate_embeddings, compute_similarity
from services.voice_service import text_to_speech_cartesia
from services.streaming_service import SentenceBuffer
from utils.storage import load_lecture
from dotenv import load_dotenv
import re

load_dotenv()

memory = ConversationMemory()


async def retrieve_node(state: ConversationState) -> Dict[str, Any]:
    """Retrieve relevant lecture chunks based on user question"""
    print("📚 [RETRIEVE NODE] Finding relevant chunks...")
    
    # Get the last user message
    user_message = None
    for msg in reversed(state["messages"]):
        if isinstance(msg, HumanMessage):
            user_message = msg.content
            break
    
    if not user_message:
        return {"relevant_chunks": []}
    
    # Load lecture data
    lecture = load_lecture(state["lecture_id"])
    if not lecture:
        print("❌ Lecture not found")
        return {"relevant_chunks": []}
    
    # Generate embedding for question
    question_embedding = await generate_embeddings([user_message])
    
    # Compute similarities
    similarities = compute_similarity(question_embedding[0], lecture["embeddings"])
    
    # Get top 3 chunks
    top_indices = sorted(range(len(similarities)), key=lambda i: similarities[i], reverse=True)[:3]
    relevant_chunks = [lecture["chunks"][i] for i in top_indices]
    
    print(f"✅ Retrieved {len(relevant_chunks)} relevant chunks")
    return {"relevant_chunks": relevant_chunks}


async def reason_node(state: ConversationState) -> Dict[str, Any]:
    """Generate response using GPT-4o with conversation memory"""
    print("🧠 [REASON NODE] Generating response with GPT-4o...")
    
    # Language-specific instructions
    language_instructions = {
        "en": "Respond in English.",
        "es": "Responde en español. Provide entire answer in Spanish.",
        "hi": "हिंदी में जवाब दें. Provide entire answer in Hindi."
    }
    
    language = state.get("language", "en")
    lang_instruction = language_instructions.get(language, language_instructions["en"])
    
    # Build system message
    system_content = f"""You are an expert AI tutor helping students understand lecture content.
Use the provided lecture transcript excerpts to answer the student's question accurately and helpfully.
Keep your answers clear, conversational, and well-paced for audio output.
If the answer is not in the provided context, say so and provide general guidance.
{lang_instruction}"""
    
    # Add conversation summary if available
    if state.get("summary"):
        system_content += f"\n\nConversation summary so far: {state['summary']}"
    
    # Build context from relevant chunks
    context = ""
    if state.get("relevant_chunks"):
        context = "\n\nLecture Context:\n" + "\n\n".join(state["relevant_chunks"])
    
    # Prepare messages for LLM
    messages = [SystemMessage(content=system_content)]
    
    # Add conversation history (last 5 exchanges for context window)
    recent_messages = state["messages"][-10:] if len(state["messages"]) > 10 else state["messages"]
    
    for msg in recent_messages:
        if isinstance(msg, HumanMessage):
            # Add context only to the first message
            if msg == recent_messages[0] and context:
                messages.append(HumanMessage(content=context + "\n\n" + msg.content))
            else:
                messages.append(msg)
        elif isinstance(msg, AIMessage):
            messages.append(msg)
    
    # Initialize LLM
    llm = ChatOpenAI(
        model="gpt-4o",
        api_key=os.getenv("OPENAI_API_KEY"),
        temperature=0.7,
        max_tokens=500,
        streaming=True
    )
    
    # Generate response
    response_text = ""
    async for chunk in llm.astream(messages):
        if chunk.content:
            response_text += chunk.content
    
    print(f"✅ Generated response ({len(response_text)} chars)")
    
    return {
        "messages": [AIMessage(content=response_text)],
        "response_text": response_text
    }


async def persist_node(state: ConversationState) -> Dict[str, Any]:
    """Persist conversation to MongoDB"""
    print("💾 [PERSIST NODE] Saving to MongoDB...")
    
    session_id = state["session_id"]
    
    # Save the latest message exchange
    messages = state["messages"]
    if len(messages) >= 2:
        # Save last user message
        last_user_msg = None
        last_ai_msg = None
        
        for msg in reversed(messages):
            if isinstance(msg, AIMessage) and last_ai_msg is None:
                last_ai_msg = msg
            elif isinstance(msg, HumanMessage) and last_user_msg is None:
                last_user_msg = msg
            
            if last_user_msg and last_ai_msg:
                break
        
        # Add messages to MongoDB if not already saved
        conversation = await memory.get_conversation(session_id)
        if conversation:
            # Only save if this is a new exchange
            if last_user_msg and (not conversation.messages or 
                                  conversation.messages[-1].content != last_ai_msg.content):
                # Save user message
                await memory.add_message(
                    session_id,
                    role="user",
                    content=last_user_msg.content
                )
                # Save assistant message
                await memory.add_message(
                    session_id,
                    role="assistant",
                    content=last_ai_msg.content,
                    metadata={
                        "relevant_chunks": state.get("relevant_chunks", []),
                        "language": state.get("language", "en")
                    }
                )
    
    print("✅ Conversation persisted")
    return {}
