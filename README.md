# EduVoice AI - Education Platform

AI-powered learning platform with voice cloning, lecture transcription, and interactive tutoring.

## 🎯 Features

- **Lecture Upload**: MP4 video and YouTube video support
- **Voice Cloning**: Clone professor's voice using Cartesia AI
- **Transcription**: Automatic speech-to-text with OpenAI Whisper
- **AI Tutoring**: Ask questions and get answers in professor's voice
- **Lecture Summaries**: AI-generated summaries with audio
- **Conversation Memory**: LangGraph-based memory (V1/V2 toggle)
- **Google Authentication**: Secure sign-in with Google OAuth

## 📋 System Requirements

### ⚠️ CRITICAL: System Dependencies

**These are system-level binaries that MUST be installed separately:**

1. **ffmpeg** - Required for audio/video processing
   ```bash
   sudo apt-get update
   sudo apt-get install -y ffmpeg
   ```

2. **Python 3.11+**
3. **Node.js 20+** and **Yarn**
4. **MongoDB** (optional - currently using JSON storage)

### Quick Setup Script

Run the automated setup script:
```bash
chmod +x /app/scripts/setup_system.sh
./app/scripts/setup_system.sh
```

## 🚀 Installation

### 1. Install System Dependencies (REQUIRED)

```bash
# Install ffmpeg (REQUIRED - NOT in requirements.txt)
sudo apt-get update && sudo apt-get install -y ffmpeg

# Verify installation
ffmpeg -version
```

### 2. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies

```bash
cd frontend
yarn install
```

### 4. Configure Environment Variables

**Backend** (`/app/backend/.env`):
```env
# OpenAI API Key (REQUIRED)
OPENAI_API_KEY=sk-proj-your-key-here

# Cartesia API Key (REQUIRED for voice cloning)
CARTESIA_API_KEY=your-cartesia-key-here

# Google OAuth (REQUIRED for authentication)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here

# JWT Secret (Auto-generated or custom)
JWT_SECRET_KEY=your-secret-key-here
```

**Frontend** (`/app/frontend/.env`):
```env
# Backend URL (Production configured - DO NOT MODIFY)
REACT_APP_BACKEND_URL=https://smart-quiz-ai-2.preview.emergentagent.com

# Google OAuth Client ID
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### 5. Run the Application

```bash
# Start all services
sudo supervisorctl restart all

# Check status
sudo supervisorctl status
```

## ⚠️ Common Issues

### 1. ffmpeg Not Found ⚠️ MOST COMMON
**Error**: `Audio extraction failed: [Errno 2] No such file or directory: 'ffmpeg'`

**Why**: ffmpeg is a system binary, NOT in requirements.txt

**Solution**:
```bash
sudo apt-get update && sudo apt-get install -y ffmpeg
sudo supervisorctl restart backend
```

### 2. Google OAuth redirect_uri_mismatch
**Cause**: Redirect URI not configured in Google Cloud Console

**Solution**: Add your domain to "Authorized redirect URIs" in Google Cloud Console

### 3. White Screen on Frontend
**Cause**: Vite environment variable issues

**Solution**: Variables must use `process.env.REACT_APP_*` format

## 🔧 Technology Stack

- **Backend**: FastAPI, Python 3.11
- **Frontend**: React 18, Vite
- **Database**: JSON file storage
- **AI**: OpenAI (GPT-4o, Whisper, Embeddings), Cartesia (Voice)
- **Auth**: Google OAuth 2.0, JWT

## 📁 Data Storage

- **Lectures**: `/app/data/lectures/` (JSON files)
- **Users**: `/app/data/users/` (JSON files)
- **Media**: `/app/data/uploads/` (audio, video, voice clips)

## 🔒 Security

- API keys in `.env` files only (never hardcoded)
- JWT tokens for sessions (7-day expiry)
- User data isolation
- Demo lectures read-only

## 📝 License

See LICENSE file.
