import uuid
import json
from typing import List, Dict, Optional
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
from models.quiz import (
    QuizConfig, QuizQuestion, QuizOption, QuestionType, 
    QuizAnswer, QuizSession, QuizResult
)
import os


LLM_API_KEY = os.getenv("EMERGENT_LLM_KEY", "sk-emergent-28d27F735DcFbCa931")


class QuizService:
    """Service for generating and evaluating quiz questions using LLM"""
    
    def __init__(self):
        self.api_key = LLM_API_KEY
    
    async def generate_questions(
        self, 
        lecture_transcript: str, 
        config: QuizConfig
    ) -> List[QuizQuestion]:
        """
        Generate quiz questions from lecture transcript using LLM
        
        Args:
            lecture_transcript: Full lecture transcript text
            config: Quiz configuration (number, types, difficulty)
            
        Returns:
            List of QuizQuestion objects
        """
        # Initialize LLM chat
        session_id = f"quiz-gen-{uuid.uuid4()}"
        chat = LlmChat(
            api_key=self.api_key,
            session_id=session_id,
            system_message="You are an expert educational assessment creator. Generate high-quality quiz questions based on lecture content."
        ).with_model("openai", "gpt-4o")
        
        # Build prompt for question generation
        prompt = self._build_generation_prompt(lecture_transcript, config)
        
        # Generate questions
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse response to extract questions
        questions = self._parse_questions(response, config)
        
        return questions
    
    def _build_generation_prompt(self, transcript: str, config: QuizConfig) -> str:
        """Build prompt for LLM question generation"""
        
        # Truncate transcript if too long (keep first 3000 chars)
        transcript_snippet = transcript[:3000] if len(transcript) > 3000 else transcript
        
        types_str = ", ".join([t.value.replace("_", " ") for t in config.question_types])
        
        prompt = f"""Based on the following lecture transcript, generate exactly {config.num_questions} quiz questions.

Lecture Transcript:
{transcript_snippet}

Requirements:
- Difficulty: {config.difficulty.value}
- Question types: {types_str}
- Distribute question types evenly
- Each question should test understanding, not just memorization
- For multiple choice, provide 4 options with only one correct
- For true/false, create clear statements
- For open-ended, ask questions that require short explanations (2-3 sentences)
- Include a hint for each question

Format your response as valid JSON with this structure:
{{
  "questions": [
    {{
      "question_text": "Question text here",
      "question_type": "multiple_choice" | "true_false" | "open_ended",
      "options": [  // Only for MCQ and True/False
        {{"text": "Option A", "is_correct": false}},
        {{"text": "Option B", "is_correct": true}},
        {{"text": "Option C", "is_correct": false}},
        {{"text": "Option D", "is_correct": false}}
      ],
      "correct_answer": "Correct answer text",
      "rubric": "For open-ended: key points to look for",  // Only for open-ended
      "hint": "Helpful hint without giving away the answer"
    }}
  ]
}}

Return ONLY the JSON, no additional text."""
        
        return prompt
    
    def _parse_questions(self, response: str, config: QuizConfig) -> List[QuizQuestion]:
        """Parse LLM response to extract quiz questions"""
        try:
            # Extract JSON from response (in case LLM adds extra text)
            response_clean = response.strip()
            if response_clean.startswith("```json"):
                response_clean = response_clean[7:]
            if response_clean.startswith("```"):
                response_clean = response_clean[3:]
            if response_clean.endswith("```"):
                response_clean = response_clean[:-3]
            response_clean = response_clean.strip()
            
            data = json.loads(response_clean)
            questions_data = data.get("questions", [])
            
            questions = []
            for q_data in questions_data:
                question_type = QuestionType(q_data["question_type"])
                
                # Parse options if present
                options = None
                if q_data.get("options"):
                    options = [QuizOption(**opt) for opt in q_data["options"]]
                
                question = QuizQuestion(
                    question_id=str(uuid.uuid4()),
                    question_text=q_data["question_text"],
                    question_type=question_type,
                    options=options,
                    correct_answer=q_data["correct_answer"],
                    rubric=q_data.get("rubric"),
                    hint=q_data.get("hint")
                )
                questions.append(question)
            
            return questions[:config.num_questions]  # Ensure we don't exceed requested count
            
        except Exception as e:
            print(f"Error parsing questions: {e}")
            print(f"Response: {response}")
            # Return fallback question
            return [self._create_fallback_question()]
    
    def _create_fallback_question(self) -> QuizQuestion:
        """Create a fallback question if generation fails"""
        return QuizQuestion(
            question_id=str(uuid.uuid4()),
            question_text="What was the main topic discussed in this lecture?",
            question_type=QuestionType.OPEN_ENDED,
            options=None,
            correct_answer="Any reasonable summary of the lecture content",
            rubric="Student should mention key concepts from the lecture",
            hint="Think about the central theme or main idea presented"
        )
    
    async def evaluate_answer(
        self,
        question: QuizQuestion,
        user_answer: str,
        provide_hint: bool = False
    ) -> QuizAnswer:
        """
        Evaluate user's answer and provide feedback
        
        Args:
            question: The quiz question
            user_answer: User's answer text
            provide_hint: Whether to include hint in feedback
            
        Returns:
            QuizAnswer with evaluation results
        """
        # For MCQ and True/False, simple string comparison
        if question.question_type in [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE]:
            is_correct = self._evaluate_mcq(question, user_answer)
            feedback = self._generate_mcq_feedback(question, user_answer, is_correct, provide_hint)
            
            return QuizAnswer(
                question_id=question.question_id,
                user_answer=user_answer,
                is_correct=is_correct,
                feedback=feedback,
                hint_used=provide_hint
            )
        
        # For open-ended, use LLM to evaluate
        return await self._evaluate_open_ended(question, user_answer, provide_hint)
    
    def _evaluate_mcq(self, question: QuizQuestion, user_answer: str) -> bool:
        """Evaluate multiple choice or true/false answer"""
        # Normalize answers for comparison
        user_answer_clean = user_answer.strip().lower()
        correct_answer_clean = question.correct_answer.strip().lower()
        
        # Check exact match or substring match
        return user_answer_clean == correct_answer_clean or user_answer_clean in correct_answer_clean
    
    def _generate_mcq_feedback(self, question: QuizQuestion, user_answer: str, is_correct: bool, provide_hint: bool) -> str:
        """Generate feedback for MCQ/True-False answers"""
        if is_correct:
            feedback = f"Correct! {question.correct_answer}"
        else:
            feedback = f"Not quite. The correct answer is: {question.correct_answer}"
            if provide_hint and question.hint:
                feedback += f"\n\nHint: {question.hint}"
        
        return feedback
    
    async def _evaluate_open_ended(self, question: QuizQuestion, user_answer: str, provide_hint: bool) -> QuizAnswer:
        """Use LLM to evaluate open-ended answer"""
        session_id = f"quiz-eval-{uuid.uuid4()}"
        chat = LlmChat(
            api_key=self.api_key,
            session_id=session_id,
            system_message="You are an expert educator evaluating student quiz answers. Be fair but thorough."
        ).with_model("openai", "gpt-4o")
        
        prompt = f"""Evaluate this student's answer to a quiz question.

Question: {question.question_text}

Rubric (key points to look for): {question.rubric}

Student's Answer: {user_answer}

Evaluate whether the answer is correct based on the rubric. Respond with ONLY valid JSON in this format:
{{
  "is_correct": true/false,
  "feedback": "Detailed feedback explaining why the answer is correct or what's missing"
}}

Be generous if the student demonstrates understanding of key concepts."""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        try:
            # Parse evaluation response
            response_clean = response.strip()
            if response_clean.startswith("```json"):
                response_clean = response_clean[7:]
            if response_clean.startswith("```"):
                response_clean = response_clean[3:]
            if response_clean.endswith("```"):
                response_clean = response_clean[:-3]
            response_clean = response_clean.strip()
            
            eval_data = json.loads(response_clean)
            
            is_correct = eval_data.get("is_correct", False)
            feedback = eval_data.get("feedback", "Answer evaluated.")
            
            if provide_hint and question.hint and not is_correct:
                feedback += f"\n\nHint: {question.hint}"
            
            return QuizAnswer(
                question_id=question.question_id,
                user_answer=user_answer,
                is_correct=is_correct,
                feedback=feedback,
                hint_used=provide_hint
            )
            
        except Exception as e:
            print(f"Error evaluating open-ended answer: {e}")
            # Fallback: mark as correct with generic feedback
            return QuizAnswer(
                question_id=question.question_id,
                user_answer=user_answer,
                is_correct=True,
                feedback="Your answer has been recorded. Please review with your instructor.",
                hint_used=provide_hint
            )
