import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

function QuizFeedback({ isCorrect, feedback, audioUrl, transcribedAnswer, voiceMode, onNext }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioUrl && voiceMode && audioRef.current) {
      audioRef.current.play().catch(e => console.error('Feedback audio error:', e));
    }
  }, [audioUrl, voiceMode]);

  return (
    <motion.div
      className={`quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid="quiz-feedback"
      style={{
        display: 'flex',
        gap: 'var(--space-lg)',
        padding: 'var(--space-xl)',
        borderRadius: 'var(--radius-lg)',
        marginTop: 'var(--space-xl)',
        background: isCorrect ? '#E8F5E9' : '#FFEBEE',
        border: `2px solid ${isCorrect ? '#34C759' : '#FF3B30'}`
      }}
    >
      <div style={{ fontSize: '3rem', flexShrink: 0, color: isCorrect ? '#34C759' : '#FF3B30' }}>
        {isCorrect ? (
          <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        ) : (
          <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
          </svg>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <h4 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-sm)', color: 'var(--text-primary)' }}>
          {isCorrect ? 'Correct!' : 'Not quite'}
        </h4>
        
        {transcribedAnswer && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)', fontStyle: 'italic' }}>
            You said: "{transcribedAnswer}"
          </p>
        )}
        
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-md)' }}>
          {feedback}
        </p>

        {voiceMode && audioUrl && (
          <audio ref={audioRef} controls src={`${process.env.REACT_APP_BACKEND_URL || ''}${audioUrl}`} style={{ width: '100%', height: '40px', marginBottom: 'var(--space-md)' }} data-testid="feedback-audio">
            Your browser does not support the audio element.
          </audio>
        )}

        <button
          className="glass-button-primary glass-button"
          onClick={onNext}
          data-testid="next-question-button"
          style={{ marginTop: 'var(--space-md)' }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
          </svg>
          Next Question
        </button>
      </div>
    </motion.div>
  );
}

export default QuizFeedback;
