import React from 'react';
import { motion } from 'framer-motion';

function QuizTriggerButton({ onClick, disabled = false }) {
  return (
    <motion.button
      className="quiz-trigger-button glass-button-primary glass-button"
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      data-testid="quiz-trigger-button"
    >
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Start Quiz
    </motion.button>
  );
}

export default QuizTriggerButton;
