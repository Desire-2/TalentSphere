#!/bin/bash

# Setup script for Enhanced Job Seeker Profile System
echo "=========================================="
echo "Enhanced Profile System Setup"
echo "=========================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run: python -m venv venv"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

echo ""
echo "✓ Virtual environment activated"

# Run database migration
echo ""
echo "Running database migration..."
python migrate_profile_extensions.py

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✓ Setup Complete!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Start backend: python src/main.py"
    echo "2. Start frontend: cd ../talentsphere-frontend && npm run dev"
    echo "3. Navigate to: http://localhost:5173/jobseeker/profile"
    echo ""
    echo "API Documentation:"
    echo "- Profile Complete: GET /api/profile/complete-profile"
    echo "- Work Experience: /api/profile/work-experience"
    echo "- Education: /api/profile/education"
    echo "- Certifications: /api/profile/certifications"
    echo "- Projects: /api/profile/projects"
    echo "- More endpoints in ENHANCED_PROFILE_API_DOCS.md"
    echo ""
else
    echo ""
    echo "❌ Migration failed. Please check error messages above."
    exit 1
fi
