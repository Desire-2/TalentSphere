#!/bin/bash

# Test CV Builder Quick Generate Endpoint
# This script tests the new /api/cv-builder/quick-generate endpoint

echo "🧪 Testing CV Builder Quick Generate Endpoint"
echo "=============================================="
echo ""

# Backend URL
BACKEND_URL="http://localhost:5001"

# Get authentication token (you need to replace with a valid token)
echo "⚠️  NOTE: You need a valid authentication token to test this endpoint"
echo "   Login to get a token first, then set it in the TOKEN variable below"
echo ""

# Replace this with a valid token from your session
TOKEN="${1:-your-token-here}"

if [ "$TOKEN" = "your-token-here" ]; then
    echo "❌ Please provide a valid token as the first argument:"
    echo "   ./test_cv_quick_generate.sh YOUR_TOKEN"
    exit 1
fi

# Test the quick-generate endpoint
echo "📡 Testing POST $BACKEND_URL/api/cv-builder/quick-generate"
echo ""

curl -X POST "$BACKEND_URL/api/cv-builder/quick-generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "style": "professional",
    "sections": ["summary", "work", "education", "skills"],
    "use_section_by_section": true
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || echo "Response (raw):"

echo ""
echo "=============================================="
echo "✅ Test complete"
