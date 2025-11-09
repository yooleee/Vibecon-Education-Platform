#!/bin/bash
# Auto-install system dependencies if missing
# This script runs before backend starts

echo "🔍 Checking system dependencies..."

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  ffmpeg not found - installing..."
    sudo apt-get update -qq
    sudo apt-get install -y ffmpeg > /dev/null 2>&1
    
    if command -v ffmpeg &> /dev/null; then
        echo "✅ ffmpeg installed successfully: $(ffmpeg -version 2>&1 | head -1)"
    else
        echo "❌ Failed to install ffmpeg"
        exit 1
    fi
else
    echo "✅ ffmpeg already installed: $(ffmpeg -version 2>&1 | head -1)"
fi

echo "✅ All system dependencies ready!"
