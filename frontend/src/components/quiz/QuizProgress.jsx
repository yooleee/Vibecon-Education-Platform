import React from 'react';
import { motion } from 'framer-motion';

function QuizProgress({ currentQuestion, totalQuestions, score }) {
  const percentage = ((currentQuestion - 1) / totalQuestions) * 100;

  return (
    <div className="quiz-progress glass-card" data-testid="quiz-progress" style={{ marginBottom: 'var(--space-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Progress
        </span>
        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-primary)' }} data-testid="progress-score">
          {score}/{totalQuestions}
        </span>
      </div>

      <div style={{ width: '100%', height: '8px', background: 'var(--background-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 'var(--space-md)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', borderRadius: 'var(--radius-full)' }}
          data-testid="progress-bar-fill"
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
        {Array.from({ length: totalQuestions }).map((_, index) => (
          <div
            key={index}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: index < currentQuestion - 1 ? 'var(--accent-secondary)' : index === currentQuestion - 1 ? 'var(--accent-primary)' : 'var(--background-secondary)',
              transform: index === currentQuestion - 1 ? 'scale(1.3)' : 'scale(1)',
              boxShadow: index === currentQuestion - 1 ? '0 0 0 4px rgba(0, 122, 255, 0.2)' : 'none',
              transition: 'all 0.3s ease'
            }}
            data-testid={`progress-dot-${index}`}
          />
        ))}
      </div>
    </div>
  );
}

export default QuizProgress;
