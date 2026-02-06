#!/bin/bash

# Quick fix for cleanup service worker timeouts
# This script creates database indexes and restarts the backend

echo "🔧 Cleanup Service Performance Fix"
echo "=================================="
echo ""
echo "Step 1: Creating database indexes..."
python create_cleanup_indexes.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Indexes created successfully!"
    echo ""
    echo "Step 2: Restarting backend with optimized settings..."
    echo ""
    
    # Kill existing gunicorn processes
    pkill -f gunicorn
    sleep 2
    
    # Start with increased timeout
    echo "Starting gunicorn with 120s timeout..."
    gunicorn --workers 4 \
             --timeout 120 \
             --bind 0.0.0.0:5001 \
             --worker-class sync \
             --max-requests 1000 \
             --max-requests-jitter 100 \
             --access-logfile - \
             --error-logfile - \
             --log-level info \
             src.main:app
else
    echo ""
    echo "❌ Failed to create indexes"
    echo "You can try running: python create_cleanup_indexes.py"
    exit 1
fi
