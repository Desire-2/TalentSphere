#!/bin/bash

# Test Scholarship Categories Loading
# This script tests both frontend and backend scholarship category loading

echo "🧪 Testing Scholarship Categories System"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend API - Get all categories
echo "📡 Test 1: Backend API - Get all categories"
RESPONSE=$(curl -s http://localhost:5001/api/scholarship-categories)
if [ -n "$RESPONSE" ]; then
    COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data))" 2>/dev/null)
    if [ -n "$COUNT" ] && [ "$COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ PASS${NC} - Backend returns $COUNT categories"
        echo "$RESPONSE" | python3 -m json.tool 2>/dev/null | head -30
    else
        echo -e "${RED}❌ FAIL${NC} - Backend returned invalid format"
        echo "Response: $RESPONSE"
    fi
else
    echo -e "${RED}❌ FAIL${NC} - Backend returned empty response"
fi
echo ""

# Test 2: Backend API - Get active categories only
echo "📡 Test 2: Backend API - Get active categories only"
RESPONSE=$(curl -s "http://localhost:5001/api/scholarship-categories?only_active=true")
if [ -n "$RESPONSE" ]; then
    COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data))" 2>/dev/null)
    if [ -n "$COUNT" ] && [ "$COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ PASS${NC} - Backend returns $COUNT active categories"
    else
        echo -e "${RED}❌ FAIL${NC} - Backend returned invalid format"
    fi
else
    echo -e "${RED}❌ FAIL${NC} - Backend returned empty response"
fi
echo ""

# Test 3: Backend API - Get categories with children
echo "📡 Test 3: Backend API - Get categories with children"
RESPONSE=$(curl -s "http://localhost:5001/api/scholarship-categories?include_children=true")
if [ -n "$RESPONSE" ]; then
    COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data))" 2>/dev/null)
    if [ -n "$COUNT" ]; then
        echo -e "${GREEN}✅ PASS${NC} - Backend returns $COUNT parent categories"
    else
        echo -e "${RED}❌ FAIL${NC} - Backend returned invalid format"
    fi
else
    echo -e "${RED}❌ FAIL${NC} - Backend returned empty response"
fi
echo ""

# Test 4: Check response structure
echo "🔍 Test 4: Check response structure"
RESPONSE=$(curl -s http://localhost:5001/api/scholarship-categories)
HAS_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print('id' in data[0] if len(data) > 0 else False)" 2>/dev/null)
HAS_NAME=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print('name' in data[0] if len(data) > 0 else False)" 2>/dev/null)
HAS_SLUG=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print('slug' in data[0] if len(data) > 0 else False)" 2>/dev/null)

if [ "$HAS_ID" = "True" ] && [ "$HAS_NAME" = "True" ] && [ "$HAS_SLUG" = "True" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Response has correct structure (id, name, slug)"
else
    echo -e "${RED}❌ FAIL${NC} - Response missing required fields"
    echo "Has ID: $HAS_ID, Has Name: $HAS_NAME, Has Slug: $HAS_SLUG"
fi
echo ""

# Test 5: Check if frontend files exist
echo "📁 Test 5: Check if frontend files exist"
FILES_TO_CHECK=(
    "talentsphere-frontend/src/services/scholarship.js"
    "talentsphere-frontend/src/pages/external-admin/CreateScholarship.jsx"
    "talentsphere-frontend/src/pages/external-admin/EditScholarship.jsx"
    "talentsphere-frontend/src/pages/scholarships/ScholarshipList.jsx"
)

ALL_FILES_EXIST=true
for FILE in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$FILE" ]; then
        echo -e "${GREEN}✅${NC} $FILE"
    else
        echo -e "${RED}❌${NC} $FILE - NOT FOUND"
        ALL_FILES_EXIST=false
    fi
done
echo ""

# Test 6: Check if service has getScholarshipCategories method
echo "🔍 Test 6: Check if scholarship service has getScholarshipCategories method"
if grep -q "getScholarshipCategories" talentsphere-frontend/src/services/scholarship.js; then
    echo -e "${GREEN}✅ PASS${NC} - getScholarshipCategories method found"
else
    echo -e "${RED}❌ FAIL${NC} - getScholarshipCategories method not found"
fi
echo ""

# Test 7: Check backend route registration
echo "🔍 Test 7: Check backend route registration"
if grep -q "@scholarship_bp.route('/scholarship-categories'" backend/src/routes/scholarship.py; then
    echo -e "${GREEN}✅ PASS${NC} - scholarship-categories route registered"
else
    echo -e "${RED}❌ FAIL${NC} - scholarship-categories route not found"
fi
echo ""

# Summary
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="
echo ""
echo "Backend API Tests:"
echo "  - Get all categories: Check manually above"
echo "  - Get active categories: Check manually above"
echo "  - Get categories with children: Check manually above"
echo "  - Response structure: Check manually above"
echo ""
echo "Frontend Tests:"
echo "  - Files exist: $ALL_FILES_EXIST"
echo "  - Service method exists: Check manually above"
echo "  - Backend route exists: Check manually above"
echo ""
echo "🎯 Next Steps:"
echo "  1. Open browser console (F12) and navigate to scholarship pages"
echo "  2. Check for console logs with 📚 emoji"
echo "  3. Verify categories load in dropdown/select fields"
echo "  4. Test creating/editing scholarships"
echo ""
