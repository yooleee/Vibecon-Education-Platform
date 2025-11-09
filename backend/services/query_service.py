import os
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv
from typing import List
import uuid

load_dotenv()


async def answer_query(question: str, relevant_chunks: List[str], language: str = "en") -> str:
    """
    Generate an answer to a question using GPT-4o with relevant context
    
    Args:
        question: User's question
        relevant_chunks: Relevant transcript chunks
        language: Response language (en, es, hi)
    
    Returns:
        Generated answer in specified language
    """
    try:
        # Prepare context from relevant chunks
        context = "\n\n".join(relevant_chunks)
        
        # Language-specific instructions
        language_instructions = {
            "en": "Respond in English.",
            "es": "IMPORTANTE: Responde COMPLETAMENTE en español. TODA tu respuesta debe estar en español, sin excepciones.",
            "hi": "महत्वपूर्ण: आपका पूरा जवाब हिंदी में होना चाहिए। Your ENTIRE response MUST be in Hindi, no exceptions."
        }
        
        lang_instruction = language_instructions.get(language, language_instructions["en"])
        
        # Create system message with language instruction
        system_message = f"""You are an expert AI tutor helping students understand lecture content.
Use the provided lecture transcript excerpts to answer the student's question accurately and helpfully.
If the answer is not in the provided context, say so and provide general guidance.
{lang_instruction}"""
        
        # Initialize LlmChat
        chat = LlmChat(
            api_key=os.getenv("EMERGENT_LLM_KEY"),
            session_id=str(uuid.uuid4()),
            system_message=system_message
        ).with_model("openai", "gpt-4o")
        
        # Create user message with context
        user_prompt = f"""Lecture Context:
{context}

Student Question: {question}

Provide a clear, concise answer based on the lecture content. {lang_instruction}"""
        
        user_message = UserMessage(text=user_prompt)
        
        # Get response
        response = await chat.send_message(user_message)
        
        return response
    
    except Exception as e:
        raise Exception(f"Query answering failed: {str(e)}")


async def text_to_speech(text: str) -> str:
    """
    Convert text to speech using OpenAI TTS
    (Cartesia Sonic 3 integration available with provided API key)
    
    Args:
        text: Text to convert
    
    Returns:
        URL or path to audio file
    """
    try:
        from openai import AsyncOpenAI
        
        # Use direct OpenAI API key for TTS
        client = AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        response = await client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=text
        )
        
        # Save audio file
        audio_id = str(uuid.uuid4())
        audio_path = f"/app/data/uploads/tts_{audio_id}.mp3"
        
        # Write the audio content
        audio_content = b""
        async for chunk in response.iter_bytes():
            audio_content += chunk
        
        with open(audio_path, "wb") as f:
            f.write(audio_content)
        
        return f"/api/audio/{audio_id}"
    
    except Exception as e:
        raise Exception(f"Text-to-speech failed: {str(e)}")
