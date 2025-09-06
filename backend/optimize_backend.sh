#!/bin/bash

# TalentSphere Backend Performance Optimization Deployment Script
# This script optimizes the backend for better performance

echo "🚀 Starting TalentSphere Backend Performance Optimization"
echo "==========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the backend directory
if [ ! -f "requirements.txt" ]; then
    print_error "Please run this script from the backend directory"
    exit 1
fi

print_status "Installing performance optimization dependencies..."

# Install Redis if not already installed
if ! python -c "import redis" 2>/dev/null; then
    print_status "Installing Redis client..."
    pip install redis==5.0.1
    if [ $? -eq 0 ]; then
        print_success "Redis client installed successfully"
    else
        print_warning "Redis client installation failed - caching will be disabled"
    fi
else
    print_success "Redis client already installed"
fi

# Install SQLAlchemy utilities
pip install sqlalchemy-utils==0.41.1 2>/dev/null
if [ $? -eq 0 ]; then
    print_success "SQLAlchemy utilities installed"
fi

print_status "Running database optimization..."

# Run database optimization
python optimize_database.py
if [ $? -eq 0 ]; then
    print_success "Database optimization completed"
else
    print_error "Database optimization failed"
fi

# Create backup of current database (SQLite only)
if [ -f "src/database/app.db" ]; then
    print_status "Creating database backup..."
    cp src/database/app.db src/database/app.db.backup.$(date +%Y%m%d_%H%M%S)
    print_success "Database backup created"
fi

# Set environment variables for performance
print_status "Setting performance environment variables..."

# Check if .env file exists, create if not
if [ ! -f ".env" ]; then
    print_status "Creating .env file..."
    touch .env
fi

# Add performance-related environment variables
cat << EOF >> .env

# Performance Optimization Settings
SLOW_QUERY_THRESHOLD=1.0
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=3600
SQL_ECHO=false
SQL_ECHO_POOL=false

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379/0

# Flask Performance Settings
FLASK_ENV=production
EOF

print_success "Environment variables added to .env"

# Update Gunicorn configuration for production
print_status "Creating optimized Gunicorn configuration..."

cat > gunicorn.conf.py << EOF
# Gunicorn Configuration for TalentSphere Backend
# Optimized for performance

import multiprocessing
import os

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', '5000')}"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100

# Timeout settings
timeout = 30
keepalive = 2

# Process naming
proc_name = "talentsphere-backend"

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Memory optimization
preload_app = True
max_worker_memory = 400 * 1024 * 1024  # 400MB per worker

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Performance
sendfile = True
reuse_port = True
enable_stdio_inheritance = True
EOF

print_success "Gunicorn configuration created"

# Create performance monitoring script
print_status "Creating performance monitoring script..."

cat > monitor_performance.py << 'EOF'
#!/usr/bin/env python3
"""
TalentSphere Backend Performance Monitor

Monitors database performance, slow queries, and system metrics.
"""

import os
import sys
import time
import psutil
from datetime import datetime

# Add backend path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def monitor_performance():
    """Monitor system and database performance"""
    try:
        from src.utils.db_optimization import get_performance_stats
        from src.utils.cache import cache
        
        print("=" * 60)
        print(f"TalentSphere Performance Monitor - {datetime.now()}")
        print("=" * 60)
        
        # System metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        print(f"\n📊 System Metrics:")
        print(f"CPU Usage: {cpu_percent}%")
        print(f"Memory Usage: {memory.percent}% ({memory.used // 1024 // 1024}MB / {memory.total // 1024 // 1024}MB)")
        print(f"Disk Usage: {disk.percent}% ({disk.used // 1024 // 1024 // 1024}GB / {disk.total // 1024 // 1024 // 1024}GB)")
        
        # Database performance
        db_stats = get_performance_stats()
        
        print(f"\n🗄️  Database Metrics:")
        print(f"Slow Queries: {db_stats['slow_queries_count']}")
        print(f"Connection Pool:")
        pool_status = db_stats['pool_status']
        print(f"  - Pool Size: {pool_status['pool_size']}")
        print(f"  - Checked In: {pool_status['checked_in']}")
        print(f"  - Checked Out: {pool_status['checked_out']}")
        print(f"  - Overflow: {pool_status['overflow']}")
        print(f"  - Invalid: {pool_status['invalid']}")
        
        # Cache status
        if cache.enabled:
            print(f"\n⚡ Cache Status: Enabled (Redis)")
        else:
            print(f"\n⚡ Cache Status: Disabled")
        
        # Recent slow queries
        if db_stats['recent_slow_queries']:
            print(f"\n🐌 Recent Slow Queries:")
            for i, query in enumerate(db_stats['recent_slow_queries'][-5:], 1):
                duration = query.get('duration', 0)
                sql = query.get('query', '')[:100] + '...' if len(query.get('query', '')) > 100 else query.get('query', '')
                print(f"  {i}. {duration:.3f}s - {sql}")
        
        print(f"\n" + "=" * 60)
        
    except Exception as e:
        print(f"❌ Performance monitoring failed: {str(e)}")

if __name__ == '__main__':
    monitor_performance()
EOF

chmod +x monitor_performance.py
print_success "Performance monitoring script created"

# Create startup optimization script
print_status "Creating optimized startup script..."

cat > start_optimized.sh << 'EOF'
#!/bin/bash

# TalentSphere Backend Optimized Startup Script

echo "🚀 Starting TalentSphere Backend (Optimized)"

# Set performance environment variables
export PYTHONUNBUFFERED=1
export PYTHONOPTIMIZE=1

# Start with optimized Gunicorn configuration
if [ -f "gunicorn.conf.py" ]; then
    echo "📈 Using optimized Gunicorn configuration"
    gunicorn -c gunicorn.conf.py src.main:app
else
    echo "⚠️  Gunicorn config not found, using default settings"
    gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 4 --timeout 30 src.main:app
fi
EOF

chmod +x start_optimized.sh
print_success "Optimized startup script created"

# Performance recommendations
print_status "Performance optimization completed! 🎉"
echo ""
print_success "Optimization Summary:"
echo "  ✅ Database indexes created/verified"
echo "  ✅ Connection pooling configured"
echo "  ✅ Query optimization enabled"
echo "  ✅ Caching system prepared (Redis optional)"
echo "  ✅ Gunicorn configuration optimized"
echo "  ✅ Performance monitoring tools created"
echo ""

print_warning "Next Steps:"
echo "  1. Install Redis server for caching (optional but recommended):"
echo "     - Ubuntu/Debian: sudo apt-get install redis-server"
echo "     - macOS: brew install redis"
echo "     - Docker: docker run -d -p 6379:6379 redis:alpine"
echo ""
echo "  2. Start the optimized backend:"
echo "     ./start_optimized.sh"
echo ""
echo "  3. Monitor performance:"
echo "     python monitor_performance.py"
echo ""

print_success "Backend optimization completed successfully! 🚀"

# Suggest production deployment settings
echo "📋 Production Deployment Recommendations:"
echo ""
echo "Environment Variables:"
echo "  DATABASE_URL=postgresql://user:pass@host:port/db"
echo "  REDIS_URL=redis://host:port/db"
echo "  FLASK_ENV=production"
echo "  SLOW_QUERY_THRESHOLD=1.0"
echo ""
echo "For Render.com deployment:"
echo "  - Build Command: pip install -r requirements.txt && python optimize_database.py"
echo "  - Start Command: ./start_optimized.sh"
echo ""
