#!/bin/bash

# Enhanced Notification System Launcher
# Quick deployment and testing script

set -e

echo "🚀 Enhanced Notification System Launcher"
echo "========================================"

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

# Check if we're in the right directory
if [[ ! -f "src/main.py" ]]; then
    print_error "Please run this script from the backend directory"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
print_status "Checking dependencies..."

if ! command_exists python; then
    print_error "Python is not installed"
    exit 1
fi

if ! command_exists pip; then
    print_error "pip is not installed"
    exit 1
fi

print_success "Dependencies check passed"

# Install/update Python packages
print_status "Installing/updating Python packages..."
pip install -r requirements.txt

# Check if .env file exists
if [[ ! -f ".env" ]]; then
    print_warning ".env file not found"
    print_status "Creating .env file from template..."
    
    cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/talentsphere
DB_HOST=localhost
DB_PORT=5432
DB_NAME=talentsphere
DB_USER=postgres
DB_PASSWORD=password

# Flask Configuration
SECRET_KEY=your_secret_key_here_please_change_this
JWT_SECRET_KEY=your_jwt_secret_key_here_please_change_this

# Email Configuration (Yahoo SMTP)
MAIL_SERVER=smtp.mail.yahoo.com
MAIL_PORT=587
MAIL_USERNAME=your_yahoo_email@yahoo.com
MAIL_PASSWORD=your_yahoo_app_password
MAIL_USE_TLS=true
MAIL_DEFAULT_SENDER=your_yahoo_email@yahoo.com

# Application Settings
FLASK_ENV=development
FLASK_DEBUG=true
HOST=0.0.0.0
PORT=5001

# Frontend URL
FRONTEND_URL=http://localhost:5173
EOF

    print_warning "⚠️  Please update the .env file with your actual configuration values"
    print_warning "Especially update EMAIL settings with your Yahoo email and app password"
fi

# Parse command line arguments
SKIP_MIGRATION=false
SKIP_TESTS=false
RUN_INTEGRATION=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-migration)
            SKIP_MIGRATION=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --full-integration)
            RUN_INTEGRATION=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-migration     Skip database migration"
            echo "  --skip-tests        Skip running tests"
            echo "  --full-integration  Run full integration test"
            echo "  --help              Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# If full integration requested, run it
if [[ "$RUN_INTEGRATION" == true ]]; then
    print_status "Running full integration test..."
    python integrate_enhanced_notifications.py
    exit $?
fi

# Run database migration unless skipped
if [[ "$SKIP_MIGRATION" != true ]]; then
    print_status "Checking database migration status..."
    
    if python migrate_enhanced_notifications.py status | grep -q "not applied"; then
        print_status "Running database migration..."
        python migrate_enhanced_notifications.py migrate
        print_success "Database migration completed"
    else
        print_status "Database migration already applied"
    fi
fi

# Start the application
print_status "Starting Enhanced Notification System..."

# Check if we should run tests
if [[ "$SKIP_TESTS" != true ]]; then
    print_status "Running quick verification tests..."
    
    # Start server in background
    python src/main.py &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 5
    
    # Run tests
    if python test_enhanced_notifications.py --cleanup; then
        print_success "Tests passed successfully"
    else
        print_warning "Some tests failed, but continuing..."
    fi
    
    # Stop background server
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
fi

# Final startup
print_success "🎉 Enhanced Notification System is ready!"
print_status "Starting production server..."

echo ""
echo "🌟 Features Available:"
echo "   📧 Email notifications with 8 templates"
echo "   ⚙️  User preference management"
echo "   📊 Delivery tracking and statistics"
echo "   🔄 Background notification scheduler"
echo "   🎨 Enhanced UI components"
echo ""
echo "🔗 API Endpoints:"
echo "   GET  /api/enhanced-notifications/notifications"
echo "   POST /api/enhanced-notifications/notifications"
echo "   GET  /api/enhanced-notifications/notification-preferences"
echo "   PUT  /api/enhanced-notifications/notification-preferences"
echo "   And 8 more endpoints..."
echo ""
echo "🌐 Frontend Routes:"
echo "   /notifications - Enhanced notification list"
echo "   /notifications/preferences - Notification settings"
echo ""

# Start the server
exec python src/main.py