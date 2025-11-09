import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QuizProgress from './QuizProgress';
import QuizQuestion from './QuizQuestion';
import QuizAnswerOptions from './QuizAnswerOptions';
import QuizVoiceInput from './QuizVoiceInput';
import QuizFeedback from './QuizFeedback';
import QuizResults from './QuizResults';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

function QuizInterface({ sessionId, lectureId, voiceMode, onClose, onComplete }) {
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [questionAudio, setQuestionAudio] = useState(null);

  useEffect(() => {
    loadNextQuestion();
  }, [sessionId]);

  const loadNextQuestion = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      setUserAnswer('');

      const response = await axios.get(`${BACKEND_URL}/api/quiz/session/${sessionId}/next`);

      if (response.data.completed) {
        // Quiz is complete
        setIsCompleted(true);
        await loadResults();
      } else {
        setCurrentQuestion(response.data.question);
        setCurrentQuestionIndex(response.data.current_question_index);
        setTotalQuestions(response.data.total_questions);
        setScore(response.data.score);
        setQuestionAudio(response.data.audio_url);
      }
    } catch (error) {
      console.error('Error loading next question:', error);
      alert('Failed to load question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/quiz/session/${sessionId}/results`);
      setResults(response.data);
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  const submitAnswer = async (answer, provideHint = false) => {
    try {
      setLoading(true);

      const response = await axios.post(`${BACKEND_URL}/api/quiz/session/${sessionId}/answer`, {
        session_id: sessionId,
        question_id: currentQuestion.question_id,
        user_answer: answer,
        provide_hint: provideHint
      });

      setFeedback({
        is_correct: response.data.is_correct,
        feedback: response.data.feedback,
        audio_url: response.data.audio_url
      });

      setScore(response.data.score);

      // If quiz is complete, show results
      if (response.data.completed) {
        setTimeout(() => {
          setIsCompleted(true);
          loadResults();
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitVoiceAnswer = async (audioBlob, provideHint = false) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('session_id', sessionId);
      formData.append('question_id', currentQuestion.question_id);
      formData.append('audio', audioBlob, 'answer.wav');
      formData.append('provide_hint', provideHint);

      const response = await axios.post(
        `${BACKEND_URL}/api/quiz/session/answer-voice`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setFeedback({
        is_correct: response.data.is_correct,
        feedback: response.data.feedback,
        audio_url: response.data.audio_url,
        transcribed_answer: response.data.transcribed_answer
      });

      setScore(response.data.score);

      if (response.data.completed) {
        setTimeout(() => {
          setIsCompleted(true);
          loadResults();
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting voice answer:', error);
      alert('Failed to submit voice answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    loadNextQuestion();
  };

  if (isCompleted && results) {
    return (
      <QuizResults
        results={results}
        onClose={onClose}
        onRetake={() => {
          // Retake logic - would need to create new session
          onClose();
        }}
      />
    );
  }

  if (!currentQuestion || loading) {
    return (
      <div className="quiz-container" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: 'var(--space-lg)' }}>Loading question...</p>
      </div>
    );
  }

  return (
    <div className="quiz-container" data-testid="quiz-interface" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <QuizProgress
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={totalQuestions}
        score={score}
      />

      <QuizQuestion
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={totalQuestions}
        audioUrl={questionAudio}
        voiceMode={voiceMode}
      />

      {!feedback && (
        <div>
          {voiceMode ? (
            // Voice mode for all question types
            <div>
              <QuizVoiceInput
                onSubmit={submitVoiceAnswer}
                disabled={loading}
              />
              
              {/* Show answer options below for reference (MCQ/True-False) */}
              {currentQuestion.question_type !== 'open_ended' && (
                <div style={{ marginTop: 'var(--space-lg)' }}>
                  <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                    Or click an option below:
                  </p>
                  <QuizAnswerOptions
                    options={currentQuestion.options}
                    onSelect={(answer) => submitAnswer(answer)}
                    disabled={loading}
                  />
                </div>
              )}
            </div>
          ) : (
            // Text mode
            currentQuestion.question_type === 'open_ended' ? (
              <div>
                <textarea
                  className="glass-input"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows="4"
                  disabled={loading}
                  data-testid="text-answer-input"
                  style={{ width: '100%', marginBottom: 'var(--space-md)', fontFamily: 'inherit' }}
                />
                <button
                  className="glass-button-primary glass-button"
                  onClick={() => submitAnswer(userAnswer)}
                  disabled={loading || !userAnswer.trim()}
                  data-testid="submit-answer-button"
                >
                  Submit Answer
                </button>
              </div>
            ) : (
              <QuizAnswerOptions
                options={currentQuestion.options}
                onSelect={(answer) => submitAnswer(answer)}
                disabled={loading}
              />
            )
          )}
        </div>
      )}

      {feedback && (
        <QuizFeedback
          isCorrect={feedback.is_correct}
          feedback={feedback.feedback}
          audioUrl={feedback.audio_url}
          transcribedAnswer={feedback.transcribed_answer}
          voiceMode={voiceMode}
          onNext={handleNext}
        />
      )}
    </div>
  );
}

export default QuizInterface;
