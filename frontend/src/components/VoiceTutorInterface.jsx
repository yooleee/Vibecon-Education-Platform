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
} from '@mui/material';
import {
  Mic,
  Stop,
  VolumeUp,
  SmartToy,
  Person,
  Pause,
  PlayArrow,
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
  
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const animationRef = useRef(null);

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
          autoGainControl: true
        } 
      });
      
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendVoiceMessage(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
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

      console.log('🎤 Sending voice message (STREAMING)...');

      // Convert to form data
      const formData = new FormData();
      formData.append('audio', audioBlob, 'question.webm');
      formData.append('lecture_id', lectureId);

      // Use streaming endpoint
      const response = await fetch(`${backendUrl}/api/voice-query-stream`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process voice message');
      }

      console.log('✅ Connected to streaming endpoint');

      // Handle SSE streaming
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
        
        console.log(`🔊 Playing audio chunk (${audioQueue.length} remaining in queue)`);
        isPlayingQueue = true;
        const audioData = audioQueue.shift();
        
        try {
          // Decode base64 and create blob
          const binaryString = atob(audioData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          
          // Play audio
          if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.onended = () => {
              console.log('✅ Audio chunk finished');
              URL.revokeObjectURL(url);
              isPlayingQueue = false;
              setPlaying(false);
              playNextAudio(); // Play next in queue
            };
            await audioRef.current.play();
            setPlaying(true);
            console.log('▶️ Audio playing');
          }
        } catch (error) {
          console.error('❌ Audio playback error:', error);
          isPlayingQueue = false;
          playNextAudio(); // Try next chunk
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('✅ Stream complete');
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              console.log('📨 Event:', event.type);
              
              if (event.type === 'question') {
                console.log('👤 Question:', event.data.text);
                // Add user message
                userMessage = {
                  role: 'user',
                  content: event.data.text,
                  timestamp: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, userMessage]);
              }
              else if (event.type === 'start') {
                // AI is thinking
                console.log('🤔 AI thinking...');
                setMessages((prev) => [...prev, assistantMessage]);
              }
              else if (event.type === 'text') {
                console.log('📝 Text:', event.data.text.substring(0, 50));
                // Update assistant message with new text
                assistantMessage.content += ' ' + event.data.text;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...assistantMessage };
                  return newMessages;
                });
              }
              else if (event.type === 'audio') {
                console.log('🎵 Received audio chunk (' + event.data.audio.length + ' chars base64)');
                // Queue audio for playback
                audioQueue.push(event.data.audio);
                playNextAudio();
              }
              else if (event.type === 'complete') {
                // Response complete
                console.log('✅ Response complete, full text length:', event.data.full_response.length);
                assistantMessage.content = event.data.full_response;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...assistantMessage };
                  return newMessages;
                });
              }
              else if (event.type === 'error') {
                console.error('❌ Stream error:', event.data.message);
                setError(event.data.message);
              }
            } catch (e) {
              console.error('Failed to parse SSE event:', e, 'Line:', line);
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
