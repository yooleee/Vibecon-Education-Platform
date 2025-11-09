from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
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
from utils.storage import save_lecture, load_lecture, list_lectures
from utils.chunking import chunk_text

app = FastAPI(title="EduVoice API")

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


class TTSRequest(BaseModel):
    text: str


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "EduVoice API"}


@app.post("/api/upload")
async def upload_lecture(file: UploadFile = File(...)):
    """Upload and process a lecture video"""
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
        
        # Transcribe audio
        transcript = await transcribe_audio(audio_path)
        
        # Chunk transcript
        chunks = chunk_text(transcript)
        
        # Generate embeddings for each chunk
        embeddings = await generate_embeddings(chunks)
        
        # Save lecture data
        lecture_data = {
            "id": lecture_id,
            "filename": file.filename,
            "upload_date": datetime.now().isoformat(),
            "transcript": transcript,
            "chunks": chunks,
            "embeddings": embeddings,
            "video_path": video_path,
            "audio_path": audio_path
        }
        
        save_lecture(lecture_id, lecture_data)
        
        return {
            "lecture_id": lecture_id,
            "filename": file.filename,
            "status": "processed",
            "chunks_count": len(chunks)
        }
    
    except Exception as e:
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


@app.post("/api/query")
async def query_lecture(request: QueryRequest):
    """Ask a question about a lecture - Voice-first interaction"""
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
        
        # Generate answer using GPT-4o
        answer = await answer_query(request.question, relevant_chunks)
        
        # VOICE-FIRST: Always generate audio response with Cartesia
        from services.voice_service import text_to_speech_cartesia
        audio_path = await text_to_speech_cartesia(answer)
        audio_filename = os.path.basename(audio_path)
        audio_url = f"/api/audio/{audio_filename}"
        
        return {
            "answer": answer,
            "relevant_chunks": relevant_chunks,
            "audio_url": audio_url,
            "audio_path": audio_path
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/voice-query")
async def voice_query(lecture_id: str = Form(...), audio: UploadFile = File(...)):
    """Voice-first query - upload audio question, get audio answer"""
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
        
        # Generate answer
        answer = await answer_query(question_text, relevant_chunks)
        
        # Generate voice response with Cartesia
        from services.voice_service import text_to_speech_cartesia
        audio_path = await text_to_speech_cartesia(answer)
        audio_filename = os.path.basename(audio_path)
        
        return {
            "question": question_text,
            "answer": answer,
            "audio_url": f"/api/audio/{audio_filename}",
            "relevant_chunks": relevant_chunks
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
