#!/bin/bash
# First-time initialization script
# Run this once when deploying to a new environment

set -e

echo "=================================================="
echo "🚀 EduVoice AI - First Time Setup"
echo "=================================================="

# Create data directories
echo ""
echo "📁 Creating data directories..."
mkdir -p /app/data/lectures
mkdir -p /app/data/uploads
mkdir -p /app/data/users
echo "   ✓ Data directories created"

# Install system dependencies
echo ""
echo "🔧 Installing system dependencies..."

# Check and install ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "   Installing ffmpeg..."
    sudo apt-get update -qq
    sudo apt-get install -y ffmpeg
    echo "   ✓ ffmpeg installed"
else
    echo "   ✓ ffmpeg already installed"
fi

# Verify ffmpeg
FFMPEG_VERSION=$(ffmpeg -version 2>&1 | head -1)
echo "   ✓ $FFMPEG_VERSION"

# Install Python dependencies
echo ""
echo "🐍 Installing Python dependencies..."
cd /app/backend
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt > /dev/null 2>&1
    echo "   ✓ Python packages installed"
else
    echo "   ⚠️  requirements.txt not found"
fi

# Install Node dependencies
echo ""
echo "📦 Installing Node dependencies..."
cd /app/frontend
if [ -f "package.json" ]; then
    yarn install > /dev/null 2>&1
    echo "   ✓ Node packages installed"
else
    echo "   ⚠️  package.json not found"
fi

# Check environment variables
echo ""
echo "🔐 Checking environment variables..."
cd /app/backend
if [ -f ".env" ]; then
    echo "   ✓ Backend .env found"
    
    # Check for required keys
    if grep -q "OPENAI_API_KEY=" .env; then
        echo "   ✓ OPENAI_API_KEY configured"
    else
        echo "   ⚠️  OPENAI_API_KEY missing in .env"
    fi
    
    if grep -q "CARTESIA_API_KEY=" .env; then
        echo "   ✓ CARTESIA_API_KEY configured"
    else
        echo "   ⚠️  CARTESIA_API_KEY missing in .env"
    fi
    
    if grep -q "GOOGLE_CLIENT_ID=" .env; then
        echo "   ✓ GOOGLE_CLIENT_ID configured"
    else
        echo "   ⚠️  GOOGLE_CLIENT_ID missing in .env"
    fi
else
    echo "   ⚠️  Backend .env not found"
fi

cd /app/frontend
if [ -f ".env" ]; then
    echo "   ✓ Frontend .env found"
else
    echo "   ⚠️  Frontend .env not found"
fi

# Create a marker file to indicate setup is complete
touch /app/.setup_complete

echo ""
echo "=================================================="
echo "✅ Setup Complete!"
echo "=================================================="
echo ""
echo "You can now start the services:"
echo "  sudo supervisorctl restart all"
echo ""
echo "To run this setup again, delete /app/.setup_complete"
