#!/bin/bash

# TalentSphere Backend Optimized Startup Script

echo "🚀 Starting TalentSphere Backend (Optimized)"

# Activate virtual environment if not already active (skip on hosting platforms)
if [[ "$VIRTUAL_ENV" == "" ]] && [[ -z "$RENDER" ]] && [[ -z "$PORT" ]] && [[ ! -f "/app/.heroku" ]]; then
    echo "📦 Activating virtual environment..."
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
        echo "✅ Virtual environment activated"
    else
        echo "❌ Virtual environment not found at venv/bin/activate"
        echo "💡 Please run ./build.sh first to create the virtual environment"
        exit 1
    fi
else
    if [[ -n "$RENDER" ]] || [[ -n "$PORT" ]]; then
        echo "✅ Running on hosting platform - using system Python environment"
    else
        echo "✅ Virtual environment already active: $VIRTUAL_ENV"
    fi
fi

# Set performance environment variables
export PYTHONUNBUFFERED=1
export PYTHONOPTIMIZE=1

# Start with optimized Gunicorn configuration
if [ -f "gunicorn.conf.py" ]; then
    echo "📈 Using optimized Gunicorn configuration"
    gunicorn --config gunicorn.conf.py src.main:app
else
    echo "⚠️  Gunicorn config not found, using default settings"
    gunicorn --bind 0.0.0.0:${PORT:-5001} --workers 4 --timeout 30 --access-logfile - --error-logfile - src.main:app
fi
