import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { CloudUpload, CheckCircle } from '@mui/icons-material';
import axios from 'axios';

function UploadLecture({ backendUrl, onUploadComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith('.mp4')) {
      setSelectedFile(file);
      setError(null);
      setResult(null);
    } else {
      setError('Please select an MP4 file');
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith('.mp4')) {
      setSelectedFile(file);
      setError(null);
      setResult(null);
    } else {
      setError('Please drop an MP4 file');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setUploading(true);
      setError(null);
      setProgress(20);

      const response = await axios.post(
        `${backendUrl}/api/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 50) / progressEvent.total
            );
            setProgress(percentCompleted);
          },
        }
      );

      // Simulate processing progress
      setProgress(60);
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(80);
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(100);

      setResult(response.data);
      setSelectedFile(null);
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <Box>
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Upload Lecture Video
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Upload an MP4 lecture video to create an AI-powered tutor
          </Typography>

          <Box
            className={`upload-zone ${dragging ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('file-input').click()}
            sx={{ my: 3 }}
            data-testid="upload-zone"
          >
            <input
              id="file-input"
              type="file"
              accept=".mp4"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              data-testid="file-input"
            />
            <CloudUpload sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {selectedFile ? selectedFile.name : 'Drop MP4 file here or click to browse'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Maximum file size: 500MB
            </Typography>
          </Box>

          {selectedFile && !uploading && !result && (
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<CloudUpload />}
              onClick={handleUpload}
              data-testid="upload-button"
            >
              Upload and Process
            </Button>
          )}

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Processing lecture... This may take a few minutes.
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="caption" sx={{ mt: 1 }}>
                {progress < 50 && 'Uploading video...'}
                {progress >= 50 && progress < 80 && 'Extracting audio and transcribing...'}
                {progress >= 80 && 'Generating embeddings...'}
              </Typography>
            </Box>
          )}

          {result && (
            <Alert severity="success" icon={<CheckCircle />} sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Lecture processed successfully!
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Filename" 
                    secondary={result.filename} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Chunks Created" 
                    secondary={result.chunks_count} 
                  />
                </ListItem>
              </List>
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default UploadLecture;
