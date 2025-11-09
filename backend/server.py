from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from pydantic import BaseModel
import os
import json
from typing import List, Optional
import uuid
from datetime import datetime

from services.audio_service import extract_audio_from_video
from services.transcription_service import transcribe_audio
from services.embedding_service import generate_embeddings, compute_similarity
from services.query_service import answer_query, text_to_speech
from services.youtube_service import download_youtube_audio, validate_youtube_url
from utils.storage import save_lecture, load_lecture, list_lectures, delete_lecture
from utils.chunking import chunk_text

# Import V2 router (LangGraph-based)
from routers.graph_routes import router as graph_router

app = FastAPI(title="EduVoice API")

# Include V2 routes
app.include_router(graph_router)

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


@app.post("/api/upload")
async def upload_lecture(file: UploadFile = File(...)):
    """Upload and process a lecture video with voice cloning"""
    try:
        # Validate file type
        if not file.filename.endswith(('.mp4', '.MP4')):
            raise HTTPException(status_code=400, detail="Only MP4 files are supported")
        
        # Generate unique ID
        lecture_id = str(uuid.uuid4())
        
        # Save uploaded file
        video_path = os.path.join(UPLOAD_DIR, f"{lecture_id}.mp4")
        with open(video_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Extract audio
        audio_path = os.path.join(UPLOAD_DIR, f"{lecture_id}.wav")
        extract_audio_from_video(video_path, audio_path)
        
        # STEP 1: Extract best voice clip for cloning (5-10 seconds)
        print(f"\n🎤 Analyzing audio to find best voice sample...")
        from services.audio_analysis_service import extract_best_voice_clip
        voice_clip_path, clip_quality = extract_best_voice_clip(
            audio_path, 
            clip_duration=8.0,  # 8 seconds is optimal
            num_candidates=10
        )
        
        # STEP 2: Clone the voice using Cartesia
        print(f"\n🔬 Cloning professor's voice...")
        from services.voice_service import clone_voice_from_audio
        cloned_voice_id = await clone_voice_from_audio(
            voice_clip_path,
            voice_name=f"Professor {lecture_id[:8]}"
        )
        
        # Transcribe audio
        print(f"\n📝 Transcribing lecture...")
        transcript = await transcribe_audio(audio_path)
        
        # Chunk transcript
        chunks = chunk_text(transcript)
        
        # Generate embeddings for each chunk
        print(f"\n🧠 Generating embeddings...")
        embeddings = await generate_embeddings(chunks)
        
        # Save lecture data with cloned voice ID
        lecture_data = {
            "id": lecture_id,
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
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload-youtube")
async def upload_youtube_lecture(request: YouTubeRequest):
    """Process a YouTube video as a lecture with voice cloning"""
    try:
        # Validate YouTube URL
        if not validate_youtube_url(request.youtube_url):
            raise HTTPException(status_code=400, detail="Invalid YouTube URL")
        
        # Generate unique ID
        lecture_id = str(uuid.uuid4())
        
        print(f"\n🎬 Processing YouTube video: {request.youtube_url}")
        
        # Download audio from YouTube
        audio_path, video_title = download_youtube_audio(request.youtube_url, UPLOAD_DIR)
        
        # Use video title as filename (sanitized)
        filename = f"{video_title}.mp4"
        
        # STEP 1: Extract best voice clip for cloning
        print(f"\n🎤 Analyzing audio to find best voice sample...")
        from services.audio_analysis_service import extract_best_voice_clip
        voice_clip_path, clip_quality = extract_best_voice_clip(
            audio_path, 
            clip_duration=8.0,
            num_candidates=10
        )
        
        # STEP 2: Clone the voice
        print(f"\n🔬 Cloning voice...")
        from services.voice_service import clone_voice_from_audio
        cloned_voice_id = await clone_voice_from_audio(
            voice_clip_path,
            voice_name=f"YouTube {lecture_id[:8]}"
        )
        
        # Transcribe audio
        print(f"\n📝 Transcribing audio...")
        transcript = await transcribe_audio(audio_path)
        
        # Chunk transcript
        chunks = chunk_text(transcript)
        
        # Generate embeddings
        print(f"\n🧠 Generating embeddings...")
        embeddings = await generate_embeddings(chunks)
        
        # Save lecture data
        lecture_data = {
            "id": lecture_id,
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
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/lectures")
async def get_lectures():
    """List all uploaded lectures"""
    try:
        lectures = list_lectures()
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
async def delete_lecture_endpoint(lecture_id: str):
    """Delete a lecture and all associated files"""
    try:
        success = delete_lecture(lecture_id)
        if not success:
            raise HTTPException(status_code=404, detail="Lecture not found")
        
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
