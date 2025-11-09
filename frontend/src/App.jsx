import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  IconButton,
  Chip,
} from '@mui/material';
import {
  CloudUpload,
  School,
  Chat,
  Mic,
  VolumeUp,
} from '@mui/icons-material';
import axios from 'axios';
import './App.css';

// Import components
import UploadLecture from './components/UploadLecture';
import LectureList from './components/LectureList';
import LectureViewer from './components/LectureViewer';
import ChatInterface from './components/ChatInterface';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || '';

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLectures();
  }, []);

  const loadLectures = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/lectures`);
      setLectures(response.data.lectures);
      setError(null);
    } catch (err) {
      setError('Failed to load lectures');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = () => {
    loadLectures();
    setCurrentTab(1); // Switch to lectures tab
  };

  const handleSelectLecture = (lecture) => {
    setSelectedLecture(lecture);
    setCurrentTab(2); // Switch to viewer tab
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <AppBar position="static" elevation={2}>
          <Toolbar>
            <School sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              EduVoice - AI Education Platform
            </Typography>
            <Chip 
              label="Voice-First Learning" 
              color="secondary" 
              size="small"
              icon={<VolumeUp />}
            />
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={currentTab} onChange={handleTabChange}>
              <Tab icon={<CloudUpload />} label="Upload Lecture" data-testid="upload-tab" />
              <Tab icon={<School />} label="My Lectures" data-testid="lectures-tab" />
              <Tab 
                icon={<Chat />} 
                label="AI Tutor" 
                disabled={!selectedLecture}
                data-testid="tutor-tab"
              />
            </Tabs>
          </Box>

          {currentTab === 0 && (
            <UploadLecture 
              backendUrl={BACKEND_URL}
              onUploadComplete={handleUploadComplete}
            />
          )}

          {currentTab === 1 && (
            <LectureList
              lectures={lectures}
              loading={loading}
              onSelectLecture={handleSelectLecture}
              onRefresh={loadLectures}
            />
          )}

          {currentTab === 2 && selectedLecture && (
            <Box>
              <LectureViewer
                lectureId={selectedLecture.id}
                backendUrl={BACKEND_URL}
              />
              <ChatInterface
                lectureId={selectedLecture.id}
                backendUrl={BACKEND_URL}
              />
            </Box>
          )}
        </Container>
      </div>
    </ThemeProvider>
  );
}

export default App;
