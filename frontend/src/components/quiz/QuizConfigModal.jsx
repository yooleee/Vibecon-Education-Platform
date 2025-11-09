import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function QuizConfigModal({ isOpen, onClose, onStart, lectureId }) {
  const [numQuestions, setNumQuestions] = useState(5);
  const [questionTypes, setQuestionTypes] = useState({
    multiple_choice: true,
    true_false: true,
    open_ended: true
  });
  const [difficulty, setDifficulty] = useState('medium');
  const [voiceMode, setVoiceMode] = useState(true);

  const handleStart = () => {
    const selectedTypes = Object.keys(questionTypes).filter(type => questionTypes[type]);
    
    if (selectedTypes.length === 0) {
      alert('Please select at least one question type');
      return;
    }

    onStart({
      lecture_id: lectureId,
      num_questions: numQuestions,
      question_types: selectedTypes,
      difficulty,
      voice_mode: voiceMode
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="modal-overlay"
        onClick={onClose}
        data-testid="quiz-config-modal"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}
      >
        <motion.div
          className="glass-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}
        >
          <h2 className="mb-lg">Configure Quiz</h2>

          {/* Number of Questions */}
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label className="label" style={{ display: 'block', marginBottom: 'var(--space-sm)' }}>
              Number of Questions: {numQuestions}
            </label>
            <input
              type="range"
              min="3"
              max="10"
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              data-testid="num-questions-slider"
              style={{
                width: '100%',
                accentColor: 'var(--accent-primary)'
              }}
            />
          </div>

          {/* Question Types */}
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label className="label" style={{ display: 'block', marginBottom: 'var(--space-sm)' }}>
              Question Types
            </label>
            {Object.keys(questionTypes).map(type => (
              <label key={type} style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={questionTypes[type]}
                  onChange={(e) => setQuestionTypes({ ...questionTypes, [type]: e.target.checked })}
                  data-testid={`question-type-${type}`}
                  style={{ marginRight: 'var(--space-sm)', cursor: 'pointer' }}
                />
                <span style={{ textTransform: 'capitalize' }}>{type.replace('_', ' ')}</span>
              </label>
            ))}
          </div>

          {/* Difficulty */}
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label className="label" style={{ display: 'block', marginBottom: 'var(--space-sm)' }}>
              Difficulty
            </label>
            {['easy', 'medium', 'hard'].map(level => (
              <label key={level} style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-sm)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="difficulty"
                  value={level}
                  checked={difficulty === level}
                  onChange={(e) => setDifficulty(e.target.value)}
                  data-testid={`difficulty-${level}`}
                  style={{ marginRight: 'var(--space-sm)', cursor: 'pointer' }}
                />
                <span style={{ textTransform: 'capitalize' }}>{level}</span>
              </label>
            ))}
          </div>

          {/* Voice Mode */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={voiceMode}
                onChange={(e) => setVoiceMode(e.target.checked)}
                data-testid="voice-mode-toggle"
                style={{ marginRight: 'var(--space-sm)', cursor: 'pointer' }}
              />
              <span className="label">Enable Voice Mode</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-md justify-end">
            <button
              className="glass-button"
              onClick={onClose}
              data-testid="cancel-quiz-button"
            >
              Cancel
            </button>
            <button
              className="glass-button-primary glass-button"
              onClick={handleStart}
              data-testid="start-quiz-button"
            >
              Start Quiz
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default QuizConfigModal;
