import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

function QuizVoiceInput({ onSubmit, disabled }) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setProcessing(true);
        
        try {
          await onSubmit(audioBlob);
        } catch (error) {
          console.error('Error submitting voice answer:', error);
          alert('Failed to submit voice answer. Please try again.');
        } finally {
          setProcessing(false);
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="quiz-voice-input" data-testid="quiz-voice-input" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-lg)', padding: 'var(--space-2xl)', background: 'var(--background-secondary)', borderRadius: 'var(--radius-lg)' }}>
      <motion.button
        className={`voice-record-button ${recording ? 'recording' : ''}`}
        onClick={toggleRecording}
        disabled={disabled || processing}
        whileHover={{ scale: disabled || processing ? 1 : 1.05 }}
        whileTap={{ scale: disabled || processing ? 1 : 0.95 }}
        data-testid="voice-record-button"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '120px',
          height: '120px',
          background: recording ? 'linear-gradient(135deg, #FF3B30 0%, #C81414 100%)' : 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary-hover) 100%)',
          border: '4px solid var(--surface)',
          borderRadius: '50%',
          color: 'white',
          fontSize: '2rem',
          cursor: disabled || processing ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: 'var(--shadow-lg)',
          opacity: disabled || processing ? 0.6 : 1
        }}
      >
        <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
          {recording ? (
            <rect x="6" y="6" width="12" height="12" rx="2" />
          ) : (
            <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
          )}
        </svg>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: 'var(--space-sm)' }}>
          {recording ? 'Stop' : 'Tap to Answer'}
        </span>
      </motion.button>

      {recording && (
        <div className="voice-waveform" data-testid="voice-waveform" style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '40px' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              animate={{ height: ['10px', '40px', '10px'] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
              style={{ width: '4px', background: 'var(--accent-primary)', borderRadius: '2px' }}
            />
          ))}
        </div>
      )}

      {processing && (
        <div className="voice-processing" data-testid="voice-processing" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
          <span>Processing your answer...</span>
        </div>
      )}
    </div>
  );
}

export default QuizVoiceInput;
