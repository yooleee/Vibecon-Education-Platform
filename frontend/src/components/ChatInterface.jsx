import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Send,
  Mic,
  Stop,
  VolumeUp,
  SmartToy,
  Person,
} from '@mui/icons-material';
import axios from 'axios';

function ChatInterface({ lectureId, backendUrl }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: inputText,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, userMessage]);
    setInputText('');
    setError(null);

    try {
      setLoading(true);

      const response = await axios.post(`${backendUrl}/api/query`, {
        lecture_id: lectureId,
        question: inputText,
        mode: voiceMode ? 'voice' : 'text',
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.answer,
        relevant_chunks: response.data.relevant_chunks,
        audio_url: response.data.audio_url,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Auto-play audio if in voice mode
      if (voiceMode && response.data.audio_url) {
        playAudio(response.data.audio_url);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get response');
      console.error('Query error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendVoiceMessage(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      setError('Failed to access microphone');
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
    // For now, just show a placeholder message
    // In full implementation, we would send audio to backend for transcription
    const userMessage = {
      role: 'user',
      content: '[Voice message - transcription pending]',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setError('Voice input transcription will be implemented when Deepgram/Whisper keys are provided');
  };

  const playAudio = (audioUrl) => {
    if (audioRef.current) {
      audioRef.current.src = `${backendUrl}${audioUrl}`;
      audioRef.current.play();
      setPlayingAudio(true);
    }
  };

  const handleAudioEnded = () => {
    setPlayingAudio(false);
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Card elevation={3}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SmartToy sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" component="div">
              AI Tutor Chat
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Ask questions about the lecture content
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box className="chat-container" sx={{ mt: 2 }}>
            <Box className="chat-messages" data-testid="chat-messages">
              {messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <SmartToy sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    Ask me anything about the lecture!
                  </Typography>
                </Box>
              ) : (
                messages.map((message, index) => (
                  <Box
                    key={index}
                    className={`message ${message.role}`}
                    data-testid={`message-${message.role}`}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      {message.role === 'user' ? (
                        <Person sx={{ fontSize: 20, mr: 0.5 }} />
                      ) : (
                        <SmartToy sx={{ fontSize: 20, mr: 0.5 }} />
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {message.role === 'user' ? 'You' : 'AI Tutor'}
                      </Typography>
                    </Box>
                    <Paper className="message-bubble" elevation={1}>
                      <Typography variant="body1">{message.content}</Typography>
                      {message.audio_url && (
                        <IconButton
                          size="small"
                          onClick={() => playAudio(message.audio_url)}
                          sx={{ mt: 1 }}
                          data-testid="play-audio-button"
                        >
                          <VolumeUp />
                        </IconButton>
                      )}
                    </Paper>
                  </Box>
                ))
              )}
              {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    AI is thinking...
                  </Typography>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>

            <Box className="chat-input-container">
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about the lecture..."
                  disabled={loading || recording}
                  variant="outlined"
                  size="small"
                  data-testid="chat-input"
                />
                
                <Tooltip title={recording ? 'Stop recording' : 'Start voice input'}>
                  <IconButton
                    color={recording ? 'error' : 'default'}
                    onClick={recording ? stopRecording : startRecording}
                    disabled={loading}
                    className={recording ? 'voice-recording' : ''}
                    data-testid="voice-input-button"
                  >
                    {recording ? <Stop /> : <Mic />}
                  </IconButton>
                </Tooltip>

                <Button
                  variant="contained"
                  endIcon={<Send />}
                  onClick={handleSendMessage}
                  disabled={loading || !inputText.trim() || recording}
                  data-testid="send-button"
                >
                  Send
                </Button>
              </Box>
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

export default ChatInterface;
