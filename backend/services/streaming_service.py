import os
import re
import asyncio
from typing import AsyncGenerator, List
from openai import AsyncOpenAI
from services.voice_service import text_to_speech_cartesia
from dotenv import load_dotenv
import uuid
import base64

load_dotenv()

# Initialize OpenAI client for streaming
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class SentenceBuffer:
    """Buffer tokens and yield complete sentences"""
    
    def __init__(self):
        self.buffer = ""
        self.sentence_endings = re.compile(r'[.!?]\s')
    
    def add(self, text: str) -> List[str]:
        """Add text to buffer and return complete sentences"""
        self.buffer += text
        sentences = []
        
        # Find all sentence boundaries
        matches = list(self.sentence_endings.finditer(self.buffer))
        
        if matches:
            # Extract complete sentences
            last_end = 0
            for match in matches:
                sentence = self.buffer[last_end:match.end()].strip()
                if sentence:
                    sentences.append(sentence)
                last_end = match.end()
            
            # Keep incomplete part in buffer
            self.buffer = self.buffer[last_end:]
        
        return sentences
    
    def flush(self) -> str:
        """Return remaining buffer content"""
        remaining = self.buffer.strip()
        self.buffer = ""
        return remaining


async def stream_voice_response(
    question: str,
    relevant_chunks: List[str],
    cloned_voice_id: str
) -> AsyncGenerator[dict, None]:
    """
    Stream AI response with real-time TTS generation
    
    Yields:
        dict with 'type' (text/audio/complete) and 'data'
    """
    try:
        # Prepare context
        context = "\n\n".join(relevant_chunks)
        
        system_message = """You are an expert AI tutor helping students understand lecture content.
Use the provided lecture transcript excerpts to answer the student's question accurately and helpfully.
If the answer is not in the provided context, say so and provide general guidance.
Keep your answers concise and focused."""
        
        user_prompt = f"""Lecture Context:
{context}

Student Question: {question}

Provide a clear, concise answer based on the lecture content."""
        
        # Stream tokens from GPT-4o using OpenAI client
        sentence_buffer = SentenceBuffer()
        full_response = ""
        
        # Send initial event
        yield {
            "type": "start",
            "data": {"message": "AI is thinking..."}
        }
        
        # Create streaming completion
        stream = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=500,
            stream=True
        )
        
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                token = chunk.choices[0].delta.content
                full_response += token
                
                # Add to buffer and get complete sentences
                sentences = sentence_buffer.add(token)
                
                # Process each complete sentence
                for sentence in sentences:
                    if sentence:
                        # Send text immediately
                        yield {
                            "type": "text",
                            "data": {"text": sentence}
                        }
                        
                        # Generate and send audio
                        try:
                            audio_path = await text_to_speech_cartesia(sentence, voice_id=cloned_voice_id)
                            
                            # Read audio file and encode as base64
                            with open(audio_path, "rb") as f:
                                audio_data = base64.b64encode(f.read()).decode('utf-8')
                            
                            yield {
                                "type": "audio",
                                "data": {
                                    "audio": audio_data,
                                    "text": sentence
                                }
                            }
                            
                            # Clean up audio file
                            os.remove(audio_path)
                            
                        except Exception as e:
                            print(f"TTS error: {e}")
                            yield {
                                "type": "error",
                                "data": {"message": f"TTS failed: {str(e)}"}
                            }
        
        # Flush any remaining content
        remaining = sentence_buffer.flush()
        if remaining:
            yield {
                "type": "text",
                "data": {"text": remaining}
            }
            
            # Generate audio for remaining text
            try:
                audio_path = await text_to_speech_cartesia(remaining, voice_id=cloned_voice_id)
                with open(audio_path, "rb") as f:
                    audio_data = base64.b64encode(f.read()).decode('utf-8')
                
                yield {
                    "type": "audio",
                    "data": {
                        "audio": audio_data,
                        "text": remaining
                    }
                }
                os.remove(audio_path)
            except Exception as e:
                print(f"TTS error for remaining: {e}")
        
        # Send completion event
        yield {
            "type": "complete",
            "data": {
                "full_response": full_response,
                "relevant_chunks": relevant_chunks
            }
        }
        
    except Exception as e:
        yield {
            "type": "error",
            "data": {"message": str(e)}
        }
