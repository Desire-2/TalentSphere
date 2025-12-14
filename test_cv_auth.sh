#!/bin/bash
# Test CV Builder Authentication Flow

echo "Testing CV Builder Authentication..."
echo "======================================"

# First, login to get a valid token
echo -e "\n1. Logging in as test user..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@email.com",
    "password": "password123"
  }')

echo "Login response: $LOGIN_RESPONSE"

# Extract token (simple jq alternative using python)
TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  exit 1
fi

echo "✅ Got token: ${TOKEN:0:20}..."

# Test CV generation with valid token
echo -e "\n2. Testing CV generation with valid token..."
CV_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:5001/api/cv-builder/quick-generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "style": "professional",
    "sections": ["summary", "work", "education", "skills"],
    "use_section_by_section": true
  }')

# Split response and status code
HTTP_CODE=$(echo "$CV_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$CV_RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo "Response: $RESPONSE_BODY" | head -c 500
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ CV generation successful!"
  
  # Check if response has expected fields
  if echo "$RESPONSE_BODY" | grep -q '"success".*true'; then
    echo "✅ Response has success field"
  fi
  
  if echo "$RESPONSE_BODY" | grep -q '"cv_content"'; then
    echo "✅ Response has cv_content field"
  fi
  
  if echo "$RESPONSE_BODY" | grep -q '"progress"'; then
    echo "✅ Response has progress field"
  fi
  
  if echo "$RESPONSE_BODY" | grep -q '"todos"'; then
    echo "✅ Response has todos field"
  fi
else
  echo "❌ CV generation failed"
fi

# Test through Vite proxy
echo -e "\n3. Testing through Vite proxy (http://localhost:5173)..."
PROXY_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:5173/api/cv-builder/quick-generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "style": "professional",
    "sections": ["summary", "work", "education", "skills"],
    "use_section_by_section": true
  }')

PROXY_HTTP_CODE=$(echo "$PROXY_RESPONSE" | tail -n1)
PROXY_RESPONSE_BODY=$(echo "$PROXY_RESPONSE" | head -n-1)

echo "HTTP Status: $PROXY_HTTP_CODE"
echo "Response: $PROXY_RESPONSE_BODY" | head -c 200
echo ""

if [ "$PROXY_HTTP_CODE" = "200" ]; then
  echo "✅ Proxy request successful!"
else
  echo "❌ Proxy request failed"
fi

echo -e "\n======================================"
echo "Authentication Test Complete"
