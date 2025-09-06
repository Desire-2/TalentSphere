#!/usr/bin/env bash
# build.sh - Optimized build script with performance setup

set -o errexit  # exit on error

echo "🏗️  Building TalentSphere Backend (Optimized)..."
echo "================================================"

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate
echo "✅ Virtual environment activated: $VIRTUAL_ENV"

# Upgrade pip in virtual environment
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Run database optimization
echo "⚡ Running database optimization..."
python optimize_database.py || echo "⚠️  Database optimization will run on startup"

# Create optimized configuration files if they don't exist
if [ ! -f "gunicorn.conf.py" ]; then
    echo "🔧 Creating optimized Gunicorn configuration..."
    ./optimize_backend.sh
fi

# Set executable permissions on scripts
echo "🔧 Setting script permissions..."
chmod +x start.sh start_optimized.sh optimize_backend.sh monitor_performance.py

echo "✅ Build completed successfully with optimizations!"
echo ""
echo "🚀 Next steps:"
echo "  - For development: ./start.sh"
echo "  - For production: ./start_optimized.sh"
echo "  - For monitoring: python monitor_performance.py"
echo "  - For Docker: docker-compose up"
