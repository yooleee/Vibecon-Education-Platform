import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './VoiceTutorInterfaceV2.css';

function VoiceTutorInterfaceV2({ lectureId, backendUrl }) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [textInput, setTextInput] = useState('');
  
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const animationRef = useRef(null);

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Spanish', flag: '🇪🇸' },
    { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentAudio && !playing) {
      playAudio(currentAudio);
    }
  }, [currentAudio]);

  useEffect(() => {
    if (!sessionId) {
      initializeSession();
    }
  }, [lectureId]);

  // Reinitialize session when language changes
  useEffect(() => {
    if (sessionId) {
      console.log('🌍 Language changed to:', selectedLanguage, '- Reinitializing session...');
      initializeSession();
    }
  }, [selectedLanguage]);

  const initializeSession = async () => {
    try {
      console.log('🎯 Initializing V2 session...');
      const response = await axios.post(`${backendUrl}/api/v2/session/start`, {
        lecture_id: lectureId,
        language: selectedLanguage,
      });
      
      setSessionId(response.data.session_id);
      console.log('✅ V2 Session created:', response.data.session_id);
      setError(null);
    } catch (err) {
      console.error('❌ Session creation failed:', err);
      setError('Failed to initialize conversation session. Please refresh the page.');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      audioChunksRef.current = [];
      const startTime = Date.now();

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const recordingDuration = Date.now() - startTime;
        if (recordingDuration < 500) {
          setError('Recording too short. Please hold the button while speaking (minimum 1 second).');
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        if (audioBlob.size < 2000) {
          setError('No audio detected. Please check your microphone and try again.');
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        await sendVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(100);
      setRecording(true);
      setError(null);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const sendVoiceMessage = async (audioBlob) => {
    try {
      setProcessing(true);
      setError(null);

      const formData = new FormData();
      formData.append('audio', audioBlob, 'question.webm');
      formData.append('language', selectedLanguage);
      formData.append('session_id', sessionId);

      const endpoint = `${backendUrl}/api/v2/graph/query-stream`;

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process voice message');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let userMessage = null;
      let assistantMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };
      
      const audioQueue = [];
      let isPlayingQueue = false;

      const playNextAudio = async () => {
        if (isPlayingQueue || audioQueue.length === 0) return;
        
        isPlayingQueue = true;
        const audioUrl = audioQueue.shift();
        
        try {
          if (audioRef.current) {
            audioRef.current.src = `${backendUrl}${audioUrl}`;
            audioRef.current.onended = () => {
              isPlayingQueue = false;
              setPlaying(false);
              playNextAudio();
            };
            await audioRef.current.play();
            setPlaying(true);
          }
        } catch (error) {
          console.error('❌ Audio playback error:', error);
          isPlayingQueue = false;
          playNextAudio();
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              
              if (event.type === 'question') {
                userMessage = {
                  role: 'user',
                  content: event.data.text,
                  timestamp: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, userMessage]);
              }
              else if (event.type === 'start') {
                setMessages((prev) => [...prev, assistantMessage]);
              }
              else if (event.type === 'text') {
                assistantMessage.content += ' ' + event.data.text;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...assistantMessage };
                  return newMessages;
                });
              }
              else if (event.type === 'audio') {
                audioQueue.push(event.data.audio_url);
                playNextAudio();
              }
              else if (event.type === 'complete') {
                assistantMessage.content = event.data.full_response;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...assistantMessage };
                  return newMessages;
                });
              }
              else if (event.type === 'error') {
                setError(event.data.message);
              }
            } catch (e) {
              console.error('Failed to parse SSE event:', e);
            }
          }
        }
      }

    } catch (err) {
      console.error('❌ Voice query error:', err);
      setError(err.message || 'Failed to process voice message');
    } finally {
      setProcessing(false);
    }
  };

  const playAudio = (audioUrl) => {
    if (audioRef.current) {
      stopAudio();
      audioRef.current.src = `${backendUrl}${audioUrl}`;
      audioRef.current.play();
      setPlaying(true);
      updateProgress();
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
      setAudioProgress(0);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  };

  const togglePlayPause = (audioUrl) => {
    if (playing && currentAudio === audioUrl) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      playAudio(audioUrl);
      setCurrentAudio(audioUrl);
    }
  };

  const updateProgress = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress || 0);
      
      if (playing && !audioRef.current.paused) {
        animationRef.current = requestAnimationFrame(updateProgress);
      }
    }
  };

  const handleAudioEnded = () => {
    setPlaying(false);
    setAudioProgress(0);
    setCurrentAudio(null);
  };

  const sendTextMessage = async () => {
    if (!textInput.trim() || processing || !sessionId) return;

    try {
      setProcessing(true);
      setError(null);
      
      const userMessage = {
        role: 'user',
        content: textInput.trim(),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setTextInput('');

      const formData = new FormData();
      formData.append('session_id', sessionId);
      formData.append('question', userMessage.content);
      formData.append('language', selectedLanguage);

      const endpoint = `${backendUrl}/api/v2/graph/query-stream`;
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process message');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let assistantMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };
      
      const audioQueue = [];
      let isPlayingQueue = false;

      const playNextAudio = async () => {
        if (isPlayingQueue || audioQueue.length === 0) return;
        
        isPlayingQueue = true;
        const audioUrl = audioQueue.shift();
        
        try {
          if (audioRef.current) {
            audioRef.current.src = `${backendUrl}${audioUrl}`;
            audioRef.current.onended = () => {
              isPlayingQueue = false;
              setPlaying(false);
              setCurrentAudio(null);
              playNextAudio();
            };
            await audioRef.current.play();
            setPlaying(true);
            setCurrentAudio(`${backendUrl}${audioUrl}`);
          }
        } catch (error) {
          console.error('❌ Audio playback error:', error);
          isPlayingQueue = false;
          playNextAudio();
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              
              if (event.type === 'start') {
                setMessages((prev) => [...prev, assistantMessage]);
              }
              else if (event.type === 'text') {
                assistantMessage.content += ' ' + event.data.text;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...assistantMessage };
                  return newMessages;
                });
              }
              else if (event.type === 'audio') {
                audioQueue.push(event.data.audio_url);
                playNextAudio();
              }
              else if (event.type === 'complete') {
                assistantMessage.content = event.data.full_response;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...assistantMessage };
                  return newMessages;
                });
              }
              else if (event.type === 'error') {
                setError(event.data.message);
              }
            } catch (e) {
              console.error('Failed to parse SSE event:', e);
            }
          }
        }
      }

    } catch (err) {
      console.error('❌ Text query error:', err);
      setError(err.message || 'Failed to process message');
    } finally {
      setProcessing(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  return (
    <div className="voice-tutor-container">
      <div className="glass-card voice-tutor-card">
        {/* Header */}
        <div className="tutor-header">
          <div className="tutor-title-section">
            <div className="tutor-icon">💬</div>
            <div>
              <h2 className="tutor-title">AI Tutor Chat</h2>
              <p className="tutor-subtitle">Type or speak • Natural conversation with memory</p>
            </div>
            <span className="badge badge-success">🧠 Memory Active</span>
          </div>
        </div>

        {/* Session Info */}
        {sessionId && (
          <div className="alert alert-success">
            <strong>🧠 Conversation Memory Active</strong>
            <p>I'll remember our entire conversation! Ask follow-up questions like "Can you explain that in more detail?"</p>
            <small>Session: {sessionId.substring(0, 8)}...</small>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
            <button className="alert-close" onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Language Selector */}
        <div className="language-selector">
          <div className="language-icon">🌍</div>
          <span className="language-label">Response Language:</span>
          <div className="language-buttons">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`language-btn ${selectedLanguage === lang.code ? 'active' : ''}`}
                onClick={() => setSelectedLanguage(lang.code)}
                data-testid={`language-${lang.code}`}
              >
                <span className="lang-flag">{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Controls */}
        <div className="input-section">
          {/* Text Input */}
          <div className="text-input-container">
            <textarea
              className="text-input"
              placeholder="Type your question here..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={processing || !sessionId}
              rows={3}
            />
            <button
              className="send-button"
              onClick={sendTextMessage}
              disabled={!textInput.trim() || processing || !sessionId}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="input-divider">
            <span>OR</span>
          </div>

          {/* Voice Control */}
          <div className={`voice-control-center ${recording ? 'recording' : ''}`}>
            {processing ? (
              <div className="processing-state">
                <div className="spinner"></div>
                <h3>Processing your question...</h3>
                <p>Analyzing and generating response</p>
              </div>
            ) : (
              <div className="voice-control">
                <button
                  className={`mic-button ${recording ? 'recording' : ''}`}
                  onMouseDown={!recording && sessionId ? startRecording : undefined}
                  onMouseUp={recording ? stopRecording : undefined}
                  onTouchStart={!recording && sessionId ? startRecording : undefined}
                  onTouchEnd={recording ? stopRecording : undefined}
                  disabled={!sessionId}
                  data-testid="voice-record-button"
                >
                  <svg className="mic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    {recording ? (
                      <rect x="6" y="6" width="12" height="12" rx="2" strokeWidth="2"/>
                    ) : (
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8"/>
                    )}
                  </svg>
                </button>
                <h3 className="voice-status">
                  {recording ? '🔴 Recording... Release when done' : 'Press & Hold to Speak'}
                </h3>
                <p className="voice-hint">
                  {recording ? 'Speak clearly into your microphone' : 'Hold button while speaking (min 1 second)'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Conversation History */}
        <div className="conversation-section">
          <div className="section-header">
            <div className="section-title">
              <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <h3>Conversation History</h3>
            </div>
            {messages.length > 1 && (
              <span className="message-count">{messages.length} messages</span>
            )}
          </div>

          <div className="messages-container" data-testid="voice-chat-messages">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🤖</div>
                <h4>Type or speak to begin your tutoring session!</h4>
                <p className="success-text">💡 I'll remember our entire conversation</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`message ${message.role}`}
                  data-testid={`voice-message-${message.role}`}
                >
                  <div className="message-header">
                    <div className="message-avatar">
                      {message.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <span className="message-author">
                      {message.role === 'user' ? 'You' : 'AI Tutor'}
                    </span>
                    {index > 0 && (
                      <span className="turn-badge">Turn {Math.floor(index / 2) + 1}</span>
                    )}
                  </div>
                  <div className="message-bubble">
                    <p>{message.content}</p>
                    {message.audio_url && (
                      <div className="audio-player">
                        <button
                          className="audio-button"
                          onClick={() => togglePlayPause(message.audio_url)}
                          data-testid="play-pause-button"
                        >
                          {playing && currentAudio === message.audio_url ? (
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          )}
                        </button>
                        <span className="audio-label">
                          {playing && currentAudio === message.audio_url ? 'Playing...' : 'Play audio response'}
                        </span>
                        {playing && currentAudio === message.audio_url && (
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${audioProgress}%` }}></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default VoiceTutorInterfaceV2;