import React, { useState, useEffect } from 'react';
import { LiveKitRoom, useVoiceAssistant, BarVisualizer, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import axios from 'axios';
import './LiveKitVoiceChat.css';

function LiveKitVoiceChat({ lectureId, backendUrl, isAuthenticated }) {
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const startLiveKitSession = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to use Live Voice Chat');
      return;
    }

    try {
      setConnecting(true);
      setError(null);
      
      const response = await axios.post(`${backendUrl}/api/livekit/session/start`, {
        lecture_id: lectureId
      });

      setConnectionDetails({
        serverUrl: response.data.url,
        token: response.data.token,
        roomName: response.data.room_name,
        lectureTitle: response.data.lecture_title
      });
    } catch (err) {
      console.error('Failed to start LiveKit session:', err);
      setError(err.response?.data?.detail || 'Failed to start voice chat session');
      setConnecting(false);
    }
  };

  const endSession = () => {
    setConnectionDetails(null);
    setConnecting(false);
  };

  if (!connectionDetails) {
    return (
      <div className="livekit-container">
        <div className="glass-card">
          <div className="livekit-setup">
            <div className="livekit-icon">🎤</div>
            <h3>Real-Time Voice Chat</h3>
            <p className="text-secondary">
              Start a live voice conversation with your AI tutor. Just speak naturally and get instant spoken responses.
            </p>
            
            {error && (
              <div className="alert alert-error" style={{ marginTop: 'var(--space-lg)' }}>
                <span>{error}</span>
              </div>
            )}

            <div className="livekit-features">
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span>Ultra-low latency</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🗣️</span>
                <span>Natural conversation</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <span>Context-aware</span>
              </div>
            </div>

            <button
              className="glass-button-primary glass-button"
              onClick={startLiveKitSession}
              disabled={connecting || !isAuthenticated}
              style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-xl)' }}
            >
              {connecting ? 'Connecting...' : '🎙️ Start Voice Chat'}
            </button>

            {!isAuthenticated && (
              <p className="text-tertiary" style={{ marginTop: 'var(--space-md)', fontSize: '0.875rem' }}>
                Sign in required for Live Voice Chat
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="livekit-container">
      <div className="glass-card">
        <div className="livekit-header">
          <div>
            <h3>🎙️ Live Voice Chat Active</h3>
            <p className="text-secondary">{connectionDetails.lectureTitle}</p>
          </div>
          <button className="glass-button-danger glass-button" onClick={endSession}>
            End Session
          </button>
        </div>

        <LiveKitRoom
          serverUrl={connectionDetails.serverUrl}
          token={connectionDetails.token}
          connect={true}
          audio={true}
          video={false}
          onDisconnected={endSession}
          className="livekit-room"
        >
          <LiveKitRoomContent />
        </LiveKitRoom>
      </div>
    </div>
  );
}

function LiveKitRoomContent() {
  const { state, audioTrack } = useVoiceAssistant();

  return (
    <div className="livekit-room-content">
      <RoomAudioRenderer />
      
      <div className="voice-status-card">
        <div className="status-indicator">
          <div className={`status-dot ${state === 'listening' ? 'listening' : state === 'thinking' ? 'thinking' : state === 'speaking' ? 'speaking' : 'idle'}`} />
          <span className="status-text">
            {state === 'listening' && '👂 Listening...'}
            {state === 'thinking' && '🤔 Thinking...'}
            {state === 'speaking' && '🗣️ Speaking...'}
            {state === 'idle' && '💤 Ready to chat'}
          </span>
        </div>

        {audioTrack && (
          <div className="audio-visualizer">
            <BarVisualizer
              state={state}
              trackRef={audioTrack}
              barCount={5}
              options={{ minHeight: 20 }}
            />
          </div>
        )}
      </div>

      <div className="livekit-instructions">
        <p className="text-secondary">
          <strong>Speak naturally</strong> - The AI tutor will respond in real-time with the professor's cloned voice.
        </p>
      </div>
    </div>
  );
}

export default LiveKitVoiceChat;