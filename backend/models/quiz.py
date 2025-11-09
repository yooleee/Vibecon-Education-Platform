from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum


class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    OPEN_ENDED = "open_ended"


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class QuizConfig(BaseModel):
    num_questions: int = 5
    question_types: List[QuestionType] = [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE, QuestionType.OPEN_ENDED]
    difficulty: Difficulty = Difficulty.MEDIUM
    voice_mode: bool = True


class QuizOption(BaseModel):
    text: str
    is_correct: bool = False


class QuizQuestion(BaseModel):
    question_id: str
    question_text: str
    question_type: QuestionType
    options: Optional[List[QuizOption]] = None  # For MCQ and True/False
    correct_answer: str  # Text of correct answer
    rubric: Optional[str] = None  # For open-ended evaluation
    hint: Optional[str] = None


class QuizAnswer(BaseModel):
    question_id: str
    user_answer: str
    is_correct: bool
    feedback: str
    time_taken: Optional[int] = None  # seconds
    hint_used: bool = False


class QuizSession(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    lecture_id: str
    config: QuizConfig
    questions: List[QuizQuestion]
    answers: List[QuizAnswer] = []
    current_question_index: int = 0
    score: int = 0
    total_questions: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    is_completed: bool = False


class QuizResult(BaseModel):
    result_id: str
    user_id: str
    lecture_id: str
    session_id: str
    config: QuizConfig
    questions: List[QuizQuestion]
    answers: List[QuizAnswer]
    score: Dict[str, int]  # {correct, incorrect, total, percentage}
    created_at: datetime
    completed_at: datetime
    metadata: Optional[Dict] = None
