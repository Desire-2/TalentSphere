#!/usr/bin/env bash
# start.sh - Startup script with environment validation

set -o errexit  # exit on error

echo "🚀 Starting TalentSphere Backend..."
echo "=" * 50

# Activate virtual environment if not already active
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "📦 Activating virtual environment..."
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
        echo "✅ Virtual environment activated"
    else
        echo "❌ Virtual environment not found at venv/bin/activate"
        exit 1
    fi
else
    echo "✅ Virtual environment already active: $VIRTUAL_ENV"
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
    "PORT"
    "CORS_ORIGINS"
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

# Test database connection (optional)
if [[ "${FLASK_ENV}" != "production" ]]; then
    echo ""
    echo "🗄️  Testing database connection..."
    python -c "
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
echo "🚀 Starting server with gunicorn..."
echo "🌐 Server will be available at: http://0.0.0.0:${PORT:-5000}"
echo ""

# Use different configurations for development vs production
if [[ "${FLASK_ENV}" == "production" ]]; then
    exec gunicorn --bind 0.0.0.0:${PORT:-5000} \
        --workers 2 \
        --timeout 120 \
        --access-logfile - \
        --error-logfile - \
        --log-level info \
        wsgi:app
else
    exec gunicorn --bind 0.0.0.0:${PORT:-5000} \
        --workers 1 \
        --timeout 60 \
        --reload \
        --access-logfile - \
        --error-logfile - \
        --log-level debug \
        wsgi:app
fi
