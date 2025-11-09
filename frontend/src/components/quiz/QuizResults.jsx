import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function QuizResults({ results, onClose, onRetake }) {
  const [confettiActive, setConfettiActive] = useState(false);

  useEffect(() => {
    // Show confetti for scores above 80%
    if (results.score.percentage >= 80) {
      setConfettiActive(true);
      setTimeout(() => setConfettiActive(false), 5000);
    }
  }, [results.score.percentage]);

  const getEncouragementMessage = (percentage) => {
    if (percentage >= 90) return "Outstanding! You've mastered this material!";
    if (percentage >= 80) return "Great job! You really know your stuff!";
    if (percentage >= 70) return "Good work! Keep it up!";
    if (percentage >= 60) return "Not bad! A bit more practice and you'll ace it!";
    return "Keep practicing! You'll get there!";
  };

  const getCelebrationIcon = (percentage) => {
    if (percentage >= 90) return '🎉';
    if (percentage >= 70) return '👍';
    return '💪';
  };

  return (
    <div className="quiz-results" data-testid="quiz-results" style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-2xl)' }}>
      {confettiActive && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 9999 }}>
          {/* Simple confetti effect - in production, use react-confetti */}
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -20, x: Math.random() * window.innerWidth, opacity: 1 }}
              animate={{ y: window.innerHeight + 20, opacity: 0 }}
              transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5 }}
              style={{
                position: 'absolute',
                width: '10px',
                height: '10px',
                background: ['#007AFF', '#34C759', '#FF9500', '#FF3B30'][Math.floor(Math.random() * 4)],
                borderRadius: '50%'
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ duration: 0.8, type: 'spring' }}
          style={{ fontSize: '5rem', marginBottom: 'var(--space-lg)' }}
        >
          {getCelebrationIcon(results.score.percentage)}
        </motion.div>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
          Quiz Complete!
        </h2>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)' }}>
          {getEncouragementMessage(results.score.percentage)}
        </p>
      </motion.div>

      <motion.div
        className="glass-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        data-testid="results-score-card"
        style={{ marginBottom: 'var(--space-2xl)', textAlign: 'center' }}
      >
        <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto var(--space-xl)' }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="var(--background-secondary)"
              strokeWidth="8"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="var(--accent-secondary)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="283"
              initial={{ strokeDashoffset: 283 }}
              animate={{ strokeDashoffset: 283 - (283 * results.score.percentage) / 100 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {results.score.percentage}%
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2xl)', justifyContent: 'center' }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>{results.score.correct}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Correct</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-error)' }}>{results.score.incorrect}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Incorrect</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{results.score.total}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
          </div>
        </div>
      </motion.div>

      <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          className="glass-button-primary glass-button"
          onClick={onRetake}
          data-testid="retake-quiz-button"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retake Quiz
        </button>
        <button
          className="glass-button"
          onClick={onClose}
          data-testid="return-lecture-button"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Lecture
        </button>
      </div>
    </div>
  );
}

export default QuizResults;
