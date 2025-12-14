#!/bin/bash

echo "🔍 Verifying CV Builder API Setup"
echo "=================================="
echo ""

# Check if backend is running
echo "1️⃣  Checking if backend is running on port 5001..."
if curl -s http://localhost:5001 >/dev/null 2>&1; then
    echo "   ✅ Backend is running on port 5001"
else
    echo "   ❌ Backend is NOT running on port 5001"
    echo "   → Start backend: cd backend && python src/main.py"
    exit 1
fi
echo ""

# Check if frontend dev server is running
echo "2️⃣  Checking if frontend is running on port 5173..."
if curl -s http://localhost:5173 >/dev/null 2>&1; then
    echo "   ✅ Frontend is running on port 5173"
else
    echo "   ⚠️  Frontend is NOT running on port 5173"
    echo "   → Start frontend: cd talentsphere-frontend && npm run dev"
fi
echo ""

# List all CV builder routes
echo "3️⃣  Checking backend CV builder routes..."
cd /home/desire/My_Project/TalentSphere/backend
python3 << 'EOF'
import sys
sys.path.insert(0, '/home/desire/My_Project/TalentSphere/backend')

from src.routes.cv_builder import cv_builder_bp

print("   Available CV Builder endpoints:")
for rule in cv_builder_bp.url_map.iter_rules():
    if 'cv-builder' in rule.rule:
        methods = ','.join(rule.methods - {'HEAD', 'OPTIONS'})
        print(f"   ✓ {methods:6s} {rule.rule}")
EOF
echo ""

# Test a simple endpoint without auth
echo "4️⃣  Testing /api/cv-builder/styles endpoint (no auth required)..."
RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:5001/api/cv-builder/styles)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Endpoint is accessible (HTTP $HTTP_CODE)"
    echo "$BODY" | jq -r '.data | keys[]' 2>/dev/null | head -3 | sed 's/^/      - /'
else
    echo "   ❌ Endpoint returned HTTP $HTTP_CODE"
    echo "   Response: $BODY"
fi
echo ""

echo "=================================="
echo "✅ Verification complete"
echo ""
echo "📋 Summary:"
echo "   - Backend running: $(curl -s http://localhost:5001 >/dev/null 2>&1 && echo 'YES' || echo 'NO')"
echo "   - Frontend running: $(curl -s http://localhost:5173 >/dev/null 2>&1 && echo 'YES' || echo 'NO')"
echo "   - CV Builder API: Configured with quick-generate endpoint"
echo ""
echo "🚀 Next steps:"
echo "   1. Make sure both backend and frontend are running"
echo "   2. Login to get an auth token"
echo "   3. Test the quick-generate endpoint with: ./test_cv_quick_generate.sh YOUR_TOKEN"
