import os
import uuid
from cartesia import AsyncCartesia
from dotenv import load_dotenv

load_dotenv()

# Initialize Cartesia client
cartesia_client = AsyncCartesia(api_key=os.getenv("CARTESIA_API_KEY"))


async def text_to_speech_cartesia(text: str, voice_id: str = "a0e99841-438c-4a64-b679-ae501e7d6091") -> str:
    """
    Convert text to speech using Cartesia Sonic 3 for ultra-low latency
    
    Args:
        text: Text to convert to speech
        voice_id: Cartesia voice ID (default is Barbershop Man - friendly, clear)
    
    Returns:
        Path to generated audio file
    """
    try:
        # Available voices for education:
        # "a0e99841-438c-4a64-b679-ae501e7d6091" - Barbershop Man (friendly, clear)
        # "79a125e8-cd45-4c13-8a67-188112f4dd22" - British Lady (professional)
        # "156fb8d2-335b-4950-9cb3-a2d33befec77" - Newsman (authoritative)
        
        audio_id = str(uuid.uuid4())
        output_path = f"/app/data/uploads/voice_{audio_id}.mp3"
        
        # Generate speech with Cartesia
        output_format = {
            "container": "mp3",
            "encoding": "mp3",
            "sample_rate": 44100
        }
        
        # Stream audio and save
        async with cartesia_client.tts.sse(
            model_id="sonic-english",
            transcript=text,
            voice_id=voice_id,
            output_format=output_format,
            language="en"
        ) as source:
            audio_chunks = []
            async for chunk in source:
                audio_chunks.append(chunk["audio"])
            
            # Concatenate and save
            if audio_chunks:
                import base64
                audio_data = b"".join([base64.b64decode(chunk) for chunk in audio_chunks])
                with open(output_path, "wb") as f:
                    f.write(audio_data)
        
        return output_path
    
    except Exception as e:
        raise Exception(f"Cartesia TTS failed: {str(e)}")


async def transcribe_audio_streaming(audio_path: str) -> str:
    """
    Transcribe audio using OpenAI Whisper
    This is already implemented in transcription_service.py
    """
    from services.transcription_service import transcribe_audio
    return await transcribe_audio(audio_path)
