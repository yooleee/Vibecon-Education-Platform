import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import './App.css';

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || '';

function App() {
  const [lectures, setLectures] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Refs for smooth scrolling
  const heroRef = useRef(null);
  const uploadRef = useRef(null);
  const libraryRef = useRef(null);
  const viewerRef = useRef(null);
  const tutorRef = useRef(null);

  useEffect(() => {
    loadLectures();
  }, []);

  const loadLectures = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/lectures`);
      setLectures(response.data.lectures);
    } catch (err) {
      console.error('Failed to load lectures:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLectureSelect = (lecture) => {
    setSelectedLecture(lecture);
    setTimeout(() => scrollToSection(viewerRef), 100);
  };

  const handleUploadComplete = () => {
    loadLectures();
    setTimeout(() => scrollToSection(libraryRef), 500);
  };

  const handleDeleteLecture = async (lectureId) => {
    if (!confirm('Are you sure you want to delete this lecture? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${BACKEND_URL}/api/lectures/${lectureId}`);
      loadLectures();
      if (selectedLecture?.id === lectureId) {
        setSelectedLecture(null);
      }
    } catch (error) {
      console.error('Error deleting lecture:', error);
      alert('Failed to delete lecture. Please try again.');
    }
  };

  return (
    <div className="app-container">
      {/* Hero Section */}
      <section ref={heroRef} className="section-hero" data-testid="hero-section">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="mb-lg">Your AI-Powered Learning Platform</h1>
            <p className="text-secondary" style={{ fontSize: '1.25rem', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
              Upload lecture videos, get instant transcripts, and learn with an AI tutor that speaks in your professor's voice
            </p>
            <div className="flex gap-md justify-center" style={{ marginTop: '2rem' }}>
              <button
                className="glass-button-primary glass-button"
                onClick={() => scrollToSection(uploadRef)}
                data-testid="hero-upload-button"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                Upload Lecture
              </button>
              <button
                className="glass-button"
                onClick={() => scrollToSection(libraryRef)}
                data-testid="hero-library-button"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                View Library ({lectures.length})
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Upload Section */}
      <section ref={uploadRef} className="section" data-testid="upload-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-center mb-lg">Upload New Lecture</h2>
            <p className="text-center text-secondary mb-2xl" style={{ fontSize: '1.125rem' }}>
              Drop an MP4 video file to create an AI-powered tutor
            </p>
            <UploadSection 
              backendUrl={BACKEND_URL}
              onUploadComplete={handleUploadComplete}
              uploading={uploading}
              setUploading={setUploading}
              uploadProgress={uploadProgress}
              setUploadProgress={setUploadProgress}
            />
          </motion.div>
        </div>
      </section>

      {/* Library Section */}
      <section ref={libraryRef} className="section" style={{ background: 'var(--background-secondary)' }} data-testid="library-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-between items-center mb-2xl">
              <h2>My Lectures ({lectures.length})</h2>
              <button
                className="glass-button"
                onClick={loadLectures}
                disabled={loading}
                data-testid="refresh-lectures-button"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M1 4v6h6M23 20v-6h-6" />
                  <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                </svg>
                Refresh
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center" style={{ minHeight: '300px' }}>
                <div className="spinner"></div>
              </div>
            ) : lectures.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card text-center"
                style={{ padding: 'var(--space-4xl)' }}
              >
                <svg width="80" height="80" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto var(--space-lg)' }}>
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <h3 className="mb-md">No lectures uploaded yet</h3>
                <p className="text-secondary">Upload your first lecture to get started with AI-powered tutoring</p>
                <button
                  className="glass-button-primary glass-button mt-xl"
                  onClick={() => scrollToSection(uploadRef)}
                >
                  Upload Your First Lecture
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-3">
                {lectures.map((lecture, index) => (
                  <motion.div
                    key={lecture.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="glass-card"
                    data-testid={`lecture-card-${lecture.id}`}
                  >
                    <div className="flex justify-between items-start mb-md">
                      <div style={{ flex: 1 }}>
                        <h4 className="mb-sm">{lecture.filename}</h4>
                        <p className="text-secondary text-sm">
                          Uploaded: {new Date(lecture.upload_date).toLocaleDateString()}
                        </p>
                        <p className="text-tertiary text-sm mt-sm">
                          {lecture.chunks_count} chunks
                        </p>
                      </div>
                      <button
                        className="glass-button-danger"
                        style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
                        onClick={() => handleDeleteLecture(lecture.id)}
                        data-testid={`delete-lecture-${lecture.id}`}
                        title="Delete lecture"
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <button
                      className="glass-button-primary glass-button"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => handleLectureSelect(lecture)}
                      data-testid={`open-lecture-${lecture.id}`}
                    >
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Open AI Tutor
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Viewer Section - Only show when lecture selected */}
      {selectedLecture && (
        <>
          <section ref={viewerRef} className="section" data-testid="viewer-section">
            <div className="container">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <LectureViewer
                  lectureId={selectedLecture.id}
                  backendUrl={BACKEND_URL}
                  onDelete={() => handleDeleteLecture(selectedLecture.id)}
                  onBack={() => {
                    setSelectedLecture(null);
                    scrollToSection(libraryRef);
                  }}
                />
              </motion.div>
            </div>
          </section>

          {/* AI Tutor Section */}
          <section ref={tutorRef} className="section" style={{ background: 'var(--background-secondary)' }} data-testid="tutor-section">
            <div className="container">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h2 className="text-center mb-2xl">AI Tutor</h2>
                <VoiceTutorInterfaceV2
                  lectureId={selectedLecture.id}
                  backendUrl={BACKEND_URL}
                />
              </motion.div>
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <footer style={{ background: 'var(--background-tertiary)', padding: 'var(--space-3xl) 0', textAlign: 'center' }}>
        <div className="container">
          <p className="text-secondary text-sm">
            AI-Powered Learning Platform • {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

// Upload Section Component
function UploadSection({ backendUrl, onUploadComplete, uploading, setUploading, uploadProgress, setUploadProgress }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeProcessing, setYoutubeProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file) => {
    if (!file.name.endsWith('.mp4') && !file.name.endsWith('.MP4')) {
      setError('Only MP4 files are supported');
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${backendUrl}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      setUploadProgress(100);
      setTimeout(() => {
        onUploadComplete();
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleYouTubeSubmit = async () => {
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    setError(null);
    setYoutubeProcessing(true);

    try {
      const response = await axios.post(`${backendUrl}/api/upload-youtube`, {
        youtube_url: youtubeUrl
      });

      setShowYouTubeModal(false);
      setYoutubeUrl('');
      setTimeout(() => {
        onUploadComplete();
      }, 500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process YouTube video. Please try again.');
    } finally {
      setYoutubeProcessing(false);
    }
  };

  return (
    <div className="container-narrow">
      {/* Upload Options */}
      <div className="flex gap-md justify-center mb-xl" style={{ flexWrap: 'wrap' }}>
        <button
          className="glass-button-primary glass-button"
          onClick={() => !uploading && !youtubeProcessing && fileInputRef.current?.click()}
          disabled={uploading || youtubeProcessing}
          data-testid="upload-file-button"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          Upload MP4 File
        </button>
        <button
          className="glass-button"
          onClick={() => setShowYouTubeModal(true)}
          disabled={uploading || youtubeProcessing}
          data-testid="youtube-link-button"
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          YouTube Link
        </button>
      </div>

      <div
        className={`glass-card ${dragActive ? 'drag-active' : ''}`}
        style={{
          border: dragActive ? '2px dashed var(--accent-primary)' : '2px dashed var(--glass-light-border)',
          background: dragActive ? 'rgba(0, 122, 255, 0.05)' : 'var(--glass-white)',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && !youtubeProcessing && fileInputRef.current?.click()}
        data-testid="upload-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp4"
          onChange={handleChange}
          style={{ display: 'none' }}
          disabled={uploading || youtubeProcessing}
        />
        
        {uploading || youtubeProcessing ? (
          <div>
            <div className="spinner" style={{ margin: '0 auto var(--space-lg)' }}></div>
            <h3 className="mb-md">{uploading ? 'Uploading and processing...' : 'Processing YouTube video...'}</h3>
            <div style={{ width: '100%', background: 'var(--background-secondary)', borderRadius: 'var(--radius-full)', height: '8px', overflow: 'hidden' }}>
              <div
                style={{
                  width: uploading ? `${uploadProgress}%` : '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-primary-hover) 100%)',
                  transition: 'width 0.3s ease',
                  animation: youtubeProcessing ? 'shimmer 1.5s ease-in-out infinite' : 'none',
                }}
              />
            </div>
            {uploading && <p className="text-secondary mt-md">{uploadProgress}%</p>}
          </div>
        ) : (
          <>
            <svg width="64" height="64" fill="none" stroke="var(--accent-primary)" strokeWidth="2" viewBox="0 0 24 24" style={{ margin: '0 auto var(--space-lg)' }}>
              <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h3 className="mb-sm">Drop MP4 file here or click to browse</h3>
            <p className="text-secondary">Maximum file size: 500MB</p>
          </>
        )}
      </div>
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card mt-lg"
          style={{ background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.3)' }}
        >
          <p style={{ color: 'var(--accent-error)', textAlign: 'center', margin: 0 }}>{error}</p>
        </motion.div>
      )}

      {/* YouTube Modal */}
      {showYouTubeModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowYouTubeModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card"
            style={{ maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
            data-testid="youtube-modal"
          >
            <h3 className="mb-lg">Enter YouTube URL</h3>
            <input
              type="text"
              className="glass-input mb-lg"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleYouTubeSubmit()}
              autoFocus
              data-testid="youtube-url-input"
            />
            <div className="flex gap-md justify-end">
              <button
                className="glass-button"
                onClick={() => setShowYouTubeModal(false)}
                disabled={youtubeProcessing}
              >
                Cancel
              </button>
              <button
                className="glass-button-primary glass-button"
                onClick={handleYouTubeSubmit}
                disabled={youtubeProcessing || !youtubeUrl.trim()}
                data-testid="youtube-submit-button"
              >
                {youtubeProcessing ? 'Processing...' : 'Process Video'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Lecture Viewer Component
function LectureViewer({ lectureId, backendUrl, onDelete, onBack }) {
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
      <div className="flex justify-center items-center" style={{ minHeight: '300px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.3)', textAlign: 'center' }}>
        <p style={{ color: 'var(--accent-error)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="glass-card">
      <div className="flex justify-between items-center mb-xl">
        <div style={{ flex: 1 }}>
          <h2 className="mb-sm">{lecture.filename}</h2>
          <p className="text-secondary">
            Uploaded: {new Date(lecture.upload_date).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-md">
          <button
            className="glass-button"
            onClick={onBack}
            data-testid="back-to-library-button"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <button
            className="glass-button-danger glass-button"
            onClick={onDelete}
            data-testid="delete-lecture-viewer-button"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--glass-light-border)', paddingTop: 'var(--space-xl)' }}>
        <h3 className="mb-lg">Transcript</h3>
        <div style={{ lineHeight: '1.8', color: 'var(--text-primary)' }} data-testid="transcript-viewer">
          {lecture.transcript.split('\n').map((paragraph, index) => (
            paragraph && <p key={index} className="mb-md">{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// Voice Tutor Interface Component
function VoiceTutorInterface({ lectureId, backendUrl }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [language, setLanguage] = useState('en');
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  const handleTextQuery = async () => {
    if (!question.trim() || loading) return;

    const userQuestion = question;
    setQuestion('');
    setMessages(prev => [...prev, { type: 'user', text: userQuestion }]);
    setLoading(true);

    try {
      const response = await axios.post(`${backendUrl}/api/query`, {
        lecture_id: lectureId,
        question: userQuestion,
        mode: 'text',
        language,
      });

      setMessages(prev => [...prev, {
        type: 'assistant',
        text: response.data.answer,
        audioUrl: response.data.audio_url,
      }]);
    } catch (error) {
      console.error('Query error:', error);
      setMessages(prev => [...prev, {
        type: 'error',
        text: 'Failed to get answer. Please try again.',
      }]);
    } finally {
      setLoading(false);
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
          setError('Recording too short. Please hold for at least 1 second.');
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        if (audioBlob.size < 2000) {
          setError('No audio detected. Please check your microphone.');
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
      formData.append('lecture_id', lectureId);
      formData.append('language', language);

      const response = await fetch(`${backendUrl}/api/voice-query-stream`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process voice message');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let userMessage = null;
      let assistantMessage = {
        type: 'assistant',
        text: '',
      };
      
      const audioQueue = [];
      let isPlayingQueue = false;

      const playNextAudio = async () => {
        if (isPlayingQueue || audioQueue.length === 0) return;
        
        isPlayingQueue = true;
        const audioUrl = audioQueue.shift();
        
        try {
          if (audioRef.current) {
            audioRef.current.src = `${backendUrl}${audioUrl}`;
            audioRef.current.onended = () => {
              isPlayingQueue = false;
              playNextAudio();
            };
            await audioRef.current.play();
          }
        } catch (error) {
          console.error('Audio playback error:', error);
          isPlayingQueue = false;
          playNextAudio();
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              
              if (event.type === 'question') {
                userMessage = {
                  type: 'user',
                  text: event.data.text,
                };
                setMessages((prev) => [...prev, userMessage]);
              }
              else if (event.type === 'start') {
                setMessages((prev) => [...prev, assistantMessage]);
              }
              else if (event.type === 'text') {
                assistantMessage.text += ' ' + event.data.text;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...assistantMessage };
                  return newMessages;
                });
              }
              else if (event.type === 'audio') {
                audioQueue.push(event.data.audio_url);
                playNextAudio();
              }
              else if (event.type === 'complete') {
                assistantMessage.text = event.data.full_response;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...assistantMessage };
                  return newMessages;
                });
              }
              else if (event.type === 'error') {
                setError(event.data.message);
              }
            } catch (e) {
              console.error('Failed to parse SSE event:', e);
            }
          }
        }
      }

    } catch (err) {
      console.error('Voice query error:', err);
      setError(err.message || 'Failed to process voice message');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container-narrow">
      <div className="glass-card">
        {/* Language Selector */}
        <div className="flex gap-md mb-xl justify-center" style={{ flexWrap: 'wrap' }}>
          <span className="text-secondary">Response Language:</span>
          {[
            { code: 'en', label: 'English', flag: '🇺🇸' },
            { code: 'es', label: 'Spanish', flag: '🇪🇸' },
            { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
          ].map(lang => (
            <button
              key={lang.code}
              className={language === lang.code ? 'glass-button-primary glass-button' : 'glass-button'}
              onClick={() => setLanguage(lang.code)}
              data-testid={`language-${lang.code}`}
              style={{ padding: '8px 16px' }}
            >
              <span>{lang.flag} {lang.label}</span>
            </button>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-lg"
            style={{ 
              padding: 'var(--space-md)', 
              background: 'rgba(255, 59, 48, 0.1)', 
              border: '1px solid rgba(255, 59, 48, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-error)'
            }}
          >
            {error}
          </motion.div>
        )}

        {/* Voice Recording Button */}
        <div 
          className="mb-xl"
          style={{
            textAlign: 'center',
            padding: 'var(--space-3xl)',
            background: recording ? 'rgba(255, 59, 48, 0.1)' : 'var(--background-secondary)',
            borderRadius: 'var(--radius-xl)',
            border: recording ? '2px solid var(--accent-error)' : '2px solid var(--glass-light-border)',
            transition: 'all 0.3s ease',
          }}
        >
          {processing ? (
            <div>
              <div className="spinner" style={{ margin: '0 auto var(--space-lg)' }}></div>
              <h4>Processing your question...</h4>
            </div>
          ) : (
            <div>
              <button
                className={recording ? 'glass-button-danger glass-button' : 'glass-button-primary glass-button'}
                onMouseDown={!recording ? startRecording : undefined}
                onMouseUp={recording ? stopRecording : undefined}
                onTouchStart={!recording ? startRecording : undefined}
                onTouchEnd={recording ? stopRecording : undefined}
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  fontSize: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-lg)',
                  animation: recording ? 'pulse 1.5s ease-in-out infinite' : 'none',
                }}
                data-testid="voice-record-button"
              >
                {recording ? (
                  <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                ) : (
                  <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                )}
              </button>
              <h3 className="mb-sm">
                {recording ? '🔴 Recording... Release when done' : 'Press & Hold to Speak'}
              </h3>
              <p className="text-secondary">
                {recording ? 'Speak clearly into your microphone' : 'Hold button while speaking (min 1 second)'}
              </p>
            </div>
          )}
        </div>

        {/* Messages */}
        <div style={{ minHeight: '300px', maxHeight: '500px', overflowY: 'auto', marginBottom: 'var(--space-xl)' }}>
          {messages.length === 0 ? (
            <div className="text-center text-secondary" style={{ paddingTop: 'var(--space-2xl)' }}>
              <svg width="80" height="80" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto var(--space-lg)' }}>
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>Ask me anything about this lecture!</p>
              <p className="text-tertiary" style={{ fontSize: '0.875rem', marginTop: 'var(--space-sm)' }}>Use voice or type your question below</p>
            </div>
          ) : (
            <div className="flex flex-col gap-lg">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: 'var(--space-md)',
                      borderRadius: 'var(--radius-lg)',
                      background: msg.type === 'user'
                        ? 'linear-gradient(135deg, rgba(0, 122, 255, 0.9), rgba(0, 81, 213, 0.9))'
                        : msg.type === 'error'
                        ? 'rgba(255, 59, 48, 0.1)'
                        : 'var(--glass-light)',
                      color: msg.type === 'user' ? 'var(--text-inverse)' : msg.type === 'error' ? 'var(--accent-error)' : 'var(--text-primary)',
                      border: msg.type !== 'user' ? '1px solid var(--glass-light-border)' : 'none',
                    }}
                  >
                    <p style={{ margin: 0, lineHeight: '1.6' }}>{msg.text}</p>
                    {msg.audioUrl && (
                      <audio controls style={{ width: '100%', marginTop: 'var(--space-md)' }}>
                        <source src={`${backendUrl}${msg.audioUrl}`} type="audio/mpeg" />
                      </audio>
                    )}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div style={{ padding: 'var(--space-md)' }}>
                    <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Text Input */}
        <div className="flex gap-md">
          <input
            type="text"
            className="glass-input"
            placeholder="Or type a question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTextQuery()}
            disabled={loading || processing}
            data-testid="question-input"
          />
          <button
            className="glass-button-primary glass-button"
            onClick={handleTextQuery}
            disabled={loading || processing || !question.trim()}
            data-testid="send-question-button"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
            Send
          </button>
        </div>
      </div>
      
      {/* Hidden audio element for voice playback */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
}

export default App;
