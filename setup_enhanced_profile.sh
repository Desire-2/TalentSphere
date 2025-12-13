#!/bin/bash

# Enhanced Profile System - Quick Start Script
# This script sets up and runs the database migration for the new profile features

echo "=================================="
echo "TalentSphere Enhanced Profile Setup"
echo "=================================="
echo ""

# Check if we're in the correct directory
if [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the TalentSphere root directory"
    exit 1
fi

cd backend

echo "Step 1: Checking Python environment..."
if ! command -v python &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.8+"
    exit 1
fi

PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $PYTHON_VERSION"
echo ""

echo "Step 2: Running database migration..."
echo "This will create new tables for:"
echo "  - Work Experience"
echo "  - Education"
echo "  - Certifications"
echo "  - Projects"
echo "  - Awards"
echo "  - Languages"
echo "  - Volunteer Experience"
echo "  - Professional Memberships"
echo ""

python migrate_profile_extensions.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "=================================="
    echo "Next Steps:"
    echo "=================================="
    echo ""
    echo "1. Backend is ready! The new API endpoints are available at:"
    echo "   - /api/profile/work-experience"
    echo "   - /api/profile/education"
    echo "   - /api/profile/certifications"
    echo "   - /api/profile/projects"
    echo "   - /api/profile/keywords-analysis"
    echo "   - /api/profile/completeness-analysis"
    echo "   - /api/profile/export-text"
    echo "   - /api/profile/export-json"
    echo ""
    echo "2. Start the backend server:"
    echo "   cd backend"
    echo "   python src/main.py"
    echo ""
    echo "3. Frontend components need to be created in:"
    echo "   talentsphere-frontend/src/pages/jobseeker/sections/"
    echo ""
    echo "4. See ENHANCED_PROFILE_SYSTEM_COMPLETE_GUIDE.md for:"
    echo "   - Complete API documentation"
    echo "   - Frontend component specifications"
    echo "   - Implementation examples"
    echo "   - Best practices"
    echo ""
    echo "=================================="
    echo "Test the new endpoints:"
    echo "=================================="
    echo ""
    echo "# Get profile completeness analysis"
    echo "curl -X GET http://localhost:5001/api/profile/completeness-analysis \\"
    echo "  -H \"Authorization: Bearer YOUR_TOKEN\""
    echo ""
    echo "# Get keyword suggestions"
    echo "curl -X GET http://localhost:5001/api/profile/keywords-analysis \\"
    echo "  -H \"Authorization: Bearer YOUR_TOKEN\""
    echo ""
    echo "# Add work experience"
    echo "curl -X POST http://localhost:5001/api/profile/work-experience \\"
    echo "  -H \"Authorization: Bearer YOUR_TOKEN\" \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -d '{\"job_title\": \"Software Engineer\", \"company_name\": \"Tech Corp\", ...}'"
    echo ""
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    echo ""
    echo "Common issues:"
    echo "  - Database not accessible"
    echo "  - Missing dependencies (run: pip install -r requirements.txt)"
    echo "  - Tables already exist (safe to ignore if columns were added)"
    exit 1
fi
