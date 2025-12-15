#!/usr/bin/env bash
# CORS Configuration Verification Script
# Tests CORS configuration for TalentSphere production deployment

set -e

echo "🔍 CORS Configuration Verification Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-https://talentsphere-0oh4.onrender.com}"
FRONTEND_DOMAINS=(
    "https://jobs.afritechbridge.online"
    "https://talentsphere.afritechbridge.online"
    "https://talent-sphere-emmz.vercel.app"
    "https://talentsphere-frontend.vercel.app"
    "https://talentsphere.vercel.app"
    "https://talentsphere-0oh4.onrender.com"
    "https://talentsphere-frontend.onrender.com"
)

# Test endpoints
TEST_ENDPOINTS=(
    "/api/auth/forgot-password"
    "/api/auth/login"
    "/api/jobs"
    "/api/scholarships"
    "/health"
)

# Function to test CORS for a specific origin and endpoint
test_cors() {
    local origin=$1
    local endpoint=$2
    local url="${BACKEND_URL}${endpoint}"
    
    echo -e "${BLUE}Testing${NC}: ${origin} → ${endpoint}"
    
    # Test OPTIONS (preflight) request
    response=$(curl -s -I -X OPTIONS \
        -H "Origin: ${origin}" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type,Authorization" \
        "${url}" 2>&1 || echo "CURL_ERROR")
    
    if [[ "$response" == "CURL_ERROR" ]] || [[ -z "$response" ]]; then
        echo -e "  ${RED}✗ Failed${NC} - Could not connect to server"
        return 1
    fi
    
    # Check for CORS headers
    if echo "$response" | grep -qi "Access-Control-Allow-Origin"; then
        allowed_origin=$(echo "$response" | grep -i "Access-Control-Allow-Origin" | cut -d' ' -f2- | tr -d '\r')
        
        if [[ "$allowed_origin" == "$origin" ]] || [[ "$allowed_origin" == "*" ]]; then
            echo -e "  ${GREEN}✓ Passed${NC} - CORS headers present"
            echo -e "    Allow-Origin: ${allowed_origin}"
            
            # Check for credentials support
            if echo "$response" | grep -qi "Access-Control-Allow-Credentials: true"; then
                echo -e "    Credentials: ${GREEN}✓ Enabled${NC}"
            else
                echo -e "    Credentials: ${YELLOW}⚠ Not enabled${NC}"
            fi
            
            # Check allowed methods
            if echo "$response" | grep -qi "Access-Control-Allow-Methods"; then
                methods=$(echo "$response" | grep -i "Access-Control-Allow-Methods" | cut -d' ' -f2- | tr -d '\r')
                echo -e "    Methods: ${methods}"
            fi
            
            return 0
        else
            echo -e "  ${RED}✗ Failed${NC} - Wrong origin in header"
            echo -e "    Expected: ${origin}"
            echo -e "    Got: ${allowed_origin}"
            return 1
        fi
    else
        echo -e "  ${RED}✗ Failed${NC} - No CORS headers found"
        echo -e "    Response headers:"
        echo "$response" | head -10 | sed 's/^/      /'
        return 1
    fi
}

# Function to check .env file
check_env_file() {
    echo -e "${BLUE}Checking .env file...${NC}"
    
    if [[ ! -f "backend/.env" ]]; then
        echo -e "${RED}✗ .env file not found${NC}"
        return 1
    fi
    
    cors_origins=$(grep "^CORS_ORIGINS=" backend/.env | cut -d'=' -f2)
    
    if [[ -z "$cors_origins" ]]; then
        echo -e "${RED}✗ CORS_ORIGINS not set in .env${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ .env file found${NC}"
    echo -e "  CORS_ORIGINS value:"
    echo "$cors_origins" | tr ',' '\n' | sed 's/^/    - /'
    
    # Check for duplicates
    duplicate_count=$(echo "$cors_origins" | tr ',' '\n' | sort | uniq -d | wc -l)
    if [[ $duplicate_count -gt 0 ]]; then
        echo -e "${YELLOW}⚠ Warning: Duplicate origins found:${NC}"
        echo "$cors_origins" | tr ',' '\n' | sort | uniq -d | sed 's/^/    - /'
    else
        echo -e "${GREEN}✓ No duplicate origins${NC}"
    fi
    
    echo ""
}

# Function to check render.yaml
check_render_yaml() {
    echo -e "${BLUE}Checking render.yaml...${NC}"
    
    if [[ ! -f "backend/render.yaml" ]]; then
        echo -e "${YELLOW}⚠ render.yaml not found (OK if not using Render)${NC}"
        return 0
    fi
    
    cors_line=$(grep -A1 "key: CORS_ORIGINS" backend/render.yaml | grep "value:" | sed 's/.*value: *"\(.*\)".*/\1/')
    
    if [[ -z "$cors_line" ]]; then
        echo -e "${RED}✗ CORS_ORIGINS not set in render.yaml${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ render.yaml found${NC}"
    echo -e "  CORS_ORIGINS value:"
    echo "$cors_line" | tr ',' '\n' | sed 's/^/    - /'
    
    echo ""
}

# Function to check if files are in sync
check_sync() {
    echo -e "${BLUE}Checking configuration sync...${NC}"
    
    if [[ ! -f "backend/.env" ]] || [[ ! -f "backend/render.yaml" ]]; then
        echo -e "${YELLOW}⚠ Cannot check sync - missing files${NC}"
        echo ""
        return 0
    fi
    
    env_origins=$(grep "^CORS_ORIGINS=" backend/.env | cut -d'=' -f2 | tr ',' '\n' | sort | tr '\n' ',' | sed 's/,$//')
    yaml_origins=$(grep -A1 "key: CORS_ORIGINS" backend/render.yaml | grep "value:" | sed 's/.*value: *"\(.*\)".*/\1/' | tr ',' '\n' | sort | tr '\n' ',' | sed 's/,$//')
    
    if [[ "$env_origins" == "$yaml_origins" ]]; then
        echo -e "${GREEN}✓ .env and render.yaml are in sync${NC}"
    else
        echo -e "${YELLOW}⚠ Warning: .env and render.yaml have different CORS_ORIGINS${NC}"
        echo -e "  This is OK if intentional (different configs for local vs production)"
        echo ""
        echo -e "  ${BLUE}Domains only in .env:${NC}"
        comm -23 <(echo "$env_origins" | tr ',' '\n' | sort) <(echo "$yaml_origins" | tr ',' '\n' | sort) | sed 's/^/    - /'
        echo ""
        echo -e "  ${BLUE}Domains only in render.yaml:${NC}"
        comm -13 <(echo "$env_origins" | tr ',' '\n' | sort) <(echo "$yaml_origins" | tr ',' '\n' | sort) | sed 's/^/    - /'
    fi
    
    echo ""
}

# Function to test server health
test_server_health() {
    echo -e "${BLUE}Testing server health...${NC}"
    
    response=$(curl -s -w "\n%{http_code}" "${BACKEND_URL}/health" 2>&1 || echo "ERROR")
    
    if [[ "$response" == "ERROR" ]]; then
        echo -e "${RED}✗ Cannot connect to server${NC}"
        echo -e "  URL: ${BACKEND_URL}"
        echo -e "  ${YELLOW}Note: Server might be down or URL incorrect${NC}"
        return 1
    fi
    
    http_code=$(echo "$response" | tail -1)
    
    if [[ "$http_code" == "200" ]]; then
        echo -e "${GREEN}✓ Server is healthy${NC}"
        echo -e "  URL: ${BACKEND_URL}"
        return 0
    else
        echo -e "${YELLOW}⚠ Server responded with HTTP ${http_code}${NC}"
        echo -e "  URL: ${BACKEND_URL}"
        return 1
    fi
    
    echo ""
}

# Main execution
main() {
    echo "Backend URL: ${BACKEND_URL}"
    echo "Testing ${#FRONTEND_DOMAINS[@]} frontend domains"
    echo "Testing ${#TEST_ENDPOINTS[@]} endpoints"
    echo ""
    
    # Check local configuration files
    echo "═══════════════════════════════════════════"
    echo "1. LOCAL CONFIGURATION CHECK"
    echo "═══════════════════════════════════════════"
    echo ""
    
    check_env_file
    check_render_yaml
    check_sync
    
    # Test server health
    echo "═══════════════════════════════════════════"
    echo "2. SERVER HEALTH CHECK"
    echo "═══════════════════════════════════════════"
    echo ""
    
    if ! test_server_health; then
        echo ""
        echo -e "${RED}⚠ Cannot proceed with CORS tests - server is not accessible${NC}"
        echo ""
        echo "Possible reasons:"
        echo "  1. Server is not running"
        echo "  2. URL is incorrect: ${BACKEND_URL}"
        echo "  3. Network connectivity issues"
        echo ""
        echo "To test with a different URL, run:"
        echo "  BACKEND_URL=https://your-backend.com ./verify_cors.sh"
        echo ""
        exit 1
    fi
    
    # Test CORS for each domain and endpoint
    echo ""
    echo "═══════════════════════════════════════════"
    echo "3. CORS PREFLIGHT TESTS"
    echo "═══════════════════════════════════════════"
    echo ""
    
    total_tests=0
    passed_tests=0
    failed_tests=0
    
    for domain in "${FRONTEND_DOMAINS[@]}"; do
        echo ""
        echo -e "${YELLOW}Testing origin: ${domain}${NC}"
        echo "-------------------------------------------"
        
        for endpoint in "${TEST_ENDPOINTS[@]}"; do
            total_tests=$((total_tests + 1))
            
            if test_cors "$domain" "$endpoint"; then
                passed_tests=$((passed_tests + 1))
            else
                failed_tests=$((failed_tests + 1))
            fi
            
            echo ""
        done
    done
    
    # Summary
    echo ""
    echo "═══════════════════════════════════════════"
    echo "4. SUMMARY"
    echo "═══════════════════════════════════════════"
    echo ""
    echo "Total tests: ${total_tests}"
    echo -e "Passed: ${GREEN}${passed_tests}${NC}"
    echo -e "Failed: ${RED}${failed_tests}${NC}"
    echo ""
    
    if [[ $failed_tests -eq 0 ]]; then
        echo -e "${GREEN}✓ All CORS tests passed!${NC}"
        echo ""
        echo "Your CORS configuration is working correctly."
        echo "All production domains can access the backend API."
        exit 0
    else
        echo -e "${RED}✗ Some CORS tests failed${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Check that CORS_ORIGINS in render.yaml includes all domains"
        echo "  2. Verify Render environment variables match render.yaml"
        echo "  3. Ensure backend has been redeployed after changes"
        echo "  4. Check backend logs for CORS origins list on startup"
        echo ""
        echo "See CORS_CONFIGURATION_FIX.md for detailed troubleshooting"
        exit 1
    fi
}

# Run main function
main
