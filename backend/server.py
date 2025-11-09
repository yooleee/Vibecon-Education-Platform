from fastapi import FastAPI, UploadFile, File, HTTPException, Form, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from pydantic import BaseModel
import os
import json
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import asyncio
import time
import subprocess
import shutil
from livekit import api as livekit_api

from services.audio_service import extract_audio_from_video
from services.transcription_service import transcribe_audio
from services.embedding_service import generate_embeddings, compute_similarity
from services.query_service import answer_query, text_to_speech
from services.youtube_service import download_youtube_audio, validate_youtube_url
from services.summary_service import generate_lecture_summary, generate_summary_audio
from services.auth_service import verify_google_token, create_access_token
from utils.storage import save_lecture, load_lecture, list_lectures, delete_lecture
from utils.chunking import chunk_text
from models.user import create_or_update_user, load_user_by_google_id
from middleware.auth import get_current_user, get_current_user_optional

# Import V2 router (LangGraph-based)
from routers.graph_routes import router as graph_router
# Import quiz router
from routers.quiz_routes import router as quiz_router

# Check for ffmpeg on startup and attempt auto-install
def check_and_install_ffmpeg():
    """Check if ffmpeg is installed, attempt to install if missing"""
    if shutil.which("ffmpeg") is None:
        print("⚠️  WARNING: ffmpeg not found - attempting auto-installation...")
        try:
            subprocess.run(
                ["sudo", "apt-get", "update", "-qq"],
                check=True,
                capture_output=True
            )
            subprocess.run(
                ["sudo", "DEBIAN_FRONTEND=noninteractive", "apt-get", "install", "-y", "ffmpeg"],
                check=True,
                capture_output=True
            )
            print("✅ ffmpeg auto-installed successfully!")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to auto-install ffmpeg: {e}")
            print("   Please run manually: sudo apt-get install -y ffmpeg")
        except Exception as e:
            print(f"❌ Error during ffmpeg installation: {e}")
    else:
        ffmpeg_version = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            text=True
        ).stdout.split('\n')[0]
        print(f"✅ ffmpeg found: {ffmpeg_version}")

# Run ffmpeg check on startup
check_and_install_ffmpeg()

app = FastAPI(title="EduVoice API")

# Include V2 routes
app.include_router(graph_router)
# Include quiz routes
app.include_router(quiz_router)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data directories
UPLOAD_DIR = "/app/data/uploads"
LECTURE_DIR = "/app/data/lectures"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(LECTURE_DIR, exist_ok=True)

# Progress tracking storage
upload_progress = {}


class GoogleAuthRequest(BaseModel):
    token: str


class QueryRequest(BaseModel):
    lecture_id: str
    question: str
    mode: str = "text"  # "text" or "voice"
    language: str = "en"  # Language for response (en, es, hi)


class TTSRequest(BaseModel):
    text: str


class YouTubeRequest(BaseModel):
    youtube_url: str


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "EduVoice API"}


@app.post("/api/auth/google")
async def google_auth(request: GoogleAuthRequest):
    """Authenticate with Google OAuth"""
    try:
        # Verify Google token
        user_info = verify_google_token(request.token)
        
        if not user_info:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        
        # Create or update user
        user = create_or_update_user(
            google_id=user_info['google_id'],
            email=user_info['email'],
            name=user_info['name'],
            picture=user_info['picture']
        )
        
        # Generate JWT token
        access_token = create_access_token({"google_id": user['google_id']})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "google_id": user['google_id'],
                "email": user['email'],
                "name": user['name'],
                "picture": user['picture']
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Auth error: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication failed")


@app.get("/api/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return {
        "google_id": current_user['google_id'],
        "email": current_user['email'],
        "name": current_user['name'],
        "picture": current_user['picture']
    }


@app.get("/api/upload-progress/{lecture_id}")
async def get_upload_progress(lecture_id: str):
    """Get real-time progress for an upload"""
    async def event_generator():
        """Generate SSE events for progress updates"""
        while True:
            if lecture_id in upload_progress:
                progress_data = upload_progress[lecture_id]
                yield f"data: {json.dumps(progress_data)}\n\n"
                
                # If completed or errored, stop streaming
                if progress_data.get("status") in ["completed", "error"]:
                    break
            
            await asyncio.sleep(0.5)  # Poll every 500ms
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@app.post("/api/upload")
async def upload_lecture(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload and process a lecture video with voice cloning (requires authentication)"""
    lecture_id = str(uuid.uuid4())
    
    try:
        # Initialize progress tracking
        upload_progress[lecture_id] = {
            "status": "processing",
            "stage": "uploading",
            "progress": 0,
            "message": "Uploading file..."
        }
        
        # Validate file type
        if not file.filename.endswith(('.mp4', '.MP4')):
            raise HTTPException(status_code=400, detail="Only MP4 files are supported")
        
        # Save uploaded file
        upload_progress[lecture_id].update({"progress": 10, "message": "Saving file..."})
        video_path = os.path.join(UPLOAD_DIR, f"{lecture_id}.mp4")
        with open(video_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Extract audio
        upload_progress[lecture_id].update({
            "stage": "extracting",
            "progress": 20,
            "message": "Extracting audio..."
        })
        audio_path = os.path.join(UPLOAD_DIR, f"{lecture_id}.wav")
        extract_audio_from_video(video_path, audio_path)
        
        # STEP 1: Extract best voice clip for cloning (5-10 seconds)
        upload_progress[lecture_id].update({
            "stage": "analyzing",
            "progress": 30,
            "message": "Analyzing audio quality..."
        })
        print(f"\n🎤 Analyzing audio to find best voice sample...")
        analysis_start = time.time()
        from services.audio_analysis_service import extract_best_voice_clip
        voice_clip_path, clip_quality = extract_best_voice_clip(
            audio_path, 
            clip_duration=8.0,  # 8 seconds is optimal
            num_candidates=5  # Reduced from 10 to 5 for faster processing
        )
        analysis_time = time.time() - analysis_start
        print(f"⏱️ Audio analysis completed in {analysis_time:.2f}s")
        
        # STEP 2 & 3: Run voice cloning and transcription IN PARALLEL for speed
        upload_progress[lecture_id].update({
            "stage": "parallel_processing",
            "progress": 45,
            "message": "Cloning voice and transcribing (parallel)..."
        })
        print(f"\n⚡ Starting parallel processing (voice cloning + transcription)...")
        parallel_start = time.time()
        from services.voice_service import clone_voice_from_audio
        
        # Run both tasks concurrently
        cloned_voice_id, transcript = await asyncio.gather(
            clone_voice_from_audio(
                voice_clip_path,
                voice_name=f"Professor {lecture_id[:8]}"
            ),
            transcribe_audio(audio_path)
        )
        parallel_time = time.time() - parallel_start
        print(f"⏱️ Parallel processing completed in {parallel_time:.2f}s")
        print(f"✅ Parallel processing complete!")
        
        # Chunk transcript
        upload_progress[lecture_id].update({
            "stage": "chunking",
            "progress": 70,
            "message": "Processing transcript..."
        })
        chunking_start = time.time()
        chunks = chunk_text(transcript)
        chunking_time = time.time() - chunking_start
        print(f"⏱️ Chunking completed in {chunking_time:.2f}s")
        
        # Generate embeddings for each chunk
        upload_progress[lecture_id].update({
            "stage": "embeddings",
            "progress": 80,
            "message": "Generating embeddings..."
        })
        print(f"\n🧠 Generating embeddings for {len(chunks)} chunks...")
        embeddings_start = time.time()
        embeddings = await generate_embeddings(chunks)
        embeddings_time = time.time() - embeddings_start
        print(f"⏱️ Embeddings completed in {embeddings_time:.2f}s")
        
        # Calculate total processing time
        total_processing_time = analysis_time + parallel_time + chunking_time + embeddings_time
        print(f"\n📊 TOTAL PROCESSING TIME: {total_processing_time:.2f}s")
        print(f"   ├─ Audio Analysis: {analysis_time:.2f}s ({analysis_time/total_processing_time*100:.1f}%)")
        print(f"   ├─ Parallel (Voice+Transcribe): {parallel_time:.2f}s ({parallel_time/total_processing_time*100:.1f}%)")
        print(f"   ├─ Chunking: {chunking_time:.2f}s ({chunking_time/total_processing_time*100:.1f}%)")
        print(f"   └─ Embeddings: {embeddings_time:.2f}s ({embeddings_time/total_processing_time*100:.1f}%)")
        
        # Save lecture data with cloned voice ID
        upload_progress[lecture_id].update({
            "stage": "saving",
            "progress": 95,
            "message": "Finalizing..."
        })
        lecture_data = {
            "id": lecture_id,
            "user_id": current_user['google_id'],  # Link to user
            "filename": file.filename,
            "upload_date": datetime.now().isoformat(),
            "transcript": transcript,
            "chunks": chunks,
            "embeddings": embeddings,
            "video_path": video_path,
            "audio_path": audio_path,
            "cloned_voice_id": cloned_voice_id,  # Store the cloned voice ID!
            "voice_clip_path": voice_clip_path,
            "voice_clip_quality": clip_quality
        }
        
        save_lecture(lecture_id, lecture_data)
        
        # Mark as completed
        upload_progress[lecture_id].update({
            "status": "completed",
            "stage": "completed",
            "progress": 100,
            "message": "Lecture processed successfully!",
            "result": {
                "lecture_id": lecture_id,
                "filename": file.filename,
                "chunks_count": len(chunks),
                "cloned_voice_id": cloned_voice_id,
                "voice_cloning_quality": clip_quality["quality_score"]
            }
        })
        
        print(f"\n✅ Lecture processed successfully with cloned voice!")
        
        return {
            "lecture_id": lecture_id,
            "filename": file.filename,
            "status": "processed",
            "chunks_count": len(chunks),
            "cloned_voice_id": cloned_voice_id,
            "voice_cloning_quality": clip_quality["quality_score"]
        }
    
    except Exception as e:
        # Mark as error
        if lecture_id in upload_progress:
            upload_progress[lecture_id].update({
                "status": "error",
                "message": str(e)
            })
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload-youtube")
async def upload_youtube_lecture(request: YouTubeRequest, current_user: dict = Depends(get_current_user)):
    """Process a YouTube video as a lecture with voice cloning (requires authentication)"""
    lecture_id = str(uuid.uuid4())
    
    try:
        # Initialize progress tracking
        upload_progress[lecture_id] = {
            "status": "processing",
            "stage": "validating",
            "progress": 0,
            "message": "Validating YouTube URL..."
        }
        
        # Validate YouTube URL
        if not validate_youtube_url(request.youtube_url):
            raise HTTPException(status_code=400, detail="Invalid YouTube URL")
        
        print(f"\n🎬 Processing YouTube video: {request.youtube_url}")
        
        # Download audio from YouTube
        upload_progress[lecture_id].update({
            "stage": "downloading",
            "progress": 15,
            "message": "Downloading YouTube audio..."
        })
        audio_path, video_title = download_youtube_audio(request.youtube_url, UPLOAD_DIR)
        
        # Use video title as filename (sanitized)
        filename = f"{video_title}.mp4"
        
        # STEP 1: Extract best voice clip for cloning
        upload_progress[lecture_id].update({
            "stage": "analyzing",
            "progress": 30,
            "message": "Analyzing audio quality..."
        })
        print(f"\n🎤 Analyzing audio to find best voice sample...")
        analysis_start = time.time()
        from services.audio_analysis_service import extract_best_voice_clip
        voice_clip_path, clip_quality = extract_best_voice_clip(
            audio_path, 
            clip_duration=8.0,
            num_candidates=5  # Reduced from 10 to 5 for faster processing
        )
        analysis_time = time.time() - analysis_start
        print(f"⏱️ Audio analysis completed in {analysis_time:.2f}s")
        
        # STEP 2 & 3: Run voice cloning and transcription IN PARALLEL
        upload_progress[lecture_id].update({
            "stage": "parallel_processing",
            "progress": 45,
            "message": "Cloning voice and transcribing (parallel)..."
        })
        print(f"\n⚡ Starting parallel processing (voice cloning + transcription)...")
        parallel_start = time.time()
        from services.voice_service import clone_voice_from_audio
        
        # Run both tasks concurrently for faster processing
        cloned_voice_id, transcript = await asyncio.gather(
            clone_voice_from_audio(
                voice_clip_path,
                voice_name=f"YouTube {lecture_id[:8]}"
            ),
            transcribe_audio(audio_path)
        )
        parallel_time = time.time() - parallel_start
        print(f"⏱️ Parallel processing completed in {parallel_time:.2f}s")
        print(f"✅ Parallel processing complete!")
        
        # Chunk transcript
        upload_progress[lecture_id].update({
            "stage": "chunking",
            "progress": 70,
            "message": "Processing transcript..."
        })
        chunking_start = time.time()
        chunks = chunk_text(transcript)
        chunking_time = time.time() - chunking_start
        print(f"⏱️ Chunking completed in {chunking_time:.2f}s")
        
        # Generate embeddings
        upload_progress[lecture_id].update({
            "stage": "embeddings",
            "progress": 80,
            "message": "Generating embeddings..."
        })
        print(f"\n🧠 Generating embeddings for {len(chunks)} chunks...")
        embeddings_start = time.time()
        embeddings = await generate_embeddings(chunks)
        embeddings_time = time.time() - embeddings_start
        print(f"⏱️ Embeddings completed in {embeddings_time:.2f}s")
        
        # Calculate total processing time
        total_processing_time = analysis_time + parallel_time + chunking_time + embeddings_time
        print(f"\n📊 TOTAL PROCESSING TIME: {total_processing_time:.2f}s")
        print(f"   ├─ Audio Analysis: {analysis_time:.2f}s ({analysis_time/total_processing_time*100:.1f}%)")
        print(f"   ├─ Parallel (Voice+Transcribe): {parallel_time:.2f}s ({parallel_time/total_processing_time*100:.1f}%)")
        print(f"   ├─ Chunking: {chunking_time:.2f}s ({chunking_time/total_processing_time*100:.1f}%)")
        print(f"   └─ Embeddings: {embeddings_time:.2f}s ({embeddings_time/total_processing_time*100:.1f}%)")
        
        # Save lecture data
        upload_progress[lecture_id].update({
            "stage": "saving",
            "progress": 95,
            "message": "Finalizing..."
        })
        lecture_data = {
            "id": lecture_id,
            "user_id": current_user['google_id'],  # Link to user
            "filename": filename,
            "upload_date": datetime.now().isoformat(),
            "transcript": transcript,
            "chunks": chunks,
            "embeddings": embeddings,
            "video_path": None,  # No video file for YouTube
            "audio_path": audio_path,
            "cloned_voice_id": cloned_voice_id,
            "voice_clip_path": voice_clip_path,
            "voice_clip_quality": clip_quality,
            "source": "youtube",
            "youtube_url": request.youtube_url
        }
        
        save_lecture(lecture_id, lecture_data)
        
        # Mark as completed
        upload_progress[lecture_id].update({
            "status": "completed",
            "stage": "completed",
            "progress": 100,
            "message": "YouTube lecture processed successfully!",
            "result": {
                "lecture_id": lecture_id,
                "filename": filename,
                "chunks_count": len(chunks),
                "cloned_voice_id": cloned_voice_id,
                "voice_cloning_quality": clip_quality["quality_score"],
                "source": "youtube"
            }
        })
        
        print(f"\n✅ YouTube lecture processed successfully!")
        
        return {
            "lecture_id": lecture_id,
            "filename": filename,
            "status": "processed",
            "chunks_count": len(chunks),
            "cloned_voice_id": cloned_voice_id,
            "voice_cloning_quality": clip_quality["quality_score"],
            "source": "youtube"
        }
    
    except Exception as e:
        print(f"❌ YouTube processing error: {str(e)}")
        # Mark as error
        if lecture_id in upload_progress:
            upload_progress[lecture_id].update({
                "status": "error",
                "message": str(e)
            })
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/lectures")
async def get_lectures(current_user: Optional[dict] = Depends(get_current_user_optional)):
    """List lectures - shows user's lectures + demos"""
    try:
        user_id = current_user['google_id'] if current_user else None
        lectures = list_lectures(user_id)
        return {"lectures": lectures}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/lectures/{lecture_id}")
async def get_lecture(lecture_id: str):
    """Get details of a specific lecture"""
    try:
        lecture = load_lecture(lecture_id)
        if not lecture:
            raise HTTPException(status_code=404, detail="Lecture not found")
        
        # Don't send embeddings to frontend (too large)
        lecture_info = {
            "id": lecture["id"],
            "filename": lecture["filename"],
            "upload_date": lecture["upload_date"],
            "transcript": lecture["transcript"],
            "chunks_count": len(lecture["chunks"])
        }
        return lecture_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/lectures/{lecture_id}")
async def delete_lecture_endpoint(lecture_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a lecture and all associated files (requires authentication and ownership)"""
    try:
        # Load lecture to check ownership
        lecture = load_lecture(lecture_id)
        if not lecture:
            raise HTTPException(status_code=404, detail="Lecture not found")
        
        # Check if user owns the lecture (or if it's a demo they can't delete)
        lecture_user_id = lecture.get("user_id")
        if lecture_user_id is None:
            raise HTTPException(status_code=403, detail="Cannot delete demo lectures")
        
        if lecture_user_id != current_user['google_id']:
            raise HTTPException(status_code=403, detail="Not authorized to delete this lecture")
        
        # Delete the lecture
        success = delete_lecture(lecture_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete lecture")
        
        return {"message": "Lecture deleted successfully", "lecture_id": lecture_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/query")
async def query_lecture(request: QueryRequest):
    """Ask a question about a lecture - Voice-first interaction with cloned professor voice"""
    try:
        # Load lecture data
        lecture = load_lecture(request.lecture_id)
        if not lecture:
            raise HTTPException(status_code=404, detail="Lecture not found")
        
        # Generate embedding for question
        question_embedding = await generate_embeddings([request.question])
        
        # Find most relevant chunks
        similarities = compute_similarity(question_embedding[0], lecture["embeddings"])
        
        # Get top 3 most relevant chunks
        top_indices = sorted(range(len(similarities)), key=lambda i: similarities[i], reverse=True)[:3]
        relevant_chunks = [lecture["chunks"][i] for i in top_indices]
        
        # Generate answer using GPT-4o with language support
        answer = await answer_query(request.question, relevant_chunks, request.language)
        
        # Use the CLONED VOICE for response!
        from services.voice_service import text_to_speech_cartesia
        voice_id = lecture.get("cloned_voice_id", "a0e99841-438c-4a64-b679-ae501e7d6091")
        print(f"🎙️ Using cloned professor voice: {voice_id}")
        
        audio_path = await text_to_speech_cartesia(answer, voice_id=voice_id, language=request.language)
        audio_filename = os.path.basename(audio_path)
        audio_url = f"/api/audio/{audio_filename}"
        
        return {
            "answer": answer,
            "relevant_chunks": relevant_chunks,
            "audio_url": audio_url,
            "audio_path": audio_path,
            "using_cloned_voice": voice_id != "a0e99841-438c-4a64-b679-ae501e7d6091",
            "language": request.language
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/voice-query-stream")
async def voice_query_stream(lecture_id: str = Form(...), audio: UploadFile = File(...), language: str = Form("en")):
    """Streaming voice-first query - OPTIMIZED with parallel processing and multilingual support"""
    try:
        import asyncio
        
        # Save uploaded audio
        audio_id = str(uuid.uuid4())
        audio_path = os.path.join(UPLOAD_DIR, f"question_{audio_id}.wav")
        
        with open(audio_path, "wb") as f:
            content = await audio.read()
            f.write(content)
        
        # Load lecture data early
        lecture = load_lecture(lecture_id)
        if not lecture:
            raise HTTPException(status_code=404, detail="Lecture not found")
        
        # OPTIMIZATION 1: Run transcription in parallel with loading
        print("🚀 Starting parallel processing...")
        
        # Transcribe question
        transcription_task = transcribe_audio(audio_path)
        question_text = await transcription_task
        
        print(f"✅ Question transcribed: {question_text}")
        
        # OPTIMIZATION 2: Generate embedding and find chunks immediately
        question_embedding = await generate_embeddings([question_text])
        similarities = compute_similarity(question_embedding[0], lecture["embeddings"])
        top_indices = sorted(range(len(similarities)), key=lambda i: similarities[i], reverse=True)[:3]
        relevant_chunks = [lecture["chunks"][i] for i in top_indices]
        
        print(f"✅ Found {len(relevant_chunks)} relevant chunks")
        
        # Get cloned voice ID
        voice_id = lecture.get("cloned_voice_id", "a0e99841-438c-4a64-b679-ae501e7d6091")
        
        # Stream the response with optimized chunk sizes and language support
        from services.streaming_service import stream_voice_response
        
        async def event_generator():
            """Generate SSE events"""
            # Send question first
            yield f"data: {json.dumps({'type': 'question', 'data': {'text': question_text}})}\n\n"
            
            # Stream AI response with phrase-level audio and language support
            async for event in stream_voice_response(question_text, relevant_chunks, voice_id, language):
                yield f"data: {json.dumps(event)}\n\n"
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/voice-query")
async def voice_query(lecture_id: str = Form(...), audio: UploadFile = File(...), language: str = Form("en")):
    """Voice-first query - upload audio question, get audio answer in professor's voice"""
    try:
        # Save uploaded audio
        audio_id = str(uuid.uuid4())
        audio_path = os.path.join(UPLOAD_DIR, f"question_{audio_id}.wav")
        
        with open(audio_path, "wb") as f:
            content = await audio.read()
            f.write(content)
        
        # Transcribe question
        question_text = await transcribe_audio(audio_path)
        
        # Load lecture
        lecture = load_lecture(lecture_id)
        if not lecture:
            raise HTTPException(status_code=404, detail="Lecture not found")
        
        # Generate embedding and find relevant chunks
        question_embedding = await generate_embeddings([question_text])
        similarities = compute_similarity(question_embedding[0], lecture["embeddings"])
        top_indices = sorted(range(len(similarities)), key=lambda i: similarities[i], reverse=True)[:3]
        relevant_chunks = [lecture["chunks"][i] for i in top_indices]
        
        # Generate answer with language support
        answer = await answer_query(question_text, relevant_chunks, language)
        
        # Generate voice response with CLONED PROFESSOR VOICE!
        from services.voice_service import text_to_speech_cartesia
        voice_id = lecture.get("cloned_voice_id", "a0e99841-438c-4a64-b679-ae501e7d6091")
        print(f"🎙️ Responding in professor's cloned voice: {voice_id}")
        
        audio_path = await text_to_speech_cartesia(answer, voice_id=voice_id, language=language)
        audio_filename = os.path.basename(audio_path)
        
        return {
            "question": question_text,
            "answer": answer,
            "audio_url": f"/api/audio/{audio_filename}",
            "relevant_chunks": relevant_chunks,
            "using_cloned_voice": True,
            "language": language
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/speak")
async def speak(request: TTSRequest):
    """Convert text to speech"""
    try:
        audio_url = await text_to_speech(request.text)
        return {"audio_url": audio_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/audio/{audio_filename}")
async def get_audio(audio_filename: str):
    """Serve audio files (TTS responses)"""
    try:
        # Support both old and new naming conventions
        audio_path = f"/app/data/uploads/{audio_filename}"
        
        if not os.path.exists(audio_path):
            raise HTTPException(status_code=404, detail="Audio file not found")
        
        return FileResponse(audio_path, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/lectures/{lecture_id}/summary")
async def generate_summary(lecture_id: str):
    """Generate a summary of the lecture with audio in professor's voice"""
    try:
        # Load lecture
        lecture = load_lecture(lecture_id)
        if not lecture:
            raise HTTPException(status_code=404, detail="Lecture not found")
        
        # Check if summary already exists
        if lecture.get("summary"):
            print(f"📋 Using cached summary for lecture {lecture_id}")
            return {
                "summary": lecture["summary"]["text"],
                "audio_url": lecture["summary"]["audio_url"],
                "word_count": lecture["summary"]["word_count"],
                "cached": True
            }
        
        print(f"\n📝 Generating new summary for: {lecture.get('filename')}")
        
        # Generate summary
        summary_start = time.time()
        summary_data = await generate_lecture_summary(
            lecture["transcript"],
            lecture.get("filename", "this lecture")
        )
        summary_time = time.time() - summary_start
        print(f"⏱️ Summary generation completed in {summary_time:.2f}s")
        print(f"📊 Summary: {summary_data['word_count']} words, {summary_data['detail_level']} level")
        
        # Generate audio with cloned professor voice
        audio_start = time.time()
        voice_id = lecture.get("cloned_voice_id", "a0e99841-438c-4a64-b679-ae501e7d6091")
        print(f"🎙️ Generating audio with cloned voice: {voice_id}")
        
        # Use the PLAIN text version for audio (no markdown)
        audio_path = await generate_summary_audio(
            summary_data["summary_plain"],  # Use clean version
            voice_id=voice_id,
            language="en"
        )
        audio_time = time.time() - audio_start
        print(f"⏱️ Audio generation completed in {audio_time:.2f}s")
        
        audio_filename = os.path.basename(audio_path)
        audio_url = f"/api/audio/{audio_filename}"
        
        # Save summary to lecture data (cache it)
        lecture["summary"] = {
            "text": summary_data["summary"],
            "audio_url": audio_url,
            "audio_path": audio_path,
            "word_count": summary_data["word_count"],
            "detail_level": summary_data["detail_level"],
            "generated_at": datetime.now().isoformat()
        }
        save_lecture(lecture_id, lecture)
        
        print(f"✅ Summary saved and cached for future use")
        
        return {
            "summary": summary_data["summary"],
            "audio_url": audio_url,
            "word_count": summary_data["word_count"],
            "detail_level": summary_data["detail_level"],
            "cached": False
        }
    
    except Exception as e:
        print(f"❌ Summary generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class LiveKitSessionRequest(BaseModel):
    lecture_id: str


class LiveKitSessionResponse(BaseModel):
    token: str
    url: str
    room_name: str
    lecture_title: str


@app.post("/api/livekit/session/start", response_model=LiveKitSessionResponse)
async def start_livekit_session(request: LiveKitSessionRequest, current_user: dict = Depends(get_current_user)):
    """Start a LiveKit real-time voice session for a specific lecture"""
    try:
        # Load lecture data
        lecture = load_lecture(request.lecture_id)
        if not lecture:
            raise HTTPException(status_code=404, detail="Lecture not found")
        
        # Generate unique room name
        room_name = f"lecture-{request.lecture_id}-{current_user['google_id']}-{int(datetime.now().timestamp())}"
        
        # Create LiveKit access token
        livekit_url = os.getenv("LIVEKIT_URL")
        livekit_api_key = os.getenv("LIVEKIT_API_KEY")
        livekit_api_secret = os.getenv("LIVEKIT_API_SECRET")
        
        if not all([livekit_url, livekit_api_key, livekit_api_secret]):
            raise HTTPException(status_code=500, detail="LiveKit credentials not configured")
        
        # Create token with proper grants
        token = livekit_api.AccessToken(livekit_api_key, livekit_api_secret)
        token = token.with_identity(current_user['google_id'])
        token = token.with_name(current_user['name'])
        token = token.with_grants(livekit_api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True
        ))
        token = token.with_attributes({
            "lecture_id": request.lecture_id,
            "user_id": current_user['google_id'],
            "lecture_title": lecture.get("filename", "Unknown Lecture"),
        })
        
        # Generate JWT token
        jwt_token = token.to_jwt()
        
        print(f"🎙️ Created LiveKit session: room={room_name}, lecture={request.lecture_id}, user={current_user['google_id']}")
        print(f"🔑 Token identity: {current_user['google_id']}, room: {room_name}")
        
        return LiveKitSessionResponse(
            token=jwt_token,
            url=livekit_url,
            room_name=room_name,
            lecture_title=lecture.get("filename", "Unknown Lecture")
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ LiveKit session creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
