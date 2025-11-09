#!/bin/bash
# Backend startup wrapper - ensures ffmpeg is installed before starting

echo "🚀 Starting EduVoice Backend..."

# Check and install ffmpeg if needed
/app/scripts/check_dependencies.sh

# Exit if dependency check failed
if [ $? -ne 0 ]; then
    echo "❌ Dependency check failed - cannot start backend"
    exit 1
fi

# Start the backend
cd /app/backend
exec /root/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 1 --reload
