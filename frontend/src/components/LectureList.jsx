import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
  Refresh,
  VideoLibrary,
} from '@mui/icons-material';

function LectureList({ lectures, loading, onSelectLecture, onRefresh }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <Box className="loading-spinner">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          My Lectures ({lectures.length})
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={onRefresh}
          data-testid="refresh-button"
        >
          Refresh
        </Button>
      </Box>

      {lectures.length === 0 ? (
        <Card elevation={2}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <VideoLibrary sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No lectures uploaded yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload your first lecture to get started with AI-powered tutoring
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {lectures.map((lecture) => (
            <Grid item xs={12} md={6} lg={4} key={lecture.id}>
              <Card 
                className="lecture-card" 
                elevation={3}
                data-testid={`lecture-card-${lecture.id}`}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <VideoLibrary sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                      {lecture.filename}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Uploaded: {formatDate(lecture.upload_date)}
                  </Typography>

                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Chip 
                      label={`${lecture.chunks_count} chunks`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<PlayArrow />}
                    onClick={() => onSelectLecture(lecture)}
                    data-testid={`open-lecture-${lecture.id}`}
                  >
                    Open AI Tutor
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default LectureList;
