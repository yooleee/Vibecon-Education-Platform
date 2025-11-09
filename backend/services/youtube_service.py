import yt_dlp
import os
import uuid


def download_youtube_audio(youtube_url: str, output_dir: str) -> tuple[str, str]:
    """
    Download audio from YouTube video
    
    Args:
        youtube_url: YouTube video URL
        output_dir: Directory to save the audio file
    
    Returns:
        Tuple of (audio_file_path, video_title)
    """
    try:
        # Generate unique ID for this download
        download_id = str(uuid.uuid4())
        output_template = os.path.join(output_dir, f'{download_id}.%(ext)s')
        
        # yt-dlp options for audio-only download
        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'wav',
                'preferredquality': '192',
            }],
            'outtmpl': output_template,
            'quiet': False,
            'no_warnings': False,
            'extract_flat': False,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract video info first
            info = ydl.extract_info(youtube_url, download=False)
            video_title = info.get('title', 'Unknown Title')
            
            print(f"📺 Downloading audio from: {video_title}")
            
            # Download the audio
            ydl.download([youtube_url])
            
            # The output file will be .wav after post-processing
            audio_path = os.path.join(output_dir, f'{download_id}.wav')
            
            if not os.path.exists(audio_path):
                raise Exception(f"Audio file not found after download: {audio_path}")
            
            print(f"✅ Audio downloaded successfully: {audio_path}")
            
            return audio_path, video_title
            
    except Exception as e:
        print(f"❌ YouTube download error: {str(e)}")
        raise Exception(f"Failed to download YouTube audio: {str(e)}")


def validate_youtube_url(url: str) -> bool:
    """
    Validate if URL is a valid YouTube URL
    
    Args:
        url: URL to validate
    
    Returns:
        True if valid YouTube URL, False otherwise
    """
    youtube_domains = ['youtube.com', 'youtu.be', 'www.youtube.com', 'm.youtube.com']
    
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return any(domain in parsed.netloc for domain in youtube_domains)
    except:
        return False
