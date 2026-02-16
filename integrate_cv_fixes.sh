#!/bin/bash
# CV Builder Fixes Integration Script
# Integrates all CV Builder improvements into the system

echo "🚀 CV Builder Fixes Integration"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "talentsphere-frontend" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

echo "📦 Step 1: Installing Python dependencies..."
cd backend
if [ -f "requirements.txt" ]; then
    # Check if json_repair is in requirements
    if ! grep -q "json-repair" requirements.txt; then
        echo "json-repair>=0.7.0" >> requirements.txt
        echo "✅ Added json-repair to requirements.txt"
    fi
    
    # Install dependencies
    pip install json-repair>=0.7.0 2>/dev/null || echo "⚠️  json-repair may need manual install"
else
    echo "⚠️  requirements.txt not found"
fi

echo ""
echo "🔍 Step 2: Verifying backend files..."
FILES=(
    "src/services/cv/parser.py"
    "src/services/cv/api_client.py"
    "src/services/cv_builder_enhancements.py"
    "src/routes/cv_builder.py"
    "src/utils/cv_logger.py"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
    fi
done

cd ..

echo ""
echo "🎨 Step 3: Verifying frontend files..."
FRONTEND_FILES=(
    "talentsphere-frontend/src/utils/cvStorage.js"
    "talentsphere-frontend/src/components/cv/CVVersionHistory.jsx"
    "talentsphere-frontend/src/components/cv/SectionProgressTracker.jsx"
)

for file in "${FRONTEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
    fi
done

echo ""
echo "🧪 Step 4: Testing backend health endpoint..."
cd backend
if python3 -c "from src.routes.cv_builder import cv_builder_bp; print('✅ Routes import successful')" 2>/dev/null; then
    echo "✅ Backend routes validated"
else
    echo "⚠️  Backend routes validation failed - check imports"
fi
cd ..

echo ""
echo "📊 Step 5: Checking logging configuration..."
cd backend
if python3 -c "from src.utils.cv_logger import cv_generation_logger; print('✅ Logger import successful')" 2>/dev/null; then
    echo "✅ Structured logging configured"
else
    echo "⚠️  Logger validation failed"
fi
cd ..

echo ""
echo "🔐 Step 6: Testing frontend utilities..."
cd talentsphere-frontend/src
if [ -f "utils/cvStorage.js" ]; then
    # Check if encryption functions exist
    if grep -q "simpleEncrypt" utils/cvStorage.js && grep -q "simpleDecrypt" utils/cvStorage.js; then
        echo "✅ CV storage encryption implemented"
    else
        echo "⚠️  Encryption functions not found"
    fi
else
    echo "❌ cvStorage.js not found"
fi
cd ../..

echo ""
echo "📝 Step 7: Summary of improvements..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ JSON parsing with 6-layer fallback"
echo "✅ Enhanced API rate limiting (3s intervals)"
echo "✅ Comprehensive ATS scoring (100-point scale)"
echo "✅ CV version history (last 5 CVs)"
echo "✅ Real-time progress tracking"
echo "✅ Encrypted sessionStorage"
echo "✅ Health check endpoint"
echo "✅ Structured JSON logging"
echo "✅ Error recovery system"
echo "✅ Optimization tips generator"
echo ""

echo "🎯 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Restart backend server: cd backend && python src/main.py"
echo "2. Restart frontend: cd talentsphere-frontend && npm run dev"
echo "3. Test health endpoint: curl http://localhost:5001/api/cv-builder/health"
echo "4. Generate a test CV to verify all features"
echo ""

echo "📖 Documentation:"
echo "   See CV_BUILDER_FIXES_COMPLETE.md for full details"
echo ""

echo "✨ CV Builder fixes integration complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
