# Deployment Guide - EduVoice AI

## ⚠️ CRITICAL: System Dependencies

### ffmpeg Installation (MANDATORY)

**ffmpeg is NOT included in the repository and MUST be installed on every deployment.**

#### Why ffmpeg Isn't in Git:
- It's a system-level binary (like Python or Node.js)
- Installed via OS package manager, not pip/yarn
- NOT in `requirements.txt` or `package.json`
- Must be installed separately on each environment

#### Installation:

**On Debian/Ubuntu:**
```bash
sudo apt-get update
sudo apt-get install -y ffmpeg
```

**On macOS:**
```bash
brew install ffmpeg
```

**On Docker:**
Add to your Dockerfile:
```dockerfile
RUN apt-get update && apt-get install -y ffmpeg
```

**Verification:**
```bash
ffmpeg -version
# Should show: ffmpeg version 5.x.x or higher
```

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Install ffmpeg on target system
- [ ] Install Python 3.11+
- [ ] Install Node.js 20+ and Yarn
- [ ] Install MongoDB (if using database instead of JSON)

### Environment Setup

- [ ] Create `/app/backend/.env` with all required keys:
  - OPENAI_API_KEY
  - CARTESIA_API_KEY
  - GOOGLE_CLIENT_ID
  - GOOGLE_CLIENT_SECRET
  - JWT_SECRET_KEY

- [ ] Create `/app/frontend/.env` with:
  - REACT_APP_BACKEND_URL (your production URL)
  - REACT_APP_GOOGLE_CLIENT_ID

### Google OAuth Setup

- [ ] Create Google Cloud Project
- [ ] Enable Google+ API
- [ ] Create OAuth 2.0 credentials
- [ ] Add authorized redirect URIs:
  - Your production domain
  - http://localhost:3000 (for local development)

### Installation

```bash
# 1. Install system dependencies
sudo apt-get update
sudo apt-get install -y ffmpeg

# 2. Install Python packages
cd /app/backend
pip install -r requirements.txt

# 3. Install Node packages
cd /app/frontend
yarn install

# 4. Create data directories
mkdir -p /app/data/lectures
mkdir -p /app/data/uploads
mkdir -p /app/data/users

# 5. Start services
sudo supervisorctl restart all
```

### Verification

```bash
# Check all services running
sudo supervisorctl status

# Test ffmpeg
ffmpeg -version

# Test backend
curl http://localhost:8001/api/health

# Test frontend
curl http://localhost:3000

# Check logs
tail -f /var/log/supervisor/backend.*.log
tail -f /var/log/supervisor/frontend.*.log
```

---

## 🔄 Common Deployment Issues

### Issue 1: "ffmpeg not found"

**Symptom**: Audio extraction fails with "No such file or directory: 'ffmpeg'"

**Cause**: ffmpeg not installed on the system

**Fix**:
```bash
sudo apt-get install -y ffmpeg
sudo supervisorctl restart backend
```

### Issue 2: "Google OAuth redirect_uri_mismatch"

**Symptom**: Can't sign in with Google

**Fix**: Add your domain to Google Cloud Console → OAuth 2.0 Client → Authorized redirect URIs

### Issue 3: White screen on frontend

**Symptom**: Page loads then goes blank

**Fix**: Check environment variables are properly set in `/app/frontend/.env`

---

## 📦 What's In Git vs What Needs Installation

### ✅ In Git (No installation needed):
- Python code (.py files)
- JavaScript/React code (.jsx files)
- Configuration files
- requirements.txt (Python packages list)
- package.json (Node packages list)

### ❌ NOT In Git (Must install separately):
- **ffmpeg** ← Install via apt-get
- Python packages ← Install via pip
- Node packages ← Install via yarn
- Environment variables (.env files)
- User data/uploads

---

## 🐳 Docker Deployment

If deploying with Docker, your Dockerfile should include:

```dockerfile
FROM python:3.11

# CRITICAL: Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs yarn

# Copy application
COPY . /app
WORKDIR /app

# Install dependencies
RUN cd backend && pip install -r requirements.txt
RUN cd frontend && yarn install

# ... rest of Dockerfile
```

---

## 📝 Post-Deployment

1. Upload a test lecture to verify:
   - File upload works
   - Audio extraction works (ffmpeg)
   - Transcription works (OpenAI)
   - Voice cloning works (Cartesia)

2. Test Google authentication:
   - Sign in works
   - Lectures are isolated by user
   - Can upload after signing in

3. Monitor logs for errors

---

## 🔧 Maintenance

### Updating API Keys

Edit `/app/backend/.env` and restart backend:
```bash
nano /app/backend/.env
sudo supervisorctl restart backend
```

### Checking Storage Usage

```bash
# Check lecture data size
du -sh /app/data/lectures/

# Check upload files size
du -sh /app/data/uploads/

# List all lectures
ls -lh /app/data/lectures/
```

### Backup

```bash
# Backup all data
tar -czf eduvoice-backup-$(date +%Y%m%d).tar.gz /app/data/

# Backup specific components
tar -czf lectures-backup.tar.gz /app/data/lectures/
tar -czf users-backup.tar.gz /app/data/users/
```

---

## 🚨 IMPORTANT REMINDER

**Every time you deploy to a new server/container:**
1. ✅ Install ffmpeg (system binary)
2. ✅ Install Python packages (requirements.txt)
3. ✅ Install Node packages (package.json)
4. ✅ Configure environment variables (.env)
5. ✅ Set up Google OAuth redirect URIs

**ffmpeg is NOT automatic - you must install it manually on each new environment!**
