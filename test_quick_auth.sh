#!/bin/bash
API_URL="http://localhost:5001/api"

# Login and get token
echo "🔐 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"bikorimanadesire5@gmail.com","password":"password"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed"
    exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:30}..."
echo ""

# Test GET profile
echo "📍 Testing GET /api/profile/complete-profile..."
PROFILE_RESPONSE=$(curl -s -w "\nHTTP:%{http_code}" "$API_URL/profile/complete-profile" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$PROFILE_RESPONSE" | grep "HTTP:" | cut -d: -f2)
BODY=$(echo "$PROFILE_RESPONSE" | sed '/HTTP:/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ PASS: Profile retrieved successfully"
    echo "   Sections: $(echo "$BODY" | grep -o '"[^"]*":' | wc -l)"
else
    echo "❌ FAIL: HTTP $HTTP_CODE"
    echo "   Error: $(echo "$BODY" | head -c 200)"
fi
echo ""

# Test PUT profile
echo "📍 Testing PUT /api/profile/complete-profile..."
UPDATE_RESPONSE=$(curl -s -w "\nHTTP:%{http_code}" -X PUT "$API_URL/profile/complete-profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"professional_title":"Senior Software Engineer","professional_summary":"Test summary"}')

UPDATE_HTTP_CODE=$(echo "$UPDATE_RESPONSE" | grep "HTTP:" | cut -d: -f2)
UPDATE_BODY=$(echo "$UPDATE_RESPONSE" | sed '/HTTP:/d')

if [ "$UPDATE_HTTP_CODE" = "200" ]; then
    echo "✅ PASS: Profile updated successfully"
else
    echo "❌ FAIL: HTTP $UPDATE_HTTP_CODE"
    echo "   Error: $(echo "$UPDATE_BODY" | head -c 200)"
fi

echo ""
echo "✅ All tests completed!"
