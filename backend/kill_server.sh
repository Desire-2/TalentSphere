#!/bin/bash
# kill_server.sh - Kill any running Flask/Gunicorn processes

echo "🔍 Finding and killing server processes..."

# Kill processes using common Flask ports
for port in 5000 5001 5002 5003; do
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$PID" ]; then
        echo "🔪 Killing process $PID using port $port"
        kill -9 $PID 2>/dev/null
    fi
done

# Kill any remaining gunicorn/flask processes
pkill -f "gunicorn\|python.*wsgi\|python.*main" 2>/dev/null && echo "🔪 Killed remaining Flask processes"

echo "✅ Server cleanup complete!"
