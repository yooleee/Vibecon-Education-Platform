import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { MenuBook } from '@mui/icons-material';
import axios from 'axios';

function LectureViewer({ lectureId, backendUrl }) {
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

          <Typography variant="h6" gutterBottom>
            Transcript
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
