import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  Fab,
  Chip,
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Mic,
  Stop,
  VolumeUp,
  SmartToy,
  Person,
  Pause,
  PlayArrow,
  Language,
} from '@mui/icons-material';
import axios from 'axios';

function VoiceTutorInterface({ lectureId, backendUrl }) {
  const [messages, setMessages] = useState([]);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('en'); // Language state
  
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const animationRef = useRef(null);

  // Language options
  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Spanish', flag: '🇪🇸' },
    { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Auto-play the latest audio response
    if (currentAudio && !playing) {
      playAudio(currentAudio);
    }
  }, [currentAudio]);

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
          sampleRate: 16000, // Optimal for Whisper
        } 
      });
      
      const startTime = Date.now();
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const recordingDuration = Date.now() - startTime;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Audio recorded:', audioBlob.size, 'bytes', 'Duration:', recordingDuration, 'ms');
        
        // Check if recording is too short
        if (recordingDuration < 500) {
          setError('Recording too short. Please hold the button and speak for at least 1 second.');
          stream.getTracks().forEach(track => track.stop());
          setRecording(false);
          return;
        }
        
        if (audioBlob.size < 2000) {
          setError('No audio detected. Please speak louder and hold the button while speaking.');
          stream.getTracks().forEach(track => track.stop());
          setRecording(false);
          return;
        }
        
        await sendVoiceMessage(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording with timeslice to collect data continuously
      mediaRecorderRef.current.start(100); // Collect data every 100ms
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

      // Convert to WAV for better compatibility
      const formData = new FormData();
      formData.append('audio', audioBlob, 'question.webm');
      formData.append('lecture_id', lectureId);
      formData.append('language', selectedLanguage); // Include selected language

      const response = await axios.post(
        `${backendUrl}/api/voice-query`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Add user question
      const userMessage = {
        role: 'user',
        content: response.data.question,
        timestamp: new Date().toISOString(),
      };

      // Add AI response
      const assistantMessage = {
        role: 'assistant',
        content: response.data.answer,
        audio_url: response.data.audio_url,
        relevant_chunks: response.data.relevant_chunks,
        timestamp: new Date().toISOString(),
        language: response.data.language,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setCurrentAudio(response.data.audio_url);

    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process voice message');
      console.error('Voice query error:', err);
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
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Card elevation={3} sx={{ bgcolor: '#f8f9fa' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <VolumeUp sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h5" component="div">
              Voice AI Tutor
            </Typography>
            <Chip 
              label="Voice-First" 
              color="secondary" 
              size="small" 
              sx={{ ml: 2 }}
              icon={<Mic />}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
            🎤 Press and hold the microphone to ask questions about the lecture
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Language Selector */}
          <Box sx={{ 
            mb: 3, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 2,
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Language color="primary" />
            <Typography variant="body1" fontWeight="bold">
              Response Language:
            </Typography>
            <ToggleButtonGroup
              value={selectedLanguage}
              exclusive
              onChange={(e, newLang) => {
                if (newLang !== null) {
                  setSelectedLanguage(newLang);
                }
              }}
              size="small"
              data-testid="language-selector"
            >
              {languages.map((lang) => (
                <ToggleButton 
                  key={lang.code} 
                  value={lang.code}
                  data-testid={`language-${lang.code}`}
                  sx={{
                    px: 2,
                    py: 1,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      }
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </Box>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Voice Control Center */}
          <Box sx={{ 
            textAlign: 'center', 
            py: 4,
            bgcolor: recording ? 'error.light' : 'white',
            borderRadius: 2,
            mb: 3,
            transition: 'all 0.3s ease',
            border: recording ? '3px solid' : '1px solid',
            borderColor: recording ? 'error.main' : 'divider'
          }}>
            {processing ? (
              <Box>
                <CircularProgress size={80} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Processing your question...
                </Typography>
              </Box>
            ) : (
              <Box>
                <Fab
                  color={recording ? 'error' : 'primary'}
                  size="large"
                  onMouseDown={!recording ? startRecording : undefined}
                  onMouseUp={recording ? stopRecording : undefined}
                  onTouchStart={!recording ? startRecording : undefined}
                  onTouchEnd={recording ? stopRecording : undefined}
                  sx={{ 
                    width: 100, 
                    height: 100,
                    animation: recording ? 'pulse 1.5s ease-in-out infinite' : 'none',
                    '@keyframes pulse': {
                      '0%, 100%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.1)' }
                    }
                  }}
                  data-testid="voice-record-button"
                >
                  {recording ? <Stop sx={{ fontSize: 48 }} /> : <Mic sx={{ fontSize: 48 }} />}
                </Fab>
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 'bold' }}>
                  {recording ? '🔴 Recording... Release to send' : 'Press & Hold to Speak'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {recording ? 'Ask your question clearly' : 'Voice responses will play automatically'}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Conversation History */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Conversation History
            </Typography>
            <Box 
              className="chat-messages" 
              sx={{ 
                maxHeight: 400, 
                overflowY: 'auto',
                bgcolor: 'white',
                borderRadius: 2,
                p: 2
              }}
              data-testid="voice-chat-messages"
            >
              {messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <SmartToy sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    Start speaking to begin your tutoring session!
                  </Typography>
                </Box>
              ) : (
                messages.map((message, index) => (
                  <Box
                    key={index}
                    className={`message ${message.role}`}
                    sx={{ mb: 2 }}
                    data-testid={`voice-message-${message.role}`}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      {message.role === 'user' ? (
                        <Person sx={{ fontSize: 20, mr: 0.5, color: 'primary.main' }} />
                      ) : (
                        <SmartToy sx={{ fontSize: 20, mr: 0.5, color: 'secondary.main' }} />
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                        {message.role === 'user' ? 'You' : 'AI Tutor'}
                      </Typography>
                    </Box>
                    <Paper 
                      className="message-bubble" 
                      elevation={1}
                      sx={{
                        p: 2,
                        bgcolor: message.role === 'user' ? 'primary.light' : 'grey.100',
                        color: message.role === 'user' ? 'primary.contrastText' : 'text.primary'
                      }}
                    >
                      <Typography variant="body1">{message.content}</Typography>
                      {message.audio_url && (
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => togglePlayPause(message.audio_url)}
                              color="primary"
                              data-testid="play-pause-button"
                            >
                              {playing && currentAudio === message.audio_url ? <Pause /> : <PlayArrow />}
                            </IconButton>
                            <Typography variant="caption">
                              {playing && currentAudio === message.audio_url ? 'Playing...' : 'Play audio response'}
                            </Typography>
                          </Box>
                          {playing && currentAudio === message.audio_url && (
                            <LinearProgress 
                              variant="determinate" 
                              value={audioProgress} 
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Box>
                      )}
                    </Paper>
                  </Box>
                ))
              )}
              <div ref={messagesEndRef} />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        style={{ display: 'none' }}
      />
    </Box>
  );
}

export default VoiceTutorInterface;
