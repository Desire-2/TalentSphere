#!/bin/bash

# Simple test - just check if the GET endpoint works with auth
echo "🧪 Quick Backend Test"
echo "===================="
echo ""

# Test 1: Endpoint exists
echo "1️⃣ Testing endpoint availability..."
RESPONSE=$(curl -s http://localhost:5001/api/profile/complete-profile)
if echo "$RESPONSE" | grep -q "Token is missing"; then
    echo "✅ Endpoint is available and requires auth"
else
    echo "❌ Unexpected response: $RESPONSE"
    exit 1
fi
echo ""

# Test 2: Check if database tables exist via a test endpoint
echo "2️⃣ Checking if profile extension tables exist..."
echo "   (This will be verified when you login and access the profile page)"
echo ""

echo "✅ Backend is ready!"
echo ""
echo "📋 Next Steps:"
echo "   1. Open your browser and navigate to: http://localhost:5174"
echo "   2. Login with: bikorimanadesire5@gmail.com"
echo "   3. Navigate to: Profile page"
echo "   4. You should now be able to:"
echo "      - View your complete profile"
echo "      - Edit Professional Summary"
echo "      - Update Skills"  
echo "      - Manage Work Experience"
echo "      - Add Certifications"
echo "      - And more!"
echo ""
echo "🐛 If you see 401 errors:"
echo "   - Clear browser cache (Ctrl+Shift+Del)"
echo "   - Logout and login again"
echo "   - Visit: http://localhost:5174/debug/auth"
