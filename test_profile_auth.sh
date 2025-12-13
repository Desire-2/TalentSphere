#!/bin/bash

# Test script to verify profile authentication and endpoints

API_URL="http://localhost:5001/api"
echo "🧪 Testing TalentSphere Profile Authentication"
echo "=============================================="
echo ""

# Test 1: Check if endpoint exists (should fail with 401)
echo "📍 Test 1: Testing endpoint without auth (should return 401)..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/profile/complete-profile")
HTTP_CODE=$(echo "$RESPONSE" | grep HTTP_CODE | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ PASS: Endpoint requires authentication (401)"
    echo "   Response: $BODY"
else
    echo "❌ FAIL: Expected 401, got $HTTP_CODE"
    echo "   Response: $BODY"
fi
echo ""

# Test 2: Try to login and get token
echo "📍 Test 2: Attempting to login..."
echo "   Please enter job seeker credentials:"
read -p "   Email: " EMAIL
read -sp "   Password: " PASSWORD
echo ""

LOGIN_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

LOGIN_HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep HTTP_CODE | cut -d: -f2)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '/HTTP_CODE/d')

if [ "$LOGIN_HTTP_CODE" = "200" ]; then
    echo "✅ PASS: Login successful"
    
    # Extract token
    TOKEN=$(echo "$LOGIN_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$TOKEN" ]; then
        echo "   Token obtained (${#TOKEN} chars): ${TOKEN:0:30}..."
        echo ""
        
        # Test 3: Access profile with token
        echo "📍 Test 3: Accessing profile with valid token..."
        PROFILE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/profile/complete-profile" \
          -H "Authorization: Bearer $TOKEN")
        
        PROFILE_HTTP_CODE=$(echo "$PROFILE_RESPONSE" | grep HTTP_CODE | cut -d: -f2)
        PROFILE_BODY=$(echo "$PROFILE_RESPONSE" | sed '/HTTP_CODE/d')
        
        if [ "$PROFILE_HTTP_CODE" = "200" ]; then
            echo "✅ PASS: Profile data retrieved successfully"
            echo "   Profile sections:"
            echo "$PROFILE_BODY" | grep -o '"[^"]*":' | sed 's/://g' | sed 's/"//g' | head -10
        else
            echo "❌ FAIL: Expected 200, got $PROFILE_HTTP_CODE"
            echo "   Response: $PROFILE_BODY"
        fi
        echo ""
        
        # Test 4: Update profile
        echo "📍 Test 4: Testing profile update (PUT)..."
        UPDATE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PUT "$API_URL/profile/complete-profile" \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json" \
          -d '{"professional_title":"Test Title"}')
        
        UPDATE_HTTP_CODE=$(echo "$UPDATE_RESPONSE" | grep HTTP_CODE | cut -d: -f2)
        UPDATE_BODY=$(echo "$UPDATE_RESPONSE" | sed '/HTTP_CODE/d')
        
        if [ "$UPDATE_HTTP_CODE" = "200" ]; then
            echo "✅ PASS: Profile update successful"
            echo "   Response: $UPDATE_BODY"
        else
            echo "❌ FAIL: Expected 200, got $UPDATE_HTTP_CODE"
            echo "   Response: $UPDATE_BODY"
        fi
        
    else
        echo "❌ FAIL: No token found in response"
        echo "   Response: $LOGIN_BODY"
    fi
else
    echo "❌ FAIL: Login failed with code $LOGIN_HTTP_CODE"
    echo "   Response: $LOGIN_BODY"
    echo ""
    echo "💡 Tips:"
    echo "   - Make sure the email and password are correct"
    echo "   - Make sure the user has 'job_seeker' role"
    echo "   - Check backend logs for more details"
fi

echo ""
echo "=============================================="
echo "🏁 Testing complete"
