#!/bin/bash

# Restart backend with cleanup service fix
echo "🔄 Restarting backend with cleanup service fix..."
echo ""

cd backend

# Kill existing processes
echo "Stopping existing backend..."
pkill -f gunicorn
pkill -f "python src/main.py"
fuser -k 5001/tcp 2>/dev/null
sleep 2

echo "✅ Stopped"
echo ""

# Start backend with gunicorn
echo "Starting backend with gunicorn..."
gunicorn --workers 4 \
         --timeout 120 \
         --bind 0.0.0.0:5001 \
         --worker-class sync \
         --config gunicorn.conf.py \
         --access-logfile - \
         --error-logfile - \
         --log-level info \
         --capture-output \
         src.main:app &

echo ""
echo "✅ Backend started!"
echo ""
echo "Wait a few seconds, then refresh your cleanup page."
echo "The service status should now show 'Running'"
echo ""
