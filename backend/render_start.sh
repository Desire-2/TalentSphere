#!/usr/bin/env bash
# render_start.sh - Start script specifically for Render deployment

set -o errexit  # exit on error

echo "🚀 Starting TalentSphere Backend on Render..."
echo "=============================================="

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "📄 Loading environment variables from .env..."
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

# Set default environment variables for production
export FLASK_ENV=${FLASK_ENV:-production}
export PYTHONUNBUFFERED=1
export PYTHONOPTIMIZE=1

# Validate required environment variables
echo "🔍 Validating environment variables..."
if [[ -z "$SECRET_KEY" ]]; then
    echo "❌ SECRET_KEY is required"
    exit 1
fi

if [[ -z "$DATABASE_URL" ]]; then
    echo "❌ DATABASE_URL is required"
    exit 1
fi

echo "✅ Environment variables validated"

# Display system information
echo ""
echo "🖥️  System Information:"
echo "  🐍 Python version: $(python --version)"
echo "  📁 Current directory: $(pwd)"
echo "  🌐 Environment: ${FLASK_ENV}"
echo "  🚪 Port: ${PORT:-10000}"

# Initialize database if needed
echo ""
echo "🗄️  Initializing database..."
python -c "
import sys
import os
sys.path.insert(0, '.')
from src.main import app
with app.app_context():
    from src.models.user import db
    db.create_all()
    print('✅ Database initialized')
" || echo "⚠️  Database initialization failed - this might be normal"

echo ""
echo "🚀 Starting gunicorn server..."

# Start with gunicorn
exec gunicorn \
    --bind 0.0.0.0:${PORT:-10000} \
    --workers ${WEB_CONCURRENCY:-2} \
    --timeout 120 \
    --keepalive 2 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --preload \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    wsgi:app