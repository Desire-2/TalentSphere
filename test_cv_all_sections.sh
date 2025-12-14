#!/bin/bash

# Test CV Generation with All Sections
# This script tests that all sections are properly generated

echo "========================================="
echo "CV Builder - All Sections Test"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get token from your .env or use test token
TOKEN="${1:-your_test_token_here}"

echo "Testing CV generation with ALL sections..."
echo "Sections: summary, work, education, skills, projects, certifications, awards, references"
echo ""

# Make the API request
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST http://localhost:5001/api/cv-builder/quick-generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "style": "professional",
    "sections": ["summary", "work", "education", "skills", "projects", "certifications", "awards", "references"],
    "use_section_by_section": true
  }')

# Extract HTTP status
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo "========================================="
echo "Response Status: $HTTP_STATUS"
echo "========================================="

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Request successful!${NC}"
    echo ""
    
    # Parse and display sections generated
    echo "Checking generated sections..."
    
    # Check for each section in response
    sections=("professional_summary" "professional_experience" "education" "technical_skills" "projects" "certifications" "awards" "references")
    
    for section in "${sections[@]}"; do
        if echo "$BODY" | grep -q "\"$section\""; then
            echo -e "${GREEN}✓${NC} $section - FOUND"
        else
            echo -e "${RED}✗${NC} $section - MISSING"
        fi
    done
    
    echo ""
    echo "Progress tracking:"
    echo "$BODY" | grep -o '"progress":\[.*\]' | head -c 200
    echo "..."
    
    echo ""
    echo "Todos:"
    echo "$BODY" | grep -o '"todos":\[.*\]' | head -c 200
    echo "..."
    
else
    echo -e "${RED}❌ Request failed with status: $HTTP_STATUS${NC}"
    echo ""
    echo "Error response:"
    echo "$BODY" | head -50
fi

echo ""
echo "========================================="
echo "Full response saved to: cv_test_response.json"
echo "========================================="

# Save full response to file
echo "$BODY" | python3 -m json.tool > cv_test_response.json 2>/dev/null || echo "$BODY" > cv_test_response.json

echo ""
echo "Test complete!"
