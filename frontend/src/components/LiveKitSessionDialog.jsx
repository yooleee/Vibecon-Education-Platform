import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Mic,
  MicOff,
  VolumeUp,
  VolumeOff,
  Close,
} from '@mui/icons-material';
import { Room, RoomEvent, Track } from 'livekit-client';
import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;

function LiveKitSessionDialog({ open, onClose, lecture }) {
  const [connectionState, setConnectionState] = useState('disconnected'); // disconnected, connecting, connected, error
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  
  const roomRef = useRef(null);
  const audioRef = useRef(null);
  
  useEffect(() => {
    if (open && lecture) {
      startSession();
    }
    
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, [open, lecture]);
  
  const startSession = async () => {
    try {
      setConnectionState('connecting');
      setError(null);
      
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }
      
      // Request LiveKit session from backend
      const response = await axios.post(
        `${backendUrl}/api/livekit/session/start`,
        { lecture_id: lecture.id },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const { token: livekitToken, url, room_name } = response.data;
      
      // Create LiveKit room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 1280, height: 720 },
        },
      });
      
      roomRef.current = room;
      
      // Set up event listeners
      room.on(RoomEvent.Connected, () => {
        console.log('✅ Connected to LiveKit room');
        setConnectionState('connected');
      });
      
      room.on(RoomEvent.Disconnected, () => {
        console.log('👋 Disconnected from LiveKit room');
        setConnectionState('disconnected');
      });
      
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('🎵 Track subscribed:', track.kind);
        if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          if (audioRef.current) {
            audioRef.current.appendChild(audioElement);
          }
          
          // Detect agent speaking
          track.on('speaking', () => {
            console.log('🗣️ Agent speaking');
            setAgentSpeaking(true);
          });
          
          track.on('stopped_speaking', () => {
            console.log('🤐 Agent stopped speaking');
            setAgentSpeaking(false);
          });
        }
      });
      
      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        console.log('🔇 Track unsubscribed:', track.kind);
        if (track.kind === Track.Kind.Audio) {
          track.detach();
        }
      });
      
      room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('👤 Participant connected:', participant.identity);
      });
      
      // Connect to room
      await room.connect(url, livekitToken);
      
      // Enable microphone
      await room.localParticipant.setMicrophoneEnabled(true);
      
      console.log('🎙️ Microphone enabled');
      
    } catch (err) {
      console.error('❌ Error starting session:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to start session');
      setConnectionState('error');
    }
  };
  
  const toggleMute = async () => {
    if (!roomRef.current) return;
    
    try {
      const newMuted = !isMuted;
      await roomRef.current.localParticipant.setMicrophoneEnabled(!newMuted);
      setIsMuted(newMuted);
      console.log(`🎤 Microphone ${newMuted ? 'muted' : 'unmuted'}`);
    } catch (err) {
      console.error('Error toggling mute:', err);
    }
  };
  
  const toggleSpeaker = () => {
    if (!audioRef.current) return;
    
    const audioElements = audioRef.current.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.muted = !isSpeakerMuted;
    });
    setIsSpeakerMuted(!isSpeakerMuted);
    console.log(`🔊 Speaker ${!isSpeakerMuted ? 'muted' : 'unmuted'}`);
  };
  
  const handleClose = () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setConnectionState('disconnected');
    setError(null);
    onClose();
  };
  
  const getStatusText = () => {
    switch (connectionState) {
      case 'connecting':
        return 'Connecting to tutor...';
      case 'connected':
        return agentSpeaking ? 'Tutor is speaking...' : 'Connected - Speak now';
      case 'error':
        return 'Connection failed';
      default:
        return 'Disconnected';
    }
  };
  
  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return agentSpeaking ? '#FF9500' : '#34C759';
      case 'error':
        return '#FF3B30';
      case 'connecting':
        return '#007AFF';
      default:
        return '#6E6E73';
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={connectionState !== 'connecting' ? handleClose : undefined}
      maxWidth="sm"
      fullWidth
      data-testid="livekit-session-dialog"
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Live Tutor Session
          </Typography>
          <IconButton onClick={handleClose} size="small" data-testid="close-session-button">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" gap={3} py={2}>
          {/* Lecture Info */}
          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Lecture
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {lecture?.filename || 'Unknown Lecture'}
            </Typography>
          </Box>
          
          {/* Connection Status */}
          <Box
            display="flex"
            alignItems="center"
            gap={1.5}
            padding={2}
            borderRadius={2}
            bgcolor="rgba(0, 122, 255, 0.08)"
            width="100%"
            data-testid="connection-status"
          >
            {connectionState === 'connecting' && <CircularProgress size={20} />}
            <Box
              width={12}
              height={12}
              borderRadius="50%"
              bgcolor={getStatusColor()}
              sx={{
                animation: agentSpeaking ? 'pulse 1.5s ease-in-out infinite' : 'none',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                }
              }}
            />
            <Typography variant="body1" fontWeight={500}>
              {getStatusText()}
            </Typography>
          </Box>
          
          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ width: '100%' }} data-testid="session-error">
              {error}
            </Alert>
          )}
          
          {/* Controls */}
          {connectionState === 'connected' && (
            <Box display="flex" gap={2} justifyContent="center">
              <IconButton
                onClick={toggleMute}
                size="large"
                data-testid="toggle-mute-button"
                sx={{
                  bgcolor: isMuted ? '#FF3B30' : '#007AFF',
                  color: '#FFFFFF',
                  width: 64,
                  height: 64,
                  '&:hover': {
                    bgcolor: isMuted ? '#C81414' : '#0051D5',
                  }
                }}
              >
                {isMuted ? <MicOff /> : <Mic />}
              </IconButton>
              
              <IconButton
                onClick={toggleSpeaker}
                size="large"
                data-testid="toggle-speaker-button"
                sx={{
                  bgcolor: isSpeakerMuted ? '#FF3B30' : '#007AFF',
                  color: '#FFFFFF',
                  width: 64,
                  height: 64,
                  '&:hover': {
                    bgcolor: isSpeakerMuted ? '#C81414' : '#0051D5',
                  }
                }}
              >
                {isSpeakerMuted ? <VolumeOff /> : <VolumeUp />}
              </IconButton>
            </Box>
          )}
          
          {/* Audio Container (hidden) */}
          <div ref={audioRef} style={{ display: 'none' }} />
          
          {/* Instructions */}
          {connectionState === 'connected' && (
            <Box textAlign="center" mt={2}>
              <Typography variant="body2" color="text.secondary">
                Speak naturally into your microphone. The AI tutor will respond to your questions about the lecture.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={connectionState === 'connecting'}
          data-testid="end-session-button"
        >
          End Session
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default LiveKitSessionDialog;
