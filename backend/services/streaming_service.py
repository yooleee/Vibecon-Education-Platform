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
    
    def add(self, text: str) -> List[str]:
        """Add text to buffer and return complete sentences"""
        self.buffer += text
        sentences = []
        
        # Look for sentence endings: . ! ? followed by space or end of string
        while True:
            # Find the next sentence ending
            match = re.search(r'([.!?])\s+', self.buffer)
            if match:
                # Extract the complete sentence
                end_pos = match.end()
                sentence = self.buffer[:end_pos].strip()
                if sentence:
                    sentences.append(sentence)
                self.buffer = self.buffer[end_pos:]
            else:
                # No complete sentence found
                break
        
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
                    
                    # Add to buffer and get complete sentences
                    sentences = sentence_buffer.add(token)
                    
                    # Process each complete sentence
                    for sentence in sentences:
                        if sentence and len(sentence.strip()) > 3:
                            print(f"📝 Complete sentence: '{sentence[:60]}...'")
                            
                            # Send text immediately
                            yield {
                                "type": "text",
                                "data": {"text": sentence}
                            }
                            
                            # Generate and send audio URL (not base64!)
                            try:
                                print(f"🎙️ Generating TTS...")
                                audio_path = await text_to_speech_cartesia(sentence, voice_id=cloned_voice_id)
                                audio_filename = os.path.basename(audio_path)
                                audio_url = f"/api/audio/{audio_filename}"
                                print(f"✅ TTS generated: {audio_url}")
                                
                                # Send audio URL instead of base64 data
                                print(f"📤 Sending audio URL")
                                yield {
                                    "type": "audio",
                                    "data": {
                                        "audio_url": audio_url,
                                        "text": sentence
                                    }
                                }
                                
                                # Don't delete - let it be served via /api/audio endpoint
                                
                            except Exception as e:
                                print(f"❌ TTS error: {e}")
                                import traceback
                                traceback.print_exc()
        
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
                print(f"✅ Final TTS generated")
                
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
