#!/bin/bash

# Production build script for TalentSphere frontend

set -e  # Exit on any error

echo "🏗️  Building TalentSphere Frontend for Production..."

# Navigate to frontend directory
cd "$(dirname "$0")"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  Warning: .env.production file not found"
    echo "📝 Creating default .env.production file"
    cp .env.example .env.production
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build for production
echo "🔨 Building application..."
NODE_ENV=production npm run build

# Check if build was successful
if [ -d "dist" ]; then
    echo "✅ Build successful! Built files are in 'dist' directory"
    echo "📊 Build statistics:"
    du -sh dist
    echo ""
    echo "📁 Build contents:"
    ls -la dist/
else
    echo "❌ Build failed!"
    exit 1
fi

echo "🚀 Production build completed successfully!"
