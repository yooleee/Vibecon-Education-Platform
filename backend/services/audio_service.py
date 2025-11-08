import ffmpeg
import os


def extract_audio_from_video(video_path: str, audio_path: str) -> str:
    """
    Extract audio from video file and convert to 16kHz mono WAV
    
    Args:
        video_path: Path to input MP4 file
        audio_path: Path to output WAV file
    
    Returns:
        Path to extracted audio file
    """
    try:
        # Use ffmpeg to extract audio
        stream = ffmpeg.input(video_path)
        stream = ffmpeg.output(stream, audio_path, 
                              acodec='pcm_s16le',  # 16-bit PCM
                              ac=1,                 # Mono
                              ar='16000')           # 16kHz sample rate
        ffmpeg.run(stream, overwrite_output=True, capture_stdout=True, capture_stderr=True)
        
        return audio_path
    
    except ffmpeg.Error as e:
        error_message = e.stderr.decode() if e.stderr else str(e)
        raise Exception(f"FFmpeg error: {error_message}")
    except Exception as e:
        raise Exception(f"Audio extraction failed: {str(e)}")
