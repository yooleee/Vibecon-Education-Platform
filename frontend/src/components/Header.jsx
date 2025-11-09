import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import axios from 'axios';

function Header({ user, onLogin, onLogout, scrollToSection, uploadRef, libraryRef, quizHistoryRef, lecturesCount }) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Get user info from Google using the access token
        const userInfoResponse = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
          }
        );

        // Get ID token by calling tokeninfo endpoint
        const tokenInfoResponse = await axios.get(
          `https://oauth2.googleapis.com/tokeninfo?access_token=${tokenResponse.access_token}`
        );

        // For backend, we need to send the access token
        // Backend will verify it with Google
        const result = await onLogin(tokenResponse.access_token);
        
        if (!result.success) {
          alert(result.error || 'Login failed. Please try again.');
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
      alert('Google login failed');
    },
  });

  return (
    <header className="glass-header" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(10px)',
      background: 'rgba(255, 255, 255, 0.8)',
      borderBottom: '1px solid var(--glass-light-border)',
      padding: 'var(--space-lg) 0'
    }}>
      <div className="container">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-md">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 style={{ margin: 0, fontWeight: 600 }}>EduVoice AI</h3>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-md">
            <button
              className="glass-button"
              onClick={() => scrollToSection(uploadRef)}
              data-testid="nav-upload-button"
            >
              Upload
            </button>
            <button
              className="glass-button"
              onClick={() => scrollToSection(libraryRef)}
              data-testid="nav-library-button"
            >
              Library ({lecturesCount})
            </button>

            {/* Auth Section */}
            {user ? (
              <div style={{ position: 'relative' }}>
                <button
                  className="flex items-center gap-sm glass-button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  data-testid="user-menu-button"
                >
                  <img 
                    src={user.picture} 
                    alt={user.name}
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                  <span>{user.name.split(' ')[0]}</span>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div 
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 10
                      }}
                      onClick={() => setShowUserMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: 'var(--space-sm)',
                        minWidth: '200px',
                        zIndex: 20
                      }}
                      data-testid="user-dropdown-menu"
                    >
                      <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--glass-light-border)' }}>
                        <p style={{ fontWeight: 600, margin: 0 }}>{user.name}</p>
                        <p className="text-secondary text-sm" style={{ margin: '4px 0 0 0' }}>{user.email}</p>
                      </div>
                      <button
                        className="glass-button"
                        style={{ 
                          width: '100%', 
                          justifyContent: 'flex-start',
                          borderRadius: 0,
                          borderBottom: 'none'
                        }}
                        onClick={() => {
                          onLogout();
                          setShowUserMenu(false);
                        }}
                        data-testid="logout-button"
                      >
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </div>
            ) : (
              <button
                className="glass-button-primary glass-button"
                onClick={() => googleLogin()}
                data-testid="google-signin-button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
