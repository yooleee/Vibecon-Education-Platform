"""
Summary Service - Generate lecture summaries using AI
"""
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client
client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


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
        transcript_length = len(transcript)
        
        if transcript_length < 1000:
            max_words = 150
            detail_level = "brief"
        elif transcript_length < 5000:
            max_words = 300
            detail_level = "moderate"
        else:
            max_words = 500
            detail_level = "comprehensive"
        
        # Create the prompt for summary generation
        prompt = f"""You are an educational AI assistant. Generate a clear and concise summary of the following lecture transcript.

Lecture: {lecture_title}

Your summary should:
1. Capture the main topics and key concepts
2. Highlight important points and takeaways
3. Be well-structured with clear sections
4. Use approximately {max_words} words
5. Be suitable for students to quickly understand the lecture content

Transcript:
{transcript}

Please provide a {detail_level} summary that a student can use to review the main points of this lecture."""

        # Generate summary using GPT-4
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert educational content summarizer. Create clear, concise, and informative summaries of academic lectures."
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
        summary_text: Summary text to convert
        voice_id: Cartesia voice ID (cloned professor voice)
        language: Language code
    
    Returns:
        Path to generated audio file
    """
    try:
        from services.voice_service import text_to_speech_cartesia
        
        # Generate audio using the cloned voice
        audio_path = await text_to_speech_cartesia(
            summary_text,
            voice_id=voice_id,
            language=language
        )
        
        return audio_path
    
    except Exception as e:
        raise Exception(f"Summary audio generation failed: {str(e)}")
