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
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
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
  Memory,
  History,
} from '@mui/icons-material';
import axios from 'axios';
import QuizTriggerButton from './quiz/QuizTriggerButton';
import QuizConfigModal from './quiz/QuizConfigModal';
import QuizInterface from './quiz/QuizInterface';

function VoiceTutorInterfaceV2({ lectureId, backendUrl }) {
  const [useV2, setUseV2] = useState(true); // Default to V2 (conversation memory)
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  
  // Quiz state
  const [showQuizConfig, setShowQuizConfig] = useState(false);
  const [quizSession, setQuizSession] = useState(null);
  const [quizActive, setQuizActive] = useState(false);
  
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

  // Initialize V2 session when switching to V2 mode
  useEffect(() => {
    if (useV2 && !sessionId) {
      initializeSession();
    }
  }, [useV2, lectureId]);

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
      setError('Failed to initialize conversation session. Falling back to V1.');
      setUseV2(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggleVersion = (event) => {
    const newUseV2 = event.target.checked;
    setUseV2(newUseV2);
    
    if (!newUseV2) {
      // Switching to V1 - clear session
      setSessionId(null);
      setMessages([]);
    } else {
      // Switching to V2 - initialize session
      setMessages([]);
      initializeSession();
    }
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

      let endpoint;
      if (useV2 && sessionId) {
        console.log('🎤 Sending to V2 streaming endpoint with session:', sessionId);
        formData.append('session_id', sessionId);
        endpoint = `${backendUrl}/api/v2/graph/query-stream`;
      } else {
        console.log('🎤 Sending to V1 streaming endpoint');
        formData.append('lecture_id', lectureId);
        endpoint = `${backendUrl}/api/voice-query-stream`;
      }

      const response = await fetch(endpoint, {
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
        const audioUrl = audioQueue.shift();
        
        try {
          if (audioRef.current) {
            audioRef.current.src = `${backendUrl}${audioUrl}`;
            audioRef.current.onended = () => {
              console.log('✅ Audio chunk finished');
              isPlayingQueue = false;
              setPlaying(false);
              playNextAudio();
            };
            await audioRef.current.play();
            setPlaying(true);
            console.log('▶️ Audio playing from URL:', audioUrl);
          }
        } catch (error) {
          console.error('❌ Audio playback error:', error);
          isPlayingQueue = false;
          playNextAudio();
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
                userMessage = {
                  role: 'user',
                  content: event.data.text,
                  timestamp: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, userMessage]);
              }
              else if (event.type === 'start') {
                console.log('🤔 AI thinking...');
                setMessages((prev) => [...prev, assistantMessage]);
              }
              else if (event.type === 'text') {
                console.log('📝 Text:', event.data.text.substring(0, 50));
                assistantMessage.content += ' ' + event.data.text;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...assistantMessage };
                  return newMessages;
                });
              }
              else if (event.type === 'audio') {
                console.log('🎵 Received audio URL:', event.data.audio_url);
                audioQueue.push(event.data.audio_url);
                playNextAudio();
              }
              else if (event.type === 'complete') {
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
            
            {/* V1/V2 Toggle */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                V1
              </Typography>
              <FormControlLabel
                control={
                  <Switch 
                    checked={useV2} 
                    onChange={handleToggleVersion}
                    color="primary"
                    data-testid="v2-toggle"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" color={useV2 ? 'primary' : 'text.secondary'}>
                      V2
                    </Typography>
                    {useV2 && (
                      <Chip 
                        icon={<Memory />}
                        label="Memory" 
                        size="small" 
                        color="success"
                        sx={{ height: 20 }}
                      />
                    )}
                  </Box>
                }
              />
            </Box>
          </Box>

          {useV2 && sessionId && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>🧠 Conversation Memory Active</strong> - I'll remember our conversation! Ask follow-up questions like "Can you explain that in more detail?"
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                Session ID: {sessionId.substring(0, 8)}...
              </Typography>
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
            🎤 Press and HOLD the microphone button while speaking, then release to send
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Language Selector */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            mb: 3,
            p: 2,
            bgcolor: 'white',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Language color="primary" />
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Response Language:
            </Typography>
            <ToggleButtonGroup
              value={selectedLanguage}
              exclusive
              onChange={(e, newLang) => { 
                if (newLang) setSelectedLanguage(newLang); 
              }}
              size="small"
              data-testid="language-selector"
            >
              {languages.map((lang) => (
                <ToggleButton 
                  key={lang.code} 
                  value={lang.code}
                  data-testid={`language-${lang.code}`}
                >
                  <span style={{ marginRight: '4px' }}>{lang.flag}</span>
                  <span>{lang.label}</span>
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
                  {useV2 ? 'Processing with memory...' : 'Processing your question...'}
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
                  {recording ? '🔴 Recording... Keep speaking, release when done' : 'Press & Hold to Speak'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {recording ? 'Speak clearly into your microphone' : 'Hold button while speaking (min 1 second)'}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Conversation History */}
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <History color="action" />
              <Typography variant="h6">
                Conversation History
              </Typography>
              {useV2 && messages.length > 1 && (
                <Chip 
                  label={`${messages.length} messages`} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              )}
            </Box>
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
                  {useV2 && (
                    <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                      💡 With V2, I'll remember our entire conversation
                    </Typography>
                  )}
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
                      {useV2 && index > 0 && (
                        <Chip 
                          label={`Turn ${Math.floor(index / 2) + 1}`}
                          size="small"
                          sx={{ ml: 1, height: 16, fontSize: '0.65rem' }}
                        />
                      )}
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

export default VoiceTutorInterfaceV2;
