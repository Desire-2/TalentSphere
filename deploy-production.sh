#!/bin/bash

# TalentSphere Production Deployment Script
# This script prepares the app for production deployment

set -e  # Exit on any error

echo "🚀 TalentSphere Production Deployment Setup"
echo "=============================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
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

# Check if we're in the right directory
if [ ! -f "backend/.env" ]; then
    print_error "Please run this script from the TalentSphere root directory"
    exit 1
fi

print_info "Starting production setup..."

# 1. Backend Setup
echo ""
echo "📦 BACKEND SETUP"
echo "=================="

cd backend

# Check if .env exists and has required variables
print_info "Checking environment configuration..."

if grep -q "SENDER_PASSWORD=your-yahoo-app-password-here" .env; then
    print_warning "Yahoo App Password not configured!"
    print_warning "Please update SENDER_PASSWORD in backend/.env"
    print_warning "See YAHOO_EMAIL_SETUP.md for instructions"
    echo ""
    echo "Current email config:"
    echo "SENDER_EMAIL=$(grep SENDER_EMAIL .env | cut -d'=' -f2)"
    echo "SMTP_SERVER=$(grep SMTP_SERVER .env | cut -d'=' -f2)"
    echo "SENDER_PASSWORD=*** NOT SET ***"
    echo ""
else
    print_status "Email configuration appears to be set"
fi

# Check Python dependencies
print_info "Checking Python dependencies..."
if [ -f requirements.txt ]; then
    print_status "requirements.txt found"
else
    print_error "requirements.txt not found!"
    exit 1
fi

# Install/update dependencies
print_info "Installing Python dependencies..."
pip install -r requirements.txt

# Test database connection
print_info "Testing database connection..."
python -c "
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from dotenv import load_dotenv
load_dotenv()

try:
    from src.models.user import db
    from src.main import app
    with app.app_context():
        from sqlalchemy import text
        result = db.session.execute(text('SELECT 1'))
        print('✅ Database connection successful!')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    sys.exit(1)
"

print_status "Backend setup complete"

# 2. Frontend Setup
echo ""
echo "🌐 FRONTEND SETUP"
echo "=================="

cd ../talentsphere-frontend

# Check if package.json exists
if [ ! -f package.json ]; then
    print_error "package.json not found in frontend directory!"
    exit 1
fi

print_info "Installing frontend dependencies..."
npm install

# Build production version
print_info "Building production frontend..."
npm run build

print_status "Frontend build complete"

# 3. Security Checks
echo ""
echo "🔐 SECURITY CHECKS"
echo "=================="

cd ..

# Check for sensitive files
print_info "Checking for sensitive files..."

# Check if .env files are in .gitignore
if grep -q ".env" .gitignore 2>/dev/null; then
    print_status ".env files are in .gitignore"
else
    print_warning ".env files should be added to .gitignore"
    echo "backend/.env" >> .gitignore
    echo "talentsphere-frontend/.env.local" >> .gitignore
    print_status "Added .env files to .gitignore"
fi

# Check for default passwords
print_info "Checking for default/weak passwords..."

if grep -r "your-secret-key-here" backend/ 2>/dev/null; then
    print_warning "Found default secret keys! Update before production."
fi

if grep -r "password123" backend/ 2>/dev/null; then
    print_warning "Found weak test passwords! Remove before production."
fi

print_status "Security check complete"

# 4. Production Configuration Summary
echo ""
echo "📋 PRODUCTION CONFIGURATION SUMMARY"
echo "===================================="

echo ""
echo "Backend Configuration:"
echo "  • Database: $(grep 'DATABASE_URL=' backend/.env | cut -d'=' -f1)=*** (PostgreSQL)"
echo "  • Email: $(grep 'SENDER_EMAIL=' backend/.env | cut -d'=' -f2)"
echo "  • SMTP: $(grep 'SMTP_SERVER=' backend/.env | cut -d'=' -f2):$(grep 'SMTP_PORT=' backend/.env | cut -d'=' -f2)"
echo "  • Frontend URL: $(grep 'FRONTEND_URL=' backend/.env | cut -d'=' -f2)"
echo ""

echo "Frontend Configuration:"
echo "  • API URL: $(grep 'VITE_API_URL=' talentsphere-frontend/.env.production | cut -d'=' -f2)"
echo "  • Environment: $(grep 'VITE_APP_ENVIRONMENT=' talentsphere-frontend/.env.production | cut -d'=' -f2)"
echo "  • Contact Email: $(grep 'VITE_SUPPORT_EMAIL=' talentsphere-frontend/.env.production | cut -d'=' -f2)"
echo ""

# 5. Deployment Instructions
echo ""
echo "🚀 DEPLOYMENT INSTRUCTIONS"
echo "=========================="

print_info "Backend Deployment (Render.com):"
echo "  1. Connect your GitHub repository to Render"
echo "  2. Create a new Web Service"
echo "  3. Set Build Command: cd backend && pip install -r requirements.txt"
echo "  4. Set Start Command: cd backend && gunicorn wsgi:application"
echo "  5. Add environment variables from backend/.env"
echo "  6. Deploy!"
echo ""

print_info "Frontend Deployment (Vercel.com):"
echo "  1. Connect your GitHub repository to Vercel"
echo "  2. Set Root Directory: talentsphere-frontend"
echo "  3. Framework Preset: Vite"
echo "  4. Build Command: npm run build"
echo "  5. Output Directory: dist"
echo "  6. Add environment variables from .env.production"
echo "  7. Deploy!"
echo ""

# 6. Final Checklist
echo ""
echo "✅ DEPLOYMENT CHECKLIST"
echo "======================="

echo "Before deploying to production, ensure:"
echo ""
echo "☐ Yahoo App Password configured in SENDER_PASSWORD"
echo "☐ Database connection tested successfully"
echo "☐ Frontend built without errors"
echo "☐ Environment variables set in hosting service"
echo "☐ Frontend API URLs point to production backend"
echo "☐ SSL certificates configured (HTTPS)"
echo "☐ DNS records configured for custom domain"
echo "☐ Email sending tested in production environment"
echo ""

print_status "Production setup script completed!"
print_info "Review the checklist above and deploy when ready."

echo ""
echo "📧 Don't forget to configure the Yahoo App Password!"
echo "📖 See YAHOO_EMAIL_SETUP.md for detailed instructions"
echo ""
echo "🎉 TalentSphere is ready for production deployment!"
