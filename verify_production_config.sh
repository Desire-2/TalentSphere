#!/bin/bash

# Quick deployment verification script for TalentSphere
# This script checks if your frontend and backend are properly configured

set -e

echo "🔍 TalentSphere Production Deployment Verification"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check URL
check_url() {
    local url=$1
    local description=$2
    
    echo -n "Checking $description... "
    
    if curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Function to check CORS
check_cors() {
    local backend_url=$1
    local frontend_url=$2
    
    echo -n "Checking CORS for $frontend_url... "
    
    response=$(curl -s -I -X OPTIONS \
        -H "Origin: $frontend_url" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Authorization" \
        "$backend_url/api/auth/profile" 2>&1)
    
    if echo "$response" | grep -q "Access-Control-Allow-Origin"; then
        echo -e "${GREEN}✓ CORS OK${NC}"
        return 0
    else
        echo -e "${RED}✗ CORS NOT CONFIGURED${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Read configuration
echo "📋 Reading Configuration"
echo "------------------------"

if [ -f "talentsphere-frontend/.env.production" ]; then
    echo "Found .env.production"
    BACKEND_URL=$(grep VITE_API_URL talentsphere-frontend/.env.production | cut -d '=' -f2)
    echo "Backend URL: $BACKEND_URL"
else
    echo -e "${RED}✗ .env.production not found${NC}"
    exit 1
fi

FRONTEND_URL="https://jobs.afritechbridge.online"

echo ""
echo "🌐 Testing Backend Connectivity"
echo "--------------------------------"

# Test backend health
check_url "$BACKEND_URL/api/health" "Backend health endpoint" || \
    check_url "$BACKEND_URL" "Backend base URL"

echo ""
echo "🔐 Testing CORS Configuration"
echo "------------------------------"

check_cors "$BACKEND_URL" "$FRONTEND_URL"

echo ""
echo "🌍 Testing Frontend Accessibility"
echo "----------------------------------"

check_url "$FRONTEND_URL" "Frontend URL"

echo ""
echo "📝 Testing API Endpoint"
echo "-----------------------"

echo "Testing /api/auth/profile endpoint (without auth)..."
response_code=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/auth/profile")

if [ "$response_code" == "401" ]; then
    echo -e "${GREEN}✓ Endpoint exists (401 Unauthorized is expected without token)${NC}"
elif [ "$response_code" == "200" ]; then
    echo -e "${GREEN}✓ Endpoint exists and responding${NC}"
else
    echo -e "${RED}✗ Unexpected response: $response_code${NC}"
fi

echo ""
echo "📊 Summary"
echo "----------"

echo ""
echo "Next Steps:"
echo "1. If CORS check failed:"
echo "   - Update backend CORS_ORIGINS environment variable"
echo "   - Add: $FRONTEND_URL"
echo "   - Restart backend service"
echo ""
echo "2. If backend is unreachable:"
echo "   - Check backend service status on hosting platform"
echo "   - Verify DNS/SSL configuration"
echo ""
echo "3. To test with authentication:"
echo "   - Login to get a token"
echo "   - Run: curl -H 'Authorization: Bearer YOUR_TOKEN' $BACKEND_URL/api/auth/profile"
echo ""
echo "4. Rebuild and redeploy frontend:"
echo "   cd talentsphere-frontend"
echo "   npm run build"
echo "   # Deploy dist/ folder to your hosting"
echo ""

echo "For detailed troubleshooting, see PRODUCTION_API_FIX.md"
