#!/bin/bash
# System Setup Script for EduVoice AI Platform
# This script installs all required system-level dependencies

set -e  # Exit on error

echo "=================================================="
echo "EduVoice AI - System Dependencies Installation"
echo "=================================================="

# Update package lists
echo ""
echo "📦 Updating package lists..."
sudo apt-get update

# Install ffmpeg (required for audio/video processing)
echo ""
echo "🎬 Installing ffmpeg..."
sudo apt-get install -y ffmpeg

# Verify installation
echo ""
echo "✅ Verifying installations..."
echo "   ffmpeg version: $(ffmpeg -version 2>&1 | head -1)"

echo ""
echo "=================================================="
echo "✅ System dependencies installed successfully!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Install Python dependencies: cd backend && pip install -r requirements.txt"
echo "2. Install Node dependencies: cd frontend && yarn install"
echo "3. Configure environment variables in .env files"
echo "4. Start services with supervisor"
