import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  Button,
  Paper,
} from '@mui/material';
import { MenuBook, Summarize, VolumeUp } from '@mui/icons-material';
import axios from 'axios';

function LectureViewer({ lectureId, backendUrl }) {
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  useEffect(() => {
    loadLecture();
  }, [lectureId]);

  const loadLecture = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/lectures/${lectureId}`);
      setLecture(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load lecture');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    try {
      setSummaryLoading(true);
      setSummaryError(null);
      
      const response = await axios.post(`${backendUrl}/api/lectures/${lectureId}/summary`);
      setSummary(response.data);
    } catch (err) {
      setSummaryError('Failed to generate summary. Please try again.');
      console.error('Summary error:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  if (loading) {
    return (
      <Box className="loading-spinner">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Card elevation={3}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <MenuBook sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" component="div">
              {lecture.filename}
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Uploaded: {new Date(lecture.upload_date).toLocaleString()}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Summary Section */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Lecture Summary
              </Typography>
              {!summary && (
                <Button
                  variant="contained"
                  startIcon={<Summarize />}
                  onClick={handleGenerateSummary}
                  disabled={summaryLoading}
                  data-testid="generate-summary-button"
                >
                  {summaryLoading ? 'Generating...' : 'Generate Summary'}
                </Button>
              )}
            </Box>

            {summaryLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary">
                  Generating summary with AI...
                </Typography>
              </Box>
            )}

            {summaryError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {summaryError}
              </Alert>
            )}

            {summary && (
              <Paper elevation={2} sx={{ p: 3, bgcolor: 'grey.50' }}>
                <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
                  {summary.summary}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    {summary.word_count} words • {summary.cached ? 'Cached' : 'Freshly generated'}
                  </Typography>
                  
                  <audio 
                    controls 
                    src={`${backendUrl}${summary.audio_url}`}
                    style={{ maxWidth: '100%' }}
                    data-testid="summary-audio-player"
                  >
                    <source src={`${backendUrl}${summary.audio_url}`} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VolumeUp fontSize="small" color="primary" />
                  <Typography variant="caption" color="primary">
                    Listen to the summary in the professor's voice
                  </Typography>
                </Box>
              </Paper>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Full Transcript
          </Typography>

          <Box className="transcript-viewer" data-testid="transcript-viewer">
            {lecture.transcript.split('\n').map((paragraph, index) => (
              <Typography 
                key={index} 
                variant="body1" 
                paragraph
                sx={{ lineHeight: 1.8 }}
              >
                {paragraph}
              </Typography>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default LectureViewer;
