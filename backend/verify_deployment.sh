#!/bin/bash

# TalentSphere Backend - Render Deployment Verification Script
# This script verifies that the backend is ready for Render deployment

set -e

echo "🔍 TalentSphere Backend - Render Deployment Verification"
echo "========================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

ERRORS=0

# Check if we're in the backend directory
if [ ! -f "src/main.py" ]; then
    print_error "Please run this script from the TalentSphere backend directory"
    exit 1
fi

print_info "Verifying deployment readiness..."
echo ""

# 1. Check Required Files
echo "📁 Checking Required Files..."

required_files=(
    "src/main.py"
    "requirements.txt"
    "gunicorn.conf.py"
    "render.yaml"
    ".env.template"
    "optimize_database.py"
    "wsgi.py"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file exists"
    else
        print_error "$file is missing"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# 2. Check Python Dependencies
echo "🐍 Checking Python Dependencies..."

if [ -f "requirements.txt" ]; then
    # Check for critical dependencies
    critical_deps=("Flask" "gunicorn" "psycopg2-binary" "redis" "Flask-SQLAlchemy")
    
    for dep in "${critical_deps[@]}"; do
        if grep -q "$dep" requirements.txt; then
            print_success "$dep found in requirements.txt"
        else
            print_error "$dep missing from requirements.txt"
            ERRORS=$((ERRORS + 1))
        fi
    done
else
    print_error "requirements.txt not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 3. Check Render Configuration
echo "🔧 Checking Render Configuration..."

if [ -f "render.yaml" ]; then
    # Check for essential render.yaml content
    if grep -q "type: web" render.yaml; then
        print_success "Web service configuration found"
    else
        print_error "Web service configuration missing"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "type: redis" render.yaml; then
        print_success "Redis service configuration found"
    else
        print_warning "Redis service configuration missing (optional)"
    fi
    
    if grep -q "gunicorn" render.yaml; then
        print_success "Gunicorn startup command found"
    else
        print_error "Gunicorn startup command missing"
        ERRORS=$((ERRORS + 1))
    fi
else
    print_error "render.yaml not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 4. Check Gunicorn Configuration
echo "🦄 Checking Gunicorn Configuration..."

if [ -f "gunicorn.conf.py" ]; then
    if grep -q "bind.*PORT" gunicorn.conf.py; then
        print_success "PORT environment variable binding found"
    else
        print_error "PORT environment variable binding missing"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "workers.*=" gunicorn.conf.py; then
        print_success "Worker configuration found"
    else
        print_error "Worker configuration missing"
        ERRORS=$((ERRORS + 1))
    fi
else
    print_error "gunicorn.conf.py not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 5. Check Source Code Structure
echo "📂 Checking Source Code Structure..."

required_dirs=(
    "src"
    "src/routes"
    "src/models" 
    "src/utils"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        print_success "$dir directory exists"
    else
        print_error "$dir directory missing"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check for main application file
if [ -f "src/main.py" ]; then
    if grep -q "app.*=.*Flask" src/main.py; then
        print_success "Flask app initialization found"
    else
        print_error "Flask app initialization missing"
        ERRORS=$((ERRORS + 1))
    fi
else
    print_error "src/main.py not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 6. Check Database Optimization
echo "🗄️  Checking Database Optimization..."

if [ -f "optimize_database.py" ]; then
    if grep -q "create.*index" optimize_database.py; then
        print_success "Database index creation found"
    else
        print_warning "Database index creation not found"
    fi
    
    if grep -q "PostgreSQL\|SQLite" optimize_database.py; then
        print_success "Database optimization logic found"
    else
        print_warning "Database optimization logic not clear"
    fi
else
    print_error "optimize_database.py not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 7. Check Environment Template
echo "⚙️  Checking Environment Configuration..."

if [ -f ".env.template" ]; then
    env_vars=("SECRET_KEY" "DATABASE_URL" "FLASK_ENV" "PORT")
    
    for var in "${env_vars[@]}"; do
        if grep -q "$var" .env.template; then
            print_success "$var template found"
        else
            print_error "$var template missing"
            ERRORS=$((ERRORS + 1))
        fi
    done
else
    print_error ".env.template not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 8. Check for Unnecessary Files
echo "🧹 Checking for Unnecessary Files..."

unnecessary_patterns=(
    "test_*.py"
    "*_test.py"
    "venv/"
    "__pycache__/"
    "*.log"
    "logs/"
    "tmp/"
    "*.db"
)

found_unnecessary=false
for pattern in "${unnecessary_patterns[@]}"; do
    if ls $pattern 2>/dev/null | grep -q .; then
        print_warning "Found unnecessary files: $pattern"
        found_unnecessary=true
    fi
done

if [ "$found_unnecessary" = false ]; then
    print_success "No unnecessary files found"
fi
echo ""

# 9. Final Summary
echo "📊 Deployment Readiness Summary"
echo "================================"

if [ $ERRORS -eq 0 ]; then
    print_success "🎉 Backend is ready for Render deployment!"
    echo ""
    print_info "Next steps:"
    echo "  1. Push code to GitHub: git push origin main"
    echo "  2. Create web service on Render"
    echo "  3. Configure environment variables"
    echo "  4. Deploy and test endpoints"
    echo ""
    print_info "Deployment Guide: RENDER_DEPLOYMENT_GUIDE.md"
    exit 0
else
    print_error "❌ Found $ERRORS issue(s) that need to be fixed before deployment"
    echo ""
    print_info "Please fix the issues above and run this script again"
    echo ""
    exit 1
fi