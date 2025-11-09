import os
import subprocess
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client with direct OpenAI API key for Whisper transcription
client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

# Whisper API has a 25MB file size limit
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB in bytes


def compress_audio(input_path: str, output_path: str, target_bitrate: str = "64k") -> str:
    """
    Compress audio file to reduce size using ffmpeg
    
    Args:
        input_path: Path to input audio file
        output_path: Path to save compressed audio
        target_bitrate: Target audio bitrate (default: 64k for voice)
    
    Returns:
        Path to compressed audio file
    """
    try:
        # Compress audio: mono, lower sample rate, lower bitrate
        command = [
            'ffmpeg',
            '-i', input_path,
            '-ac', '1',  # Convert to mono
            '-ar', '16000',  # Sample rate 16kHz (optimal for speech)
            '-b:a', target_bitrate,  # Audio bitrate
            '-y',  # Overwrite output file
            output_path
        ]
        
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True
        )
        
        print(f"✅ Audio compressed: {os.path.getsize(input_path)} -> {os.path.getsize(output_path)} bytes")
        return output_path
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Audio compression failed: {e.stderr.decode()}")
        raise Exception(f"Audio compression failed: {str(e)}")


async def transcribe_audio(audio_path: str) -> str:
    """
    Transcribe audio file using OpenAI Whisper API
    Automatically compresses audio if it exceeds size limit
    
    Args:
        audio_path: Path to audio file (WAV format)
    
    Returns:
        Transcript text
    """
    try:
        file_size = os.path.getsize(audio_path)
        print(f"📊 Audio file size: {file_size / (1024*1024):.2f} MB")
        
        # If file is too large, compress it first
        if file_size > MAX_FILE_SIZE:
            print(f"⚠️ File exceeds Whisper API limit ({MAX_FILE_SIZE / (1024*1024)} MB), compressing...")
            compressed_path = audio_path.replace('.wav', '_compressed.wav')
            audio_path = compress_audio(audio_path, compressed_path, target_bitrate="64k")
            file_size = os.path.getsize(audio_path)
            print(f"✅ Compressed file size: {file_size / (1024*1024):.2f} MB")
        
        with open(audio_path, "rb") as audio_file:
            transcript = await client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
        
        # Clean up compressed file if it was created
        if '_compressed.wav' in audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
        
        # Handle different response formats
        if isinstance(transcript, str):
            return transcript
        elif hasattr(transcript, 'text'):
            return transcript.text
        else:
            return str(transcript)
    
    except Exception as e:
        raise Exception(f"Transcription failed: {str(e)}")
