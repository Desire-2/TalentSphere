#!/usr/bin/env bash
# render_build.sh - Build script specifically for Render deployment

set -o errexit  # exit on error

echo "🏗️  Building TalentSphere Backend for Render..."
echo "================================================"

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Set executable permissions on scripts
echo "🔧 Setting script permissions..."
chmod +x *.sh

echo "✅ Render build completed successfully!"
echo ""
echo "🚀 Starting application with gunicorn..."