import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import VoiceTutorInterfaceV2 from './components/VoiceTutorInterfaceV2';
import LiveKitVoiceChat from './components/LiveKitVoiceChat';
import './App.css';

// Import illustrations
import heroIllustration from './illustrations/p10.svg';
import uploadIllustration from './illustrations/p7.svg';
import emptyStateIllustration from './illustrations/p8.svg';
import tutorIllustration from './illustrations/p5.svg';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

function AppContent() {
  const { user, isAuthenticated, loginWithGoogle, logout } = useAuth();
  const [lectures, setLectures] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [chatMode, setChatMode] = useState('standard'); // 'standard' or 'livekit'

  // Refs for smooth scrolling
  const heroRef = useRef(null);
  const uploadRef = useRef(null);
  const libraryRef = useRef(null);
  const viewerRef = useRef(null);
  const tutorRef = useRef(null);

  useEffect(() => {
    loadLectures();
  }, [isAuthenticated]);  // Reload when auth state changes

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
      if (error.response?.status === 403) {
        alert('You can only delete your own lectures. Demo lectures cannot be deleted.');
      } else {
        alert('Failed to delete lecture. Please try again.');
      }
    }
  };

  // Separate lectures into user's and demos
  const myLectures = lectures.filter(l => !l.is_demo);
  const demoLectures = lectures.filter(l => l.is_demo);

  return (
    <div className="app-container">
      <Header
        user={user}
        onLogin={loginWithGoogle}
        onLogout={logout}
        scrollToSection={scrollToSection}
        uploadRef={uploadRef}
        libraryRef={libraryRef}
        lecturesCount={lectures.length}
      />

      {/* Hero Section */}
      <section ref={heroRef} className="section-hero" data-testid="hero-section">
        <div className="container">
          <div className="grid grid-2" style={{ alignItems: 'center', gap: 'var(--space-4xl)' }}>
            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              style={{ textAlign: 'left' }}
            >
              <div style={{ display: 'inline-block', padding: '8px 20px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-full)', marginBottom: 'var(--space-xl)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--edu-primary)' }}>
                  🎓 AI-Powered Learning Platform
                </p>
              </div>
              <h1 style={{ marginBottom: 'var(--space-xl)', fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 800 }}>
                Learn Smarter with Voice-Powered AI Tutoring
              </h1>
              <p className="text-secondary" style={{ fontSize: '1.125rem', lineHeight: '1.7', marginBottom: 'var(--space-2xl)' }}>
                Upload lecture videos, get instant transcripts, and interact with an AI tutor that speaks in your professor's voice. Transform your learning experience today.
              </p>
              <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                <button
                  className="glass-button-primary glass-button"
                  onClick={() => scrollToSection(uploadRef)}
                  data-testid="hero-upload-button"
                  style={{ padding: '14px 28px', fontSize: '1rem' }}
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
                  style={{ padding: '14px 28px', fontSize: '1rem' }}
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Browse Library
                  <span className="badge badge-primary">{lectures.length}</span>
                </button>
              </div>

              {/* Feature Stats */}
              <div className="flex gap-xl" style={{ marginTop: 'var(--space-3xl)', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--edu-primary)' }}>🎬</h3>
                  <p className="text-secondary" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
                    Upload Videos
                  </p>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--edu-secondary)' }}>🤖</h3>
                  <p className="text-secondary" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
                    AI Tutoring
                  </p>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--edu-accent)' }}>📝</h3>
                  <p className="text-secondary" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
                    Smart Notes
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Hero Illustration */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              <img
                src={heroIllustration}
                alt="AI Learning Illustration"
                style={{
                  width: '100%',
                  maxWidth: '500px',
                  height: 'auto',
                  filter: 'drop-shadow(0 10px 30px rgba(99, 102, 241, 0.2))'
                }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section ref={uploadRef} className="section" style={{ background: 'var(--surface)' }} data-testid="upload-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-3xl">
              <h2 className="mb-md">Upload New Lecture</h2>
              <p className="text-secondary" style={{ fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
                {isAuthenticated ? 'Upload MP4 videos or YouTube links to create an AI-powered tutor' : 'Sign in with Google to upload your own lectures and start learning'}
              </p>
            </div>
            <UploadSection
              backendUrl={BACKEND_URL}
              onUploadComplete={handleUploadComplete}
              uploading={uploading}
              setUploading={setUploading}
              uploadProgress={uploadProgress}
              setUploadProgress={setUploadProgress}
              isAuthenticated={isAuthenticated}
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
            <div className="flex justify-between items-center mb-3xl">
              <div>
                <h2 className="mb-sm">Lecture Library</h2>
                <p className="text-secondary" style={{ fontSize: '0.9375rem' }}>
                  Browse and manage your uploaded lectures
                </p>
              </div>
              <button
                className="glass-button"
                onClick={loadLectures}
                disabled={loading}
                data-testid="refresh-lectures-button"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
            ) : (
              <>
                {/* My Lectures Section */}
                {isAuthenticated && (
                  <div className="mb-3xl">
                    <div className="flex items-center gap-md mb-xl">
                      <h3 style={{ margin: 0 }}>My Lectures</h3>
                      <span className="badge badge-primary">{myLectures.length}</span>
                    </div>
                    {myLectures.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card text-center empty-state"
                        style={{ padding: 'var(--space-3xl)' }}
                      >
                        <img
                          src={emptyStateIllustration}
                          alt="No lectures yet"
                          style={{
                            width: '200px',
                            height: 'auto',
                            marginBottom: 'var(--space-xl)',
                            opacity: 0.8
                          }}
                        />
                        <h3 style={{ marginBottom: 'var(--space-sm)', fontWeight: 600 }}>No lectures yet</h3>
                        <p className="text-secondary" style={{ marginBottom: 'var(--space-xl)' }}>Upload your first lecture to get started</p>
                        <button
                          className="glass-button-primary glass-button"
                          onClick={() => scrollToSection(uploadRef)}
                        >
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                          </svg>
                          Upload Lecture
                        </button>
                      </motion.div>
                    ) : (
                      <div className="grid grid-3">
                        {myLectures.map((lecture, index) => (
                          <LectureCard
                            key={lecture.id}
                            lecture={lecture}
                            index={index}
                            onSelect={handleLectureSelect}
                            onDelete={handleDeleteLecture}
                            canDelete={true}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Demo Lectures Section */}
                {demoLectures.length > 0 && (
                  <div>
                    <div className="flex items-center gap-md mb-xl">
                      <h3 style={{ margin: 0 }}>Demo Lectures</h3>
                      <span className="badge badge-demo">{demoLectures.length}</span>
                    </div>
                    <div className="grid grid-3">
                      {demoLectures.map((lecture, index) => (
                        <LectureCard
                          key={lecture.id}
                          lecture={lecture}
                          index={index}
                          onSelect={handleLectureSelect}
                          onDelete={handleDeleteLecture}
                          canDelete={false}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* No lectures at all */}
                {!isAuthenticated && demoLectures.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card text-center empty-state"
                    style={{ padding: 'var(--space-4xl)' }}
                  >
                    <img
                      src={emptyStateIllustration}
                      alt="No lectures available"
                      style={{
                        width: '200px',
                        height: 'auto',
                        marginBottom: 'var(--space-xl)',
                        opacity: 0.8
                      }}
                    />
                    <h3 className="mb-md" style={{ fontWeight: 600 }}>No lectures available</h3>
                    <p className="text-secondary">Sign in to upload and manage your lectures</p>
                  </motion.div>
                )}
              </>
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
                <div className="text-center mb-3xl">
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-xl)' }}>
                    <img
                      src={tutorIllustration}
                      alt="AI Tutor"
                      style={{
                        width: '120px',
                        height: 'auto'
                      }}
                    />
                  </div>
                  <h2 className="mb-md">AI Tutor</h2>
                  <p className="text-secondary" style={{ fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Ask questions and get answers in your professor's voice
                  </p>
                </div>
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
      <footer style={{ background: 'var(--background-dark)', padding: 'var(--space-3xl) 0', textAlign: 'center', borderTop: '1px solid var(--surface-border)' }}>
        <div className="container">
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
              <div style={{ fontSize: '1.5rem' }}>📚</div>
              <h4 style={{ margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>EduVoice AI</h4>
            </div>
            <p className="text-secondary" style={{ fontSize: '0.875rem', margin: 0 }}>
              Transform your learning with AI-powered voice tutoring
            </p>
          </div>
          <p className="text-tertiary" style={{ fontSize: '0.8125rem', margin: 0 }}>
            © {new Date().getFullYear()} EduVoice AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Upload Section Component
function UploadSection({ backendUrl, onUploadComplete, uploading, setUploading, uploadProgress, setUploadProgress, isAuthenticated }) {
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

    if (!isAuthenticated) {
      setError('Please sign in to upload lectures');
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (!isAuthenticated) {
      setError('Please sign in to upload lectures');
      return;
    }

    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file) => {
    if (!isAuthenticated) {
      setError('Please sign in to upload lectures');
      return;
    }

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
      {/* Upload Options - Only show if authenticated */}
      {isAuthenticated && (
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
      )}

      <div
        className={`glass-card upload-dropzone ${dragActive ? 'drag-active' : ''}`}
        style={{
          border: dragActive ? '2px dashed var(--edu-primary)' : '2px dashed var(--surface-border)',
          background: dragActive ? 'rgba(99, 102, 241, 0.05)' : 'var(--surface)',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all var(--transition-base)',
          padding: 'var(--space-3xl)',
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
            <h3 className="mb-md" style={{ fontWeight: 600 }}>{uploading ? 'Uploading and processing...' : 'Processing YouTube video...'}</h3>
            <div className="progress-bar" style={{ maxWidth: '400px', margin: '0 auto' }}>
              <div
                className="progress-fill"
                style={{
                  width: uploading ? `${uploadProgress}%` : '100%',
                  animation: youtubeProcessing ? 'shimmer 1.5s ease-in-out infinite' : 'none',
                }}
              />
            </div>
            {uploading && <p className="text-secondary mt-md">{uploadProgress}%</p>}
          </div>
        ) : !isAuthenticated ? (
          <>
            <img
              src={uploadIllustration}
              alt="Upload Illustration"
              style={{
                width: '180px',
                height: 'auto',
                marginBottom: 'var(--space-lg)',
                opacity: 0.7
              }}
            />
            <h3 className="mb-sm" style={{ fontWeight: 600 }}>Sign in to upload lectures</h3>
            <p className="text-secondary" style={{ fontSize: '0.9375rem' }}>Please sign in with Google to upload your own lecture videos</p>
          </>
        ) : (
          <>
            <img
              src={uploadIllustration}
              alt="Upload Illustration"
              style={{
                width: '180px',
                height: 'auto',
                marginBottom: 'var(--space-lg)'
              }}
            />
            <h3 className="mb-sm" style={{ fontWeight: 600 }}>Drop MP4 file here or click to browse</h3>
            <p className="text-secondary" style={{ fontSize: '0.9375rem' }}>Supports MP4 format • Maximum file size: 500MB</p>
          </>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card mt-lg"
          style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
        >
          <p style={{ color: 'var(--edu-error)', textAlign: 'center', margin: 0, fontSize: '0.9375rem' }}>{error}</p>
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

      {/* Summary Section */}
      <div style={{ borderTop: '1px solid var(--glass-light-border)', paddingTop: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
        <div className="flex justify-between items-center mb-lg">
          <h3>Lecture Summary</h3>
          {!summary && (
            <button
              className="glass-button-primary glass-button"
              onClick={handleGenerateSummary}
              disabled={summaryLoading}
              data-testid="generate-summary-button"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {summaryLoading ? 'Generating...' : 'Generate Summary'}
            </button>
          )}
        </div>

        {summaryLoading && (
          <div className="flex items-center gap-md mb-lg">
            <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
            <p className="text-secondary">Generating summary with AI... This may take up to a minute.</p>
          </div>
        )}

        {summaryError && (
          <div className="glass-card mb-lg" style={{ background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.3)' }}>
            <p style={{ color: 'var(--accent-error)', margin: 0 }}>{summaryError}</p>
          </div>
        )}

        {summary && (
          <div className="glass-card" style={{ background: 'var(--background-secondary)' }}>
            <p style={{ lineHeight: '1.8', marginBottom: 'var(--space-lg)' }}>
              {summary.summary}
            </p>

            <div style={{ borderTop: '1px solid var(--glass-light-border)', paddingTop: 'var(--space-lg)' }}>
              <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <p className="text-secondary text-sm">
                  {summary.word_count} words • {summary.cached ? 'Cached' : 'Freshly generated'}
                </p>

                <audio
                  controls
                  src={`${backendUrl}${summary.audio_url}`}
                  style={{ maxWidth: '100%', height: '40px' }}
                  data-testid="summary-audio-player"
                >
                  <source src={`${backendUrl}${summary.audio_url}`} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>

              <div className="flex items-center gap-sm mt-md">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--accent-primary)' }}>
                  <path d="M11.983 1.907a.75.75 0 00-1.388-.341l-3.868 8.873-4.494.65a.75.75 0 00-.415 1.279l3.25 3.169-.768 4.478a.75.75 0 001.088.79L12 17.347l4.612 2.458a.75.75 0 001.088-.79l-.768-4.478 3.25-3.169a.75.75 0 00-.415-1.279l-4.494-.65-3.868-8.873a.75.75 0 00-.422-.35z" />
                </svg>
                <p className="text-sm" style={{ color: 'var(--accent-primary)' }}>
                  Listen to the summary in the professor's voice
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--glass-light-border)', paddingTop: 'var(--space-xl)' }}>
        <h3 className="mb-lg">Full Transcript</h3>
        <div style={{ lineHeight: '1.8', color: 'var(--text-primary)' }} data-testid="transcript-viewer">
          {lecture.transcript.split('\n').map((paragraph, index) => (
            paragraph && <p key={index} className="mb-md">{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// Lecture Card Component
function LectureCard({ lecture, index, onSelect, onDelete, canDelete }) {
  return (
    <motion.div
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
          {lecture.is_demo && (
            <span className="badge badge-demo mt-sm">Demo</span>
          )}
        </div>
        {canDelete && (
          <button
            className="glass-button-danger"
            style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
            onClick={() => onDelete(lecture.id)}
            data-testid={`delete-lecture-${lecture.id}`}
            title="Delete lecture"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      <button
        className="glass-button-primary glass-button"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => onSelect(lecture)}
        data-testid={`open-lecture-${lecture.id}`}
      >
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
        Open AI Tutor
      </button>
    </motion.div>
  );
}

// Main App component with AuthProvider wrapper
function App() {
  return (
    <AuthProvider backendUrl={BACKEND_URL}>
      <AppContent />
    </AuthProvider>
  );
}

export default App;