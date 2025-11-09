import React, { useState, useEffect, useRef } from 'react';
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
  Stepper,
  Step,
  StepLabel,
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
  const [progressStage, setProgressStage] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const eventSourceRef = useRef(null);

  const steps = [
    'Uploading',
    'Extracting Audio',
    'Analyzing Quality',
    'Processing (Parallel)',
    'Generating Embeddings',
    'Finalizing'
  ];

  const stageToStep = {
    'uploading': 0,
    'extracting': 1,
    'analyzing': 2,
    'parallel_processing': 3,
    'chunking': 3,
    'embeddings': 4,
    'saving': 5,
    'completed': 6
  };

  useEffect(() => {
    return () => {
      // Cleanup event source on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

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

  const subscribeToProgress = (lectureId) => {
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`${backendUrl}/api/upload-progress/${lectureId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      setProgress(data.progress || 0);
      setProgressStage(data.stage || '');
      setProgressMessage(data.message || '');
      
      // Update stepper
      const stepIndex = stageToStep[data.stage] || 0;
      setActiveStep(stepIndex);

      if (data.status === 'completed') {
        setResult(data.result);
        setUploading(false);
        eventSource.close();
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else if (data.status === 'error') {
        setError(data.message || 'Upload failed');
        setUploading(false);
        eventSource.close();
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      eventSource.close();
    };
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setUploading(true);
      setError(null);
      setProgress(0);
      setActiveStep(0);

      const response = await axios.post(
        `${backendUrl}/api/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Start listening to progress updates
      subscribeToProgress(response.data.lecture_id);

      // The actual result will come through SSE, but we can set initial data
      if (response.data.status === 'processed') {
        setResult(response.data);
        setSelectedFile(null);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
      console.error('Upload error:', err);
      setUploading(false);
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
            Upload an MP4 lecture video to create an AI-powered tutor (faster processing with parallel optimization)
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
              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              
              <Typography variant="body2" gutterBottom fontWeight="bold">
                {progressMessage}
              </Typography>
              <LinearProgress variant="determinate" value={progress} sx={{ mb: 1 }} />
              <Typography variant="caption" color="text.secondary">
                {progress}% complete
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
                <ListItem>
                  <ListItemText 
                    primary="Voice Cloning Quality" 
                    secondary={`${(result.voice_cloning_quality || 0).toFixed(2)}/100`} 
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
