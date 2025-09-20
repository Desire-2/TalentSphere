#!/bin/bash

# TalentSphere Backend - Ultra-Optimized Startup Script
# Includes pre-flight checks, optimization, and monitoring

set -e  # Exit on any error

echo "🚀 Starting TalentSphere Backend (Ultra-Optimized)"
echo "================================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Creating one..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Configuration
export FLASK_ENV=${FLASK_ENV:-production}
export PORT=${PORT:-5001}
export WORKERS=${GUNICORN_WORKERS:-$(nproc --all)}
export PYTHONUNBUFFERED=1
export PYTHONDONTWRITEBYTECODE=1
export MALLOC_ARENA_MAX=2

# Performance monitoring flags
export SLOW_QUERY_THRESHOLD=${SLOW_QUERY_THRESHOLD:-0.5}
export SLOW_REQUEST_THRESHOLD=${SLOW_REQUEST_THRESHOLD:-1.0}

echo "📋 Configuration:"
echo "   - Environment: $FLASK_ENV"
echo "   - Port: $PORT"
echo "   - Workers: $WORKERS"
echo "   - Slow Query Threshold: ${SLOW_QUERY_THRESHOLD}s"
echo "   - Slow Request Threshold: ${SLOW_REQUEST_THRESHOLD}s"

# Pre-flight checks
echo ""
echo "🔍 Running Pre-flight Checks..."

# Check Python version
python_version=$(python --version 2>&1)
echo "✅ Python Version: $python_version"

# Check if required packages are installed
echo "🔍 Checking required packages..."
if ! python -c "import flask, sqlalchemy, redis, psutil" 2>/dev/null; then
    echo "❌ Missing required packages. Installing..."
    pip install -r requirements.txt
    pip install psutil setproctitle
else
    echo "✅ All required packages are installed"
fi

# Check database connectivity
echo "🔍 Testing database connection..."
if python -c "
import sys
sys.path.insert(0, '.')
try:
    from src.main import app
    from src.models.user import db
    with app.app_context():
        db.session.execute(db.text('SELECT 1'))
        print('✅ Database connection successful')
except Exception as e:
    print(f'⚠️  Database connection failed: {e}')
    print('   Database will be initialized on first request')
" 2>/dev/null; then
    echo "✅ Database connectivity verified"
else
    echo "⚠️  Database connectivity check failed - will retry during startup"
fi

# Check Redis connectivity (optional)
echo "🔍 Testing Redis connection..."
if [ -n "$REDIS_URL" ]; then
    if python -c "
import redis
import os
try:
    r = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379/0'))
    r.ping()
    print('✅ Redis connection successful')
except Exception as e:
    print(f'⚠️  Redis connection failed: {e}')
    print('   Caching will be disabled')
" 2>/dev/null; then
        echo "✅ Redis connectivity verified"
    else
        echo "⚠️  Redis not available - caching disabled"
    fi
else
    echo "ℹ️  Redis URL not configured - caching disabled"
fi

# System resource check
echo "🔍 Checking system resources..."
if command -v free >/dev/null 2>&1; then
    memory_info=$(free -h | grep "Mem:")
    echo "💾 Memory: $memory_info"
fi

if command -v nproc >/dev/null 2>&1; then
    cpu_cores=$(nproc --all)
    echo "🖥️  CPU Cores: $cpu_cores"
fi

# Database optimization
echo ""
echo "⚡ Running Database Optimizations..."
if python optimize_database.py; then
    echo "✅ Database optimization completed"
else
    echo "⚠️  Database optimization failed - continuing anyway"
fi

# Create necessary directories
echo "📁 Creating required directories..."
mkdir -p src/database logs tmp/cache
chmod 755 src/database logs tmp/cache

# Set optimal file descriptor limits
echo "🔧 Setting system optimizations..."
if [ -f /proc/sys/fs/file-max ]; then
    echo "📊 Max file descriptors: $(cat /proc/sys/fs/file-max)"
fi

# Start the application
echo ""
echo "🚀 Starting TalentSphere Backend Server..."
echo "   Access URL: http://localhost:$PORT"
echo "   Health Check: http://localhost:$PORT/health"
echo "   Performance Monitor: http://localhost:$PORT/api/performance"

# Use different startup methods based on environment
if [ "$FLASK_ENV" = "development" ]; then
    echo "🛠️  Starting in Development Mode"
    python -m src.main --port $PORT
elif [ "$FLASK_ENV" = "testing" ]; then
    echo "🧪 Starting in Testing Mode"
    python -m src.main --port $PORT --no-init-db
else
    echo "🏭 Starting in Production Mode with Gunicorn"
    
    # Check if optimized config exists
    if [ -f "gunicorn.optimized.conf.py" ]; then
        echo "📄 Using optimized Gunicorn configuration"
        gunicorn_config="gunicorn.optimized.conf.py"
    else
        echo "📄 Using standard Gunicorn configuration"
        gunicorn_config="gunicorn.conf.py"
    fi
    
    # Start with optimized Gunicorn
    exec gunicorn \
        --config "$gunicorn_config" \
        --bind "0.0.0.0:$PORT" \
        --workers "$WORKERS" \
        --worker-class sync \
        --worker-connections 1500 \
        --max-requests 2000 \
        --max-requests-jitter 200 \
        --timeout 45 \
        --keep-alive 5 \
        --preload \
        --enable-stdio-inheritance \
        --log-level info \
        --access-logfile - \
        --error-logfile - \
        "src.main:app"
fi