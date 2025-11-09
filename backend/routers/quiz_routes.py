"""Quiz API routes - voice-first quiz generation and evaluation"""
from fastapi import APIRouter, HTTPException, Form, UploadFile, File, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import uuid
from datetime import datetime, timezone

from models.quiz import QuizConfig, QuizSession, QuizQuestion, QuizAnswer, QuestionType
from services.quiz_service import QuizService
from utils.storage import load_lecture, save_lecture
from services.transcription_service import transcribe_audio
from services.voice_service import text_to_speech_cartesia
from middleware.auth import get_current_user, get_current_user_optional

router = APIRouter(prefix="/api/quiz", tags=["quiz"])

# In-memory storage for active sessions (production should use Redis)
active_sessions = {}

quiz_service = QuizService()


class StartQuizRequest(BaseModel):
    lecture_id: str
    num_questions: int = 5
    question_types: List[QuestionType] = [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE, QuestionType.OPEN_ENDED]
    difficulty: str = "medium"
    voice_mode: bool = True


class SubmitAnswerRequest(BaseModel):
    session_id: str
    question_id: str
    user_answer: str
    provide_hint: bool = False


@router.post("/session/start")
async def start_quiz_session(
    request: StartQuizRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Start a new quiz session"""
    try:
        # Load lecture
        lecture = load_lecture(request.lecture_id)
        if not lecture:
            raise HTTPException(status_code=404, detail="Lecture not found")
        
        print(f"\n🎯 Starting quiz for lecture: {lecture.get('filename')}")
        
        # Create quiz config
        config = QuizConfig(
            num_questions=request.num_questions,
            question_types=request.question_types,
            difficulty=request.difficulty,
            voice_mode=request.voice_mode
        )
        
        # Generate questions using LLM
        print(f"🤖 Generating {config.num_questions} questions...")
        questions = await quiz_service.generate_questions(
            lecture["transcript"],
            config
        )
        
        print(f"✅ Generated {len(questions)} questions")
        
        # Create session
        session_id = str(uuid.uuid4())
        session = QuizSession(
            session_id=session_id,
            user_id=current_user.get('google_id') if current_user else None,
            lecture_id=request.lecture_id,
            config=config,
            questions=questions,
            answers=[],
            current_question_index=0,
            score=0,
            total_questions=len(questions),
            created_at=datetime.now(timezone.utc),
            is_completed=False
        )
        
        # Store in memory
        active_sessions[session_id] = session
        
        # Get first question
        first_question = questions[0] if questions else None
        
        # Generate audio if voice mode
        audio_url = None
        if request.voice_mode and first_question:
            voice_id = lecture.get("cloned_voice_id", "a0e99841-438c-4a64-b679-ae501e7d6091")
            audio_path = await text_to_speech_cartesia(
                first_question.question_text,
                voice_id=voice_id,
                language="en"
            )
            audio_filename = os.path.basename(audio_path)
            audio_url = f"/api/audio/{audio_filename}"
        
        return {
            "session_id": session_id,
            "lecture_id": request.lecture_id,
            "total_questions": len(questions),
            "current_question": first_question.model_dump() if first_question else None,
            "current_question_index": 0,
            "audio_url": audio_url,
            "voice_mode": request.voice_mode
        }
    
    except Exception as e:
        print(f"❌ Error starting quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}/next")
async def get_next_question(session_id: str):
    """Get the next question in the quiz"""
    try:
        # Get session
        session = active_sessions.get(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Check if quiz is complete
        if session.current_question_index >= len(session.questions):
            return {
                "completed": True,
                "score": session.score,
                "total_questions": session.total_questions,
                "percentage": round((session.score / session.total_questions) * 100)
            }
        
        # Get current question
        question = session.questions[session.current_question_index]
        
        # Load lecture for voice
        lecture = load_lecture(session.lecture_id)
        audio_url = None
        
        if session.config.voice_mode and lecture:
            voice_id = lecture.get("cloned_voice_id", "a0e99841-438c-4a64-b679-ae501e7d6091")
            audio_path = await text_to_speech_cartesia(
                question.question_text,
                voice_id=voice_id,
                language="en"
            )
            audio_filename = os.path.basename(audio_path)
            audio_url = f"/api/audio/{audio_filename}"
        
        return {
            "session_id": session_id,
            "question": question.model_dump(),
            "current_question_index": session.current_question_index,
            "total_questions": session.total_questions,
            "score": session.score,
            "audio_url": audio_url
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting next question: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/{session_id}/answer")
async def submit_answer(request: SubmitAnswerRequest):
    """Submit an answer (text-based)"""
    try:
        # Get session
        session = active_sessions.get(request.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Find question
        question = next((q for q in session.questions if q.question_id == request.question_id), None)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        print(f"📝 Evaluating answer for question: {question.question_text[:50]}...")
        
        # Evaluate answer
        answer = await quiz_service.evaluate_answer(
            question,
            request.user_answer,
            request.provide_hint
        )
        
        print(f"✅ Answer evaluated: {'✓ Correct' if answer.is_correct else '✗ Incorrect'}")
        
        # Update session
        session.answers.append(answer)
        if answer.is_correct:
            session.score += 1
        session.current_question_index += 1
        
        # Generate voice feedback if voice mode
        audio_url = None
        if session.config.voice_mode:
            lecture = load_lecture(session.lecture_id)
            voice_id = lecture.get("cloned_voice_id", "a0e99841-438c-4a64-b679-ae501e7d6091")
            audio_path = await text_to_speech_cartesia(
                answer.feedback,
                voice_id=voice_id,
                language="en"
            )
            audio_filename = os.path.basename(audio_path)
            audio_url = f"/api/audio/{audio_filename}"
        
        # Check if quiz is complete
        is_complete = session.current_question_index >= len(session.questions)
        if is_complete:
            session.is_completed = True
            session.completed_at = datetime.now(timezone.utc)
        
        return {
            "is_correct": answer.is_correct,
            "feedback": answer.feedback,
            "audio_url": audio_url,
            "score": session.score,
            "total_questions": session.total_questions,
            "completed": is_complete,
            "percentage": round((session.score / session.total_questions) * 100) if is_complete else None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error submitting answer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/{session_id}/answer-voice")
async def submit_voice_answer(
    session_id: str = Form(...),
    question_id: str = Form(...),
    audio: UploadFile = File(...),
    provide_hint: bool = Form(False)
):
    """Submit an answer via voice recording"""
    try:
        # Save audio file
        audio_id = str(uuid.uuid4())
        audio_path = f"/app/data/uploads/answer_{audio_id}.wav"
        
        with open(audio_path, "wb") as f:
            content = await audio.read()
            f.write(content)
        
        print(f"🎤 Transcribing voice answer...")
        
        # Transcribe audio
        user_answer = await transcribe_audio(audio_path)
        
        print(f"📝 Transcribed: {user_answer[:100]}...")
        
        # Submit as text answer
        request = SubmitAnswerRequest(
            session_id=session_id,
            question_id=question_id,
            user_answer=user_answer,
            provide_hint=provide_hint
        )
        
        result = await submit_answer(request)
        result["transcribed_answer"] = user_answer
        
        return result
    
    except Exception as e:
        print(f"❌ Error submitting voice answer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}/results")
async def get_quiz_results(session_id: str):
    """Get quiz results"""
    try:
        session = active_sessions.get(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Calculate results
        correct_count = sum(1 for a in session.answers if a.is_correct)
        incorrect_count = len(session.answers) - correct_count
        percentage = round((correct_count / session.total_questions) * 100) if session.total_questions > 0 else 0
        
        # Build question breakdown
        question_breakdown = []
        for i, question in enumerate(session.questions):
            answer = session.answers[i] if i < len(session.answers) else None
            question_breakdown.append({
                "question": question.model_dump(),
                "answer": answer.model_dump() if answer else None
            })
        
        return {
            "session_id": session_id,
            "lecture_id": session.lecture_id,
            "score": {
                "correct": correct_count,
                "incorrect": incorrect_count,
                "total": session.total_questions,
                "percentage": percentage
            },
            "questions": question_breakdown,
            "completed_at": session.completed_at.isoformat() if session.completed_at else None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting results: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/{session_id}/save")
async def save_quiz_results(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Save quiz results to database (requires authentication)"""
    try:
        session = active_sessions.get(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Load lecture to save quiz result
        lecture = load_lecture(session.lecture_id)
        if not lecture:
            raise HTTPException(status_code=404, detail="Lecture not found")
        
        # Initialize quiz_results array if not exists
        if "quiz_results" not in lecture:
            lecture["quiz_results"] = []
        
        # Calculate score
        correct_count = sum(1 for a in session.answers if a.is_correct)
        percentage = round((correct_count / session.total_questions) * 100)
        
        # Save quiz result
        quiz_result = {
            "result_id": str(uuid.uuid4()),
            "user_id": current_user['google_id'],
            "session_id": session_id,
            "config": session.config.model_dump(),
            "questions": [q.model_dump() for q in session.questions],
            "answers": [a.model_dump() for a in session.answers],
            "score": {
                "correct": correct_count,
                "incorrect": session.total_questions - correct_count,
                "total": session.total_questions,
                "percentage": percentage
            },
            "created_at": session.created_at.isoformat(),
            "completed_at": session.completed_at.isoformat() if session.completed_at else datetime.now(timezone.utc).isoformat()
        }
        
        lecture["quiz_results"].append(quiz_result)
        save_lecture(session.lecture_id, lecture)
        
        print(f"💾 Saved quiz results for user {current_user['google_id']}")
        
        return {
            "message": "Quiz results saved successfully",
            "result_id": quiz_result["result_id"],
            "score": quiz_result["score"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error saving quiz results: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_quiz_history(
    current_user: dict = Depends(get_current_user),
    lecture_id: Optional[str] = None,
    limit: int = 10
):
    """Get quiz history for current user"""
    try:
        from utils.storage import list_lectures
        
        user_id = current_user['google_id']
        lectures = list_lectures(user_id)
        
        all_results = []
        
        for lecture in lectures:
            if lecture_id and lecture['id'] != lecture_id:
                continue
            
            quiz_results = lecture.get('quiz_results', [])
            
            # Filter by user
            user_results = [r for r in quiz_results if r.get('user_id') == user_id]
            
            for result in user_results:
                result['lecture_title'] = lecture.get('filename', 'Unknown')
                all_results.append(result)
        
        # Sort by date (most recent first)
        all_results.sort(key=lambda x: x.get('completed_at', ''), reverse=True)
        
        # Limit results
        return {
            "results": all_results[:limit],
            "total": len(all_results)
        }
    
    except Exception as e:
        print(f"❌ Error getting quiz history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
