#!/usr/bin/env bash
# start.sh - Optimized Startup script with performance enhancements

set -o errexit  # exit on error

echo "🚀 Starting TalentSphere Backend (Optimized)..."
echo "=================================================="

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

# Load and validate environment variables from .env file
echo ""
echo "🔍 Loading environment variables..."
if [ -f .env ]; then
    echo "📄 Found .env file, loading variables..."
    
    # Export variables from .env (skip comments and empty lines)
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
    
    echo "✅ Environment variables loaded from .env"
else
    echo "⚠️  .env file not found - using system environment variables only"
fi

# Validate required environment variables
echo ""
echo "🔒 Validating required environment variables..."

REQUIRED_VARS=(
    "SECRET_KEY"
    "DATABASE_URL"
)

OPTIONAL_VARS=(
    "FLASK_ENV"
    "JWT_SECRET_KEY"
    "VERCEL_BLOB_READ_WRITE_TOKEN"
    "PORT"
    "CORS_ORIGINS"
    "REDIS_URL"
    "SLOW_QUERY_THRESHOLD"
    "DB_POOL_SIZE"
    "DB_MAX_OVERFLOW"
)

# Check required variables
MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var}" ]]; then
        MISSING_VARS+=("$var")
        echo "  ❌ $var: Not set (REQUIRED)"
    else
        # Mask sensitive values for display
        case $var in
            *SECRET*|*PASSWORD*|*KEY*)
                masked_value="${!var:0:8}***${!var: -8}"
                echo "  ✅ $var: $masked_value"
                ;;
            *DATABASE_URL*)
                masked_value="${!var:0:15}***${!var: -15}"
                echo "  ✅ $var: $masked_value"
                ;;
            *)
                echo "  ✅ $var: ${!var}"
                ;;
        esac
    fi
done

if [[ -z "$VERCEL_BLOB_READ_WRITE_TOKEN" ]]; then
    echo ""
    echo "⚠️  VERCEL_BLOB_READ_WRITE_TOKEN is not set."
    echo "   Ad creative image uploads to Vercel Blob will fail until this is configured."
fi

# Check optional variables
echo ""
echo "🔧 Optional environment variables:"
for var in "${OPTIONAL_VARS[@]}"; do
    if [[ -n "${!var}" ]]; then
        case $var in
            *SECRET*|*PASSWORD*|*KEY*)
                masked_value="${!var:0:8}***${!var: -8}"
                echo "  ✅ $var: $masked_value"
                ;;
            *)
                echo "  ✅ $var: ${!var}"
                ;;
        esac
    else
        # Set defaults for some variables
        case $var in
            "FLASK_ENV")
                export FLASK_ENV="development"
                echo "  🔧 $var: development (default)"
                ;;
            "PORT")
                # Don't set default here, we'll handle it later
                echo "  ⚪ $var: Not set (will auto-detect)"
                ;;
            "SLOW_QUERY_THRESHOLD")
                export SLOW_QUERY_THRESHOLD="1.0"
                echo "  🔧 $var: 1.0 (default)"
                ;;
            "DB_POOL_SIZE")
                export DB_POOL_SIZE="10"
                echo "  🔧 $var: 10 (default)"
                ;;
            "DB_MAX_OVERFLOW")
                export DB_MAX_OVERFLOW="20"
                echo "  🔧 $var: 20 (default)"
                ;;
            *)
                echo "  ⚪ $var: Not set (optional)"
                ;;
        esac
    fi
done

# Exit if required variables are missing
if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo ""
    echo "❌ Missing required environment variables: ${MISSING_VARS[*]}"
    echo "💡 Please check your .env file or set these variables."
    exit 1
fi

# Display system information
echo ""
echo "🖥️  System Information:"
echo "  🐍 Python version: $(python --version)"
echo "  📁 Current directory: $(pwd)"
echo "  🌐 Environment: ${FLASK_ENV:-development}"

# Find available port if default is in use
if [[ -z "$PORT" ]]; then
    echo "  🔍 Finding available port..."
    AVAILABLE_PORT=$(python find_port.py 2>/dev/null || echo "5002")
    export PORT=$AVAILABLE_PORT
    echo "  🚪 Port: $PORT (auto-selected)"
else
    echo "  🚪 Port: $PORT (configured)"
fi

# Check if gunicorn is available
echo ""
echo "🔍 Checking dependencies..."
if ! command -v gunicorn &> /dev/null; then
    echo "❌ gunicorn not found - installing dependencies..."
    pip install -r requirements.txt
else
    echo "✅ gunicorn is available"
fi

# Run database optimization if not already done
echo ""
echo "⚡ Running performance optimizations..."
if [ -f "optimize_database.py" ]; then
    echo "🗄️  Optimizing database..."
    # Run with 30-second timeout to prevent hanging
    timeout 40 python3 optimize_database.py || {
        exit_code=$?
        if [ $exit_code -eq 124 ]; then
            echo "⏱️  Database optimization timed out - continuing with startup"
        else
            echo "⚠️  Database optimization failed (exit code: $exit_code) - continuing with startup"
        fi
    }
else
    echo "⚠️  Database optimization script not found"
fi

# Check Redis connection (optional)
if [[ -n "$REDIS_URL" ]]; then
    echo "🔴 Testing Redis connection..."
    python3 -c "
try:
    import redis
    r = redis.from_url('${REDIS_URL}')
    r.ping()
    print('  ✅ Redis connection successful')
except Exception as e:
    print(f'  ⚠️  Redis connection failed: {e}')
    print('  💡 Caching will be disabled')
" || echo "  ⚠️  Redis test failed - caching disabled"
fi

# Test database connection (optional)
if [[ "${FLASK_ENV}" != "production" ]]; then
    echo ""
    echo "🗄️  Testing database connection..."
    python3 -c "
import sys
sys.path.insert(0, '.')
try:
    from src.main import app
    with app.app_context():
        from src.models.user import db
        db.create_all()
    print('  ✅ Database connection successful')
except Exception as e:
    print(f'  ⚠️  Database test failed: {e}')
    print('  💡 This might be normal if database is not yet set up')
"
fi

# Start the server
echo ""
echo "🚀 Starting optimized server with gunicorn..."
echo "🌐 Server will be available at: http://0.0.0.0:${PORT:-5000}"
echo "📊 Performance monitoring available with: python monitor_performance.py"
echo ""

# Set performance environment variables
export PYTHONUNBUFFERED=1
export PYTHONOPTIMIZE=1

# Use optimized Gunicorn configuration if available
if [ -f "gunicorn.conf.py" ]; then
    echo "📈 Using optimized Gunicorn configuration"
    exec gunicorn -c gunicorn.conf.py wsgi:app
else
    echo "⚠️  Optimized Gunicorn config not found, using performance settings"
    # Use different configurations for development vs production
    if [[ "${FLASK_ENV}" == "production" ]]; then
        exec gunicorn --bind 0.0.0.0:${PORT:-5000} \
            --workers $(python -c "import multiprocessing; print(multiprocessing.cpu_count() * 2 + 1)") \
            --worker-class sync \
            --timeout 30 \
            --keepalive 2 \
            --max-requests 1000 \
            --max-requests-jitter 100 \
            --preload \
            --access-logfile - \
            --error-logfile - \
            --log-level info \
            wsgi:app
    else
        exec gunicorn --bind 0.0.0.0:${PORT:-5000} \
            --workers 2 \
            --timeout 60 \
            --reload \
            --access-logfile - \
            --error-logfile - \
            --log-level debug \
            wsgi:app
    fi
fi
