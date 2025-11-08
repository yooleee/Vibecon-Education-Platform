import os
from openai import AsyncOpenAI
from dotenv import load_dotenv
from typing import List
import uuid

load_dotenv()

# Initialize OpenAI client with Emergent LLM key
client = AsyncOpenAI(
    api_key=os.getenv("EMERGENT_LLM_KEY")
)


async def answer_query(question: str, relevant_chunks: List[str]) -> str:
    """
    Generate an answer to a question using GPT-4o with relevant context
    
    Args:
        question: User's question
        relevant_chunks: Relevant transcript chunks
    
    Returns:
        Generated answer
    """
    try:
        # Prepare context from relevant chunks
        context = "\n\n".join(relevant_chunks)
        
        # Create prompt
        system_prompt = """You are an expert AI tutor helping students understand lecture content.
Use the provided lecture transcript excerpts to answer the student's question accurately and helpfully.
If the answer is not in the provided context, say so and provide general guidance."""
        
        user_prompt = f"""Lecture Context:
{context}

Student Question: {question}

Provide a clear, concise answer based on the lecture content."""
        
        # Call GPT-4o
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        answer = response.choices[0].message.content
        return answer
    
    except Exception as e:
        raise Exception(f"Query answering failed: {str(e)}")


async def text_to_speech(text: str) -> str:
    """
    Convert text to speech using OpenAI TTS as placeholder
    (Will be replaced with Cartesia Sonic 3 when API key is provided)
    
    Args:
        text: Text to convert
    
    Returns:
        URL or path to audio file
    """
    try:
        # For now, use OpenAI TTS as placeholder
        # Will integrate Cartesia Sonic 3 later
        response = await client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=text
        )
        
        # Save audio file
        audio_id = str(uuid.uuid4())
        audio_path = f"/app/data/uploads/tts_{audio_id}.mp3"
        
        with open(audio_path, "wb") as f:
            async for chunk in response.iter_bytes():
                f.write(chunk)
        
        return f"/api/audio/{audio_id}"
    
    except Exception as e:
        raise Exception(f"Text-to-speech failed: {str(e)}")
