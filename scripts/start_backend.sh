#!/bin/bash
# Backend startup wrapper - ensures ffmpeg is installed before starting

# Auto-install ffmpeg if missing (non-interactive)
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  ffmpeg not found - installing automatically..."
    sudo apt-get update -qq > /dev/null 2>&1
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ffmpeg > /dev/null 2>&1
    
    if command -v ffmpeg &> /dev/null; then
        echo "✅ ffmpeg auto-installed successfully"
    else
        echo "❌ Failed to auto-install ffmpeg - manual installation required"
    fi
fi

echo "🚀 Starting EduVoice Backend..."

# Start the backend
cd /app/backend
exec /root/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 1 --reload
