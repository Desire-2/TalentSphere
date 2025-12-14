#!/bin/bash

# Quick Start Script for CV Builder Testing
# Activates virtual environment and runs tests

echo "=================================================="
echo "  CV Builder Quick Start"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if we're in backend directory
if [ ! -f "src/main.py" ]; then
    echo -e "${YELLOW}Changing to backend directory...${NC}"
    cd backend 2>/dev/null || cd ../backend 2>/dev/null || {
        echo "Error: Cannot find backend directory"
        exit 1
    }
fi

# Check for virtual environment
if [ -d "venv" ]; then
    echo -e "${GREEN}✓ Activating virtual environment...${NC}"
    source venv/bin/activate
    PYTHON_CMD="python3"
else
    echo -e "${YELLOW}⚠ No virtual environment found. Using system Python.${NC}"
    PYTHON_CMD="python3"
fi

echo ""
echo -e "${BLUE}Available Commands:${NC}"
echo ""
echo "1. Run comprehensive CV builder tests"
echo "2. Start backend server"
echo "3. Check backend status"
echo "4. Exit"
echo ""
read -p "Select option (1-4): " option

case $option in
    1)
        echo ""
        echo "=================================================="
        echo "  Running CV Builder Tests"
        echo "=================================================="
        echo ""
        $PYTHON_CMD test_cv_builder_comprehensive.py
        ;;
    2)
        echo ""
        echo "=================================================="
        echo "  Starting Backend Server"
        echo "=================================================="
        echo ""
        echo "Backend will start on http://localhost:5001"
        echo "Press Ctrl+C to stop"
        echo ""
        $PYTHON_CMD src/main.py
        ;;
    3)
        echo ""
        echo "=================================================="
        echo "  Checking Backend Status"
        echo "=================================================="
        echo ""
        
        # Check if server is running
        if curl -s http://localhost:5001/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Backend server is RUNNING${NC}"
            echo ""
            echo "Health check:"
            curl -s http://localhost:5001/health | python3 -m json.tool
        else
            echo -e "${YELLOW}⚠ Backend server is NOT running${NC}"
            echo ""
            echo "To start the server:"
            echo "  $PYTHON_CMD src/main.py"
        fi
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid option. Exiting..."
        exit 1
        ;;
esac

echo ""
echo "=================================================="
echo ""
