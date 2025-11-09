"""
Summary Service - Generate lecture summaries using AI
"""
import os
import re
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client
client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


def strip_markdown(text: str) -> str:
    """
    Remove markdown formatting for clean text-to-speech
    
    Args:
        text: Text with markdown formatting
    
    Returns:
        Plain text without markdown symbols
    """
    # Remove bold/italic markers
    text = re.sub(r'\*\*\*(.+?)\*\*\*', r'\1', text)  # Bold + Italic
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)      # Bold
    text = re.sub(r'\*(.+?)\*', r'\1', text)          # Italic
    text = re.sub(r'__(.+?)__', r'\1', text)          # Bold (underscore)
    text = re.sub(r'_(.+?)_', r'\1', text)            # Italic (underscore)
    
    # Remove headers
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
    
    # Remove links but keep text
    text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)
    
    # Remove code blocks
    text = re.sub(r'`{3}.*?`{3}', '', text, flags=re.DOTALL)
    text = re.sub(r'`(.+?)`', r'\1', text)
    
    # Remove horizontal rules
    text = re.sub(r'^[-*_]{3,}$', '', text, flags=re.MULTILINE)
    
    # Clean up multiple newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()


async def generate_lecture_summary(transcript: str, lecture_title: str = "this lecture") -> dict:
    """
    Generate a comprehensive summary of a lecture
    
    Args:
        transcript: Full lecture transcript
        lecture_title: Title of the lecture for context
    
    Returns:
        Dictionary with summary text and metadata
    """
    try:
        # Calculate appropriate summary length based on transcript length
        # Make summaries MUCH shorter - aim for 30-60 seconds of audio
        transcript_length = len(transcript)
        
        if transcript_length < 1000:
            max_words = 75  # ~30 seconds
            detail_level = "brief"
        elif transcript_length < 5000:
            max_words = 150  # ~60 seconds
            detail_level = "moderate"
        else:
            max_words = 200  # ~80 seconds max
            detail_level = "comprehensive"
        
        # Create the prompt for summary generation
        prompt = f"""You are an educational AI assistant. Generate a CONCISE summary of the following lecture transcript.

Lecture: {lecture_title}

Your summary should:
1. Be VERY concise and to-the-point (approximately {max_words} words)
2. Focus ONLY on the most important key points
3. Be conversational and natural for text-to-speech
4. Avoid repetition and filler words
5. Use simple, clear language

Transcript:
{transcript}

Please provide a brief summary that captures the essence of this lecture in approximately {max_words} words."""

        # Generate summary using GPT-4
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at creating ultra-concise, clear summaries of academic content. Keep summaries brief and conversational."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=max_words * 2  # Rough token estimate
        )
        
        summary_text = response.choices[0].message.content.strip()
        
        return {
            "summary": summary_text,
            "summary_plain": strip_markdown(summary_text),  # Clean version for TTS
            "word_count": len(summary_text.split()),
            "transcript_length": transcript_length,
            "detail_level": detail_level
        }
    
    except Exception as e:
        raise Exception(f"Summary generation failed: {str(e)}")


async def generate_summary_audio(summary_text: str, voice_id: str, language: str = "en") -> str:
    """
    Convert summary text to speech using cloned professor voice
    
    Args:
        summary_text: Summary text to convert (should be plain text, no markdown)
        voice_id: Cartesia voice ID (cloned professor voice)
        language: Language code
    
    Returns:
        Path to generated audio file
    """
    try:
        from services.voice_service import text_to_speech_cartesia
        
        # Strip any remaining markdown just to be safe
        clean_text = strip_markdown(summary_text)
        
        # Generate audio using the cloned voice with CLEAN text
        audio_path = await text_to_speech_cartesia(
            clean_text,
            voice_id=voice_id,
            language=language
        )
        
        return audio_path
    
    except Exception as e:
        raise Exception(f"Summary audio generation failed: {str(e)}")
