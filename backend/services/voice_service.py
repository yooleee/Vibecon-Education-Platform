import os
import uuid
from cartesia import AsyncCartesia, Cartesia
from dotenv import load_dotenv

load_dotenv()

# Initialize Cartesia client (both async and sync)
cartesia_client = AsyncCartesia(api_key=os.getenv("CARTESIA_API_KEY"))
cartesia_sync_client = Cartesia(api_key=os.getenv("CARTESIA_API_KEY"))


async def clone_voice_from_audio(audio_clip_path: str, voice_name: str) -> str:
    """
    Clone a voice from an audio clip using Cartesia
    
    Args:
        audio_clip_path: Path to 5-10 second audio clip
        voice_name: Name for the cloned voice
    
    Returns:
        Voice ID of the cloned voice
    """
    try:
        print(f"Cloning voice from: {audio_clip_path}")
        
        # Clone the voice - this returns a VoiceMetadata object
        with open(audio_clip_path, "rb") as audio_file:
            cloned_voice = cartesia_sync_client.voices.clone(
                clip=audio_file,
                name=voice_name,
                language="en",
                mode="similarity",  # Prioritize closeness to source voice
                enhance=True,  # Enable audio enhancement (cleaning and denoising)
                description=f"Cloned professor voice from lecture"
            )
        
        # Access ID as attribute (not dictionary key)
        voice_id = cloned_voice.id
        print(f"✓ Voice cloned successfully! Voice ID: {voice_id}")
        
        return voice_id
    
    except Exception as e:
        raise Exception(f"Voice cloning failed: {str(e)}")


async def text_to_speech_cartesia(text: str, voice_id: str = "a0e99841-438c-4a64-b679-ae501e7d6091", language: str = "en") -> str:
    """
    Convert text to speech using Cartesia Sonic 3 (multilingual model) for ultra-low latency
    
    Args:
        text: Text to convert to speech
        voice_id: Cartesia voice ID (default is Barbershop Man, or use cloned voice ID)
        language: Language code (en, es, hi) for multilingual support
    
    Returns:
        Path to generated audio file
    """
    try:
        audio_id = str(uuid.uuid4())
        output_path = f"/app/data/uploads/voice_{audio_id}.mp3"
        
        # Output format configuration
        output_format = {
            "container": "mp3",
            "encoding": "mp3",
            "sample_rate": 44100
        }
        
        # Generate speech with Cartesia using bytes method
        audio_data = b""
        async for chunk in cartesia_client.tts.bytes(
            model_id="sonic-3",
            transcript=text,
            voice={"id": voice_id},  # Use cloned voice or default
            output_format=output_format,
            language=language  # Dynamic language support (en, es, hi)
        ):
            audio_data += chunk
        
        # Save the complete audio file
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
