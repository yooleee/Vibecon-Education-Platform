import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client with Emergent LLM key
client = AsyncOpenAI(
    api_key=os.getenv("EMERGENT_LLM_KEY")
)


async def transcribe_audio(audio_path: str) -> str:
    """
    Transcribe audio file using OpenAI Whisper API
    
    Args:
        audio_path: Path to audio file (WAV format)
    
    Returns:
        Transcript text
    """
    try:
        with open(audio_path, "rb") as audio_file:
            transcript = await client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
        
        return transcript
    
    except Exception as e:
        raise Exception(f"Transcription failed: {str(e)}")
