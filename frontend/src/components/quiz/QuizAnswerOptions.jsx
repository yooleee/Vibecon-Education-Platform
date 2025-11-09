import React, { useState } from 'react';
import { motion } from 'framer-motion';

function QuizAnswerOptions({ options, onSelect, disabled }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleSelect = (index, optionText) => {
    if (disabled) return;
    setSelectedIndex(index);
    onSelect(optionText);
  };

  if (!options) return null;

  return (
    <div className="quiz-answer-options" data-testid="quiz-answer-options" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {options.map((option, index) => (
        <motion.button
          key={index}
          className={`answer-option ${selectedIndex === index ? 'selected' : ''}`}
          onClick={() => handleSelect(index, option.text)}
          disabled={disabled}
          whileHover={{ scale: disabled ? 1 : 1.01, x: disabled ? 0 : 4 }}
          whileTap={{ scale: disabled ? 1 : 0.99 }}
          data-testid={`answer-option-${index}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
            background: selectedIndex === index ? 'rgba(0, 122, 255, 0.1)' : 'var(--surface)',
            border: `2px solid ${selectedIndex === index ? 'var(--accent-primary)' : 'rgba(209, 209, 214, 0.3)'}`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-lg)',
            fontSize: '1rem',
            textAlign: 'left',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            opacity: disabled ? 0.6 : 1
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'var(--background-secondary)', borderRadius: '50%', fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0 }}>
            {String.fromCharCode(65 + index)}
          </span>
          <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 500 }}>
            {option.text}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

export default QuizAnswerOptions;
