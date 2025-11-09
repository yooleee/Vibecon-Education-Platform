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
    """Buffer tokens and yield phrases/sentences for faster TTS"""
    
    def __init__(self):
        self.buffer = ""
        self.word_count = 0
        self.phrase_threshold = 5  # Generate audio every 5 words for speed
    
    def add(self, text: str) -> List[str]:
        """Add text to buffer and return complete phrases/sentences"""
        self.buffer += text
        chunks = []
        
        # Count words in buffer
        words = self.buffer.split()
        self.word_count = len(words)
        
        # Strategy 1: Look for sentence endings (priority)
        match = re.search(r'([.!?])\s+', self.buffer)
        if match:
            # Extract the complete sentence
            end_pos = match.end()
            chunk = self.buffer[:end_pos].strip()
            if chunk:
                chunks.append(chunk)
            self.buffer = self.buffer[end_pos:]
            self.word_count = len(self.buffer.split())
        
        # Strategy 2: If we have enough words, yield a phrase (faster audio!)
        elif self.word_count >= self.phrase_threshold:
            # Find natural pause points (commas, conjunctions)
            pause_match = re.search(r'(,\s+|;\s+|\s+and\s+|\s+but\s+|\s+or\s+)', self.buffer)
            if pause_match:
                end_pos = pause_match.end()
                chunk = self.buffer[:end_pos].strip()
                if chunk and len(chunk.split()) >= 3:  # At least 3 words
                    chunks.append(chunk)
                    self.buffer = self.buffer[end_pos:]
                    self.word_count = len(self.buffer.split())
        
        return chunks
    
    def flush(self) -> str:
        """Return remaining buffer content"""
        remaining = self.buffer.strip()
        self.buffer = ""
        self.word_count = 0
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
        print(f"\n🎙️ Starting streaming response with voice: {cloned_voice_id}")
        
        # Prepare context
        context = "\n\n".join(relevant_chunks)
        
        system_message = """You are an expert AI tutor helping students understand lecture content.
Use the provided lecture transcript excerpts to answer the student's question accurately and helpfully.
If the answer is not in the provided context, say so and provide general guidance.
Keep your answers clear and conversational."""
        
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
        
        print("📡 Creating GPT-4o stream...")
        
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
        
        print("✅ Stream created, processing tokens...")
        
        async for chunk in stream:
            if chunk.choices and len(chunk.choices) > 0:
                delta = chunk.choices[0].delta
                if delta.content:
                    token = delta.content
                    full_response += token
                    
                    # Add to buffer and get complete phrases/sentences
                    chunks_to_speak = sentence_buffer.add(token)
                    
                    # Process each complete chunk (phrase or sentence)
                    for text_chunk in chunks_to_speak:
                        if text_chunk and len(text_chunk.strip()) > 3:
                            print(f"📝 Chunk ready: '{text_chunk[:60]}...' ({len(text_chunk.split())} words)")
                            
                            # Send text immediately
                            yield {
                                "type": "text",
                                "data": {"text": text_chunk}
                            }
                            
                            # Generate TTS asynchronously (don't wait!)
                            # This allows GPT-4o to continue streaming while TTS generates
                            asyncio.create_task(
                                generate_and_send_audio(text_chunk, cloned_voice_id)
                            )
                            
                            # Small delay to ensure TTS starts before next chunk
                            await asyncio.sleep(0.1)
        
        print("🏁 Stream complete, flushing buffer...")
        
        # Flush any remaining content
        remaining = sentence_buffer.flush()
        if remaining and len(remaining.strip()) > 3:
            print(f"📝 Remaining text: '{remaining[:60]}...'")
            
            yield {
                "type": "text",
                "data": {"text": remaining}
            }
            
            # Generate audio for remaining text
            try:
                print(f"🎙️ Generating final TTS...")
                audio_path = await text_to_speech_cartesia(remaining, voice_id=cloned_voice_id)
                audio_filename = os.path.basename(audio_path)
                audio_url = f"/api/audio/{audio_filename}"
                print(f"✅ Final TTS generated: {audio_url}")
                
                yield {
                    "type": "audio",
                    "data": {
                        "audio_url": audio_url,
                        "text": remaining
                    }
                }
            except Exception as e:
                print(f"❌ Final TTS error: {e}")
        
        # Send completion event
        print(f"✅ Response complete! Total length: {len(full_response)}")
        yield {
            "type": "complete",
            "data": {
                "full_response": full_response,
                "relevant_chunks": relevant_chunks
            }
        }
        
    except Exception as e:
        print(f"❌ Streaming error: {e}")
        import traceback
        traceback.print_exc()
        yield {
            "type": "error",
            "data": {"message": str(e)}
        }
