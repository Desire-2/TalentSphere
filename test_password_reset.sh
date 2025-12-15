#!/bin/bash

# Password Reset API Test Script
# Tests both forgot-password and reset-password endpoints with CORS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${1:-https://talentsphere-0oh4.onrender.com}"
FRONTEND_ORIGIN="${2:-https://jobs.afritechbridge.online}"
TEST_EMAIL="${3:-test@example.com}"

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}Password Reset API Test${NC}"
echo -e "${BLUE}==========================================${NC}"
echo -e "Backend URL: ${YELLOW}${BACKEND_URL}${NC}"
echo -e "Frontend Origin: ${YELLOW}${FRONTEND_ORIGIN}${NC}"
echo -e "Test Email: ${YELLOW}${TEST_EMAIL}${NC}"
echo ""

# Function to test forgot password endpoint
test_forgot_password() {
    echo -e "${BLUE}Test 1: Forgot Password Endpoint${NC}"
    echo "Testing: POST ${BACKEND_URL}/api/auth/forgot-password"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BACKEND_URL}/api/auth/forgot-password" \
        -H "Content-Type: application/json" \
        -H "Origin: ${FRONTEND_ORIGIN}" \
        -d "{\"email\": \"${TEST_EMAIL}\"}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    echo "HTTP Status: ${HTTP_CODE}"
    echo "Response Body: ${BODY}"
    
    # Check for CORS headers in response (if possible)
    echo ""
    echo "Checking CORS headers..."
    curl -s -I -X OPTIONS "${BACKEND_URL}/api/auth/forgot-password" \
        -H "Origin: ${FRONTEND_ORIGIN}" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" | grep -i "access-control"
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✓ Forgot password endpoint is working${NC}"
        
        # Check if response contains success field
        if echo "$BODY" | grep -q '"success".*true'; then
            echo -e "${GREEN}✓ Response indicates success${NC}"
        else
            echo -e "${YELLOW}⚠ Response doesn't contain success field${NC}"
        fi
    else
        echo -e "${RED}✗ Forgot password endpoint failed with HTTP ${HTTP_CODE}${NC}"
        return 1
    fi
    echo ""
}

# Function to test forgot password with invalid email
test_forgot_password_invalid() {
    echo -e "${BLUE}Test 2: Forgot Password with Invalid Email${NC}"
    echo "Testing: POST ${BACKEND_URL}/api/auth/forgot-password"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BACKEND_URL}/api/auth/forgot-password" \
        -H "Content-Type: application/json" \
        -H "Origin: ${FRONTEND_ORIGIN}" \
        -d '{"email": "invalid-email"}')
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    echo "HTTP Status: ${HTTP_CODE}"
    echo "Response Body: ${BODY}"
    
    if [ "$HTTP_CODE" -eq 400 ]; then
        echo -e "${GREEN}✓ Correctly rejects invalid email format${NC}"
    else
        echo -e "${YELLOW}⚠ Expected HTTP 400 for invalid email, got ${HTTP_CODE}${NC}"
    fi
    echo ""
}

# Function to test forgot password with missing data
test_forgot_password_missing_data() {
    echo -e "${BLUE}Test 3: Forgot Password with Missing Data${NC}"
    echo "Testing: POST ${BACKEND_URL}/api/auth/forgot-password"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BACKEND_URL}/api/auth/forgot-password" \
        -H "Content-Type: application/json" \
        -H "Origin: ${FRONTEND_ORIGIN}" \
        -d '{}')
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    echo "HTTP Status: ${HTTP_CODE}"
    echo "Response Body: ${BODY}"
    
    if [ "$HTTP_CODE" -eq 400 ]; then
        echo -e "${GREEN}✓ Correctly rejects missing email${NC}"
    else
        echo -e "${YELLOW}⚠ Expected HTTP 400 for missing data, got ${HTTP_CODE}${NC}"
    fi
    echo ""
}

# Function to test reset password with invalid token
test_reset_password_invalid_token() {
    echo -e "${BLUE}Test 4: Reset Password with Invalid Token${NC}"
    echo "Testing: POST ${BACKEND_URL}/api/auth/reset-password"
    
    FAKE_TOKEN="00000000-0000-0000-0000-000000000000"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BACKEND_URL}/api/auth/reset-password" \
        -H "Content-Type: application/json" \
        -H "Origin: ${FRONTEND_ORIGIN}" \
        -d "{
            \"token\": \"${FAKE_TOKEN}\",
            \"password\": \"NewPassword123\",
            \"confirm_password\": \"NewPassword123\"
        }")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    echo "HTTP Status: ${HTTP_CODE}"
    echo "Response Body: ${BODY}"
    
    if [ "$HTTP_CODE" -eq 400 ]; then
        echo -e "${GREEN}✓ Correctly rejects invalid token${NC}"
    else
        echo -e "${YELLOW}⚠ Expected HTTP 400 for invalid token, got ${HTTP_CODE}${NC}"
    fi
    echo ""
}

# Function to test reset password with weak password
test_reset_password_weak() {
    echo -e "${BLUE}Test 5: Reset Password with Weak Password${NC}"
    echo "Testing: POST ${BACKEND_URL}/api/auth/reset-password"
    
    FAKE_TOKEN="00000000-0000-0000-0000-000000000000"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BACKEND_URL}/api/auth/reset-password" \
        -H "Content-Type: application/json" \
        -H "Origin: ${FRONTEND_ORIGIN}" \
        -d "{
            \"token\": \"${FAKE_TOKEN}\",
            \"password\": \"weak\",
            \"confirm_password\": \"weak\"
        }")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    echo "HTTP Status: ${HTTP_CODE}"
    echo "Response Body: ${BODY}"
    
    if [ "$HTTP_CODE" -eq 400 ] && echo "$BODY" | grep -q "Password must"; then
        echo -e "${GREEN}✓ Correctly rejects weak password${NC}"
    else
        echo -e "${YELLOW}⚠ Expected password validation error${NC}"
    fi
    echo ""
}

# Function to test reset password with mismatched passwords
test_reset_password_mismatch() {
    echo -e "${BLUE}Test 6: Reset Password with Mismatched Passwords${NC}"
    echo "Testing: POST ${BACKEND_URL}/api/auth/reset-password"
    
    FAKE_TOKEN="00000000-0000-0000-0000-000000000000"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BACKEND_URL}/api/auth/reset-password" \
        -H "Content-Type: application/json" \
        -H "Origin: ${FRONTEND_ORIGIN}" \
        -d "{
            \"token\": \"${FAKE_TOKEN}\",
            \"password\": \"Password123\",
            \"confirm_password\": \"DifferentPassword123\"
        }")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    echo "HTTP Status: ${HTTP_CODE}"
    echo "Response Body: ${BODY}"
    
    if [ "$HTTP_CODE" -eq 400 ] && echo "$BODY" | grep -q "do not match"; then
        echo -e "${GREEN}✓ Correctly rejects mismatched passwords${NC}"
    else
        echo -e "${YELLOW}⚠ Expected password mismatch error${NC}"
    fi
    echo ""
}

# Function to test verify reset token
test_verify_reset_token() {
    echo -e "${BLUE}Test 7: Verify Reset Token${NC}"
    echo "Testing: POST ${BACKEND_URL}/api/auth/verify-reset-token"
    
    FAKE_TOKEN="00000000-0000-0000-0000-000000000000"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BACKEND_URL}/api/auth/verify-reset-token" \
        -H "Content-Type: application/json" \
        -H "Origin: ${FRONTEND_ORIGIN}" \
        -d "{\"token\": \"${FAKE_TOKEN}\"}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    echo "HTTP Status: ${HTTP_CODE}"
    echo "Response Body: ${BODY}"
    
    if [ "$HTTP_CODE" -eq 200 ] && echo "$BODY" | grep -q '"valid".*false'; then
        echo -e "${GREEN}✓ Correctly returns invalid for fake token${NC}"
    else
        echo -e "${YELLOW}⚠ Expected valid:false response${NC}"
    fi
    echo ""
}

# Run all tests
echo -e "${BLUE}Running Password Reset API Tests...${NC}"
echo ""

FAILED_TESTS=0

test_forgot_password || ((FAILED_TESTS++))
test_forgot_password_invalid || ((FAILED_TESTS++))
test_forgot_password_missing_data || ((FAILED_TESTS++))
test_reset_password_invalid_token || ((FAILED_TESTS++))
test_reset_password_weak || ((FAILED_TESTS++))
test_reset_password_mismatch || ((FAILED_TESTS++))
test_verify_reset_token || ((FAILED_TESTS++))

# Summary
echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}==========================================${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ ${FAILED_TESTS} test(s) failed${NC}"
    exit 1
fi
