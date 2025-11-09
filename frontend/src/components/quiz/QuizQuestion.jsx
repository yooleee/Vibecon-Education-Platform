import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

function QuizQuestion({ question, questionNumber, totalQuestions, audioUrl, voiceMode }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioUrl && voiceMode && audioRef.current) {
      audioRef.current.play().catch(e => console.error('Audio playback error:', e));
    }
  }, [audioUrl, voiceMode]);

  const questionTypeLabels = {
    multiple_choice: 'Multiple Choice',
    true_false: 'True/False',
    open_ended: 'Open-Ended'
  };

  return (
    <motion.div
      className="quiz-question-card glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid="quiz-question-card"
      style={{ marginBottom: 'var(--space-xl)' }}
    >
      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-sm)' }} data-testid="question-number">
        Question {questionNumber} of {totalQuestions}
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 'var(--space-md) 0', lineHeight: 1.5 }} data-testid="question-text">
        {question.question_text}
      </h3>

      <div style={{ display: 'inline-block', padding: '4px 12px', background: 'var(--background-secondary)', color: 'var(--text-primary)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, marginTop: 'var(--space-sm)' }}>
        {questionTypeLabels[question.question_type] || question.question_type}
      </div>

      {voiceMode && audioUrl && (
        <div style={{ marginTop: 'var(--space-md)' }}>
          <audio ref={audioRef} controls src={`${process.env.REACT_APP_BACKEND_URL || ''}${audioUrl}`} style={{ width: '100%', height: '40px' }} data-testid="question-audio">
            Your browser does not support the audio element.
          </audio>
          
          {/* Voice instructions for MCQ/True-False */}
          {(question.question_type === 'multiple_choice' || question.question_type === 'true_false') && (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--space-sm)', fontStyle: 'italic', textAlign: 'center' }}>
              💡 Answer by saying the option (e.g., "Option A" or "True") or click below
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default QuizQuestion;
