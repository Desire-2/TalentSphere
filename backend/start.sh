#!/usr/bin/env bash
# start.sh - Alternative startup script for debugging

set -o errexit  # exit on error

echo "Starting TalentSphere Backend..."
echo "Python version: $(python --version)"
echo "Current directory: $(pwd)"
echo "Environment: $FLASK_ENV"
echo "Port: ${PORT:-5000}"

# Check if database URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "WARNING: DATABASE_URL is not set"
else
    echo "Database URL is configured"
fi

# Start with gunicorn
exec gunicorn --bind 0.0.0.0:${PORT:-5000} --timeout 120 --workers 2 --access-logfile - --error-logfile - wsgi:app
