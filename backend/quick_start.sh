#!/usr/bin/env bash
# quick_start.sh - Quick start without optimization

set -o errexit
echo "🚀 Quick Starting TalentSphere Backend..."

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    echo "✅ Virtual environment activated"
else
    echo "❌ Virtual environment not found"
    exit 1
fi

# Load environment
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

# Set port
export PORT=${PORT:-5001}
echo "🚪 Starting on port $PORT"

# Start with gunicorn directly
echo "🌐 Starting server..."
exec gunicorn --bind 0.0.0.0:$PORT \
    --workers 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    wsgi:app
