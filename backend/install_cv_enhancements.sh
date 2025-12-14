#!/bin/bash

# CV Builder Enhancement Installation Script
# Installs all required dependencies for enhanced CV builder functionality

echo "=================================================="
echo "  CV Builder Enhancement Installation"
echo "=================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detect Python command
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    PIP_CMD="pip3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    PIP_CMD="pip"
else
    echo -e "${RED}Error: Python not found!${NC}"
    echo "Please install Python 3.8 or higher."
    exit 1
fi

echo -e "${BLUE}Using Python: $PYTHON_CMD${NC}"
echo ""

# Check if we're in the correct directory
if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}Error: requirements.txt not found!${NC}"
    echo "Please run this script from the backend directory."
    exit 1
fi

# Check if virtual environment exists or should be created
VENV_DIR="venv"
USE_VENV=false

if [ -d "$VENV_DIR" ]; then
    echo -e "${GREEN}✓ Virtual environment found${NC}"
    USE_VENV=true
elif [ -f "/etc/debian_version" ] || [ -f "/etc/lsb-release" ]; then
    # Debian/Ubuntu system with PEP 668
    echo -e "${YELLOW}⚠ Detected externally-managed Python environment${NC}"
    echo -e "${BLUE}Creating virtual environment...${NC}"
    $PYTHON_CMD -m venv $VENV_DIR
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Virtual environment created${NC}"
        USE_VENV=true
    else
        echo -e "${RED}✗ Failed to create virtual environment${NC}"
        echo -e "${YELLOW}Trying with --break-system-packages flag...${NC}"
        USE_VENV=false
    fi
else
    echo -e "${BLUE}No virtual environment found. Using system Python.${NC}"
    USE_VENV=false
fi

# Set Python and pip commands based on environment
if [ "$USE_VENV" = true ]; then
    source $VENV_DIR/bin/activate
    PYTHON_CMD="$VENV_DIR/bin/python"
    PIP_CMD="$VENV_DIR/bin/pip"
    echo -e "${GREEN}✓ Virtual environment activated${NC}"
    echo ""
fi

echo "Installing backend dependencies..."
echo ""

# Install json-repair for robust JSON parsing
echo -e "${YELLOW}Installing json-repair...${NC}"
if [ "$USE_VENV" = true ]; then
    $PIP_CMD install json-repair==0.4.0
else
    $PIP_CMD install json-repair==0.4.0 --break-system-packages 2>/dev/null || \
    $PYTHON_CMD -m pip install json-repair==0.4.0 --user
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ json-repair installed successfully${NC}"
else
    echo -e "${RED}✗ Failed to install json-repair${NC}"
    echo -e "${YELLOW}This is optional but recommended for better CV generation${NC}"
fi

# Install json5 (optional fallback)
echo -e "${YELLOW}Installing json5 (optional)...${NC}"
if [ "$USE_VENV" = true ]; then
    $PIP_CMD install json5
else
    $PIP_CMD install json5 --break-system-packages 2>/dev/null || \
    $PYTHON_CMD -m pip install json5 --user
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ json5 installed successfully${NC}"
else
    echo -e "${YELLOW}⚠ json5 installation failed (optional)${NC}"
fi

# Verify Google Gemini AI package
echo -e "${YELLOW}Verifying google-genai...${NC}"
$PIP_CMD show google-genai > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ google-genai already installed${NC}"
else
    echo -e "${YELLOW}Installing google-genai...${NC}"
    if [ "$USE_VENV" = true ]; then
        $PIP_CMD install google-genai==0.3.0
    else
        $PIP_CMD install google-genai==0.3.0 --break-system-packages 2>/dev/null || \
        $PYTHON_CMD -m pip install google-genai==0.3.0 --user
    fi
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ google-genai installed successfully${NC}"
    else
        echo -e "${RED}✗ Failed to install google-genai${NC}"
        exit 1
    fi
fi

# Verify WeasyPrint
echo -e "${YELLOW}Verifying WeasyPrint...${NC}"
$PIP_CMD show weasyprint > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ WeasyPrint already installed${NC}"
else
    echo -e "${YELLOW}Installing WeasyPrint...${NC}"
    if [ "$USE_VENV" = true ]; then
        $PIP_CMD install weasyprint==63.0
    else
        $PIP_CMD install weasyprint==63.0 --break-system-packages 2>/dev/null || \
        $PYTHON_CMD -m pip install weasyprint==63.0 --user
    fi
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ WeasyPrint installed successfully${NC}"
    else
        echo -e "${YELLOW}⚠ WeasyPrint installation failed (optional for frontend PDF)${NC}"
        echo -e "${YELLOW}Note: WeasyPrint may require system dependencies${NC}"
        echo "Ubuntu/Debian: sudo apt-get install python3-cffi python3-brotli libpango-1.0-0"
        echo "macOS: brew install cairo pango gdk-pixbuf libffi"
    fi
fi

echo ""
echo "=================================================="
echo "  Verification"
echo "=================================================="
echo ""

# List installed CV builder dependencies
echo "Installed packages:"
$PIP_CMD list | grep -E "(json-repair|json5|google-genai|weasyprint)"

echo ""
echo "=================================================="
echo ""

# Check for GEMINI_API_KEY in .env
if [ -f ".env" ]; then
    if grep -q "GEMINI_API_KEY" .env; then
        if grep "GEMINI_API_KEY=" .env | grep -q "your_api_key_here"; then
            echo -e "${YELLOW}⚠ GEMINI_API_KEY found but not configured${NC}"
            echo "Please update .env with your actual API key from:"
            echo "https://makersuite.google.com/app/apikey"
        else
            echo -e "${GREEN}✓ GEMINI_API_KEY configured in .env${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ GEMINI_API_KEY not found in .env${NC}"
        echo "Add to .env file: GEMINI_API_KEY=your_actual_key_here"
        echo "Get your key from: https://makersuite.google.com/app/apikey"
    fi
else
    echo -e "${RED}✗ .env file not found${NC}"
    echo "Create .env file and add: GEMINI_API_KEY=your_actual_key_here"
fi

echo ""
echo "=================================================="
echo "  Next Steps"
echo "=================================================="
echo ""

if [ "$USE_VENV" = true ]; then
    echo -e "${BLUE}Virtual environment is active. Remember to activate it:${NC}"
    echo "  source venv/bin/activate"
    echo ""
fi

echo "1. Ensure GEMINI_API_KEY is set in .env"
echo "2. Run comprehensive tests: $PYTHON_CMD test_cv_builder_comprehensive.py"
echo "3. Start backend: $PYTHON_CMD src/main.py"
echo "4. Navigate to frontend CV Builder in browser"
echo ""

if [ "$USE_VENV" = true ]; then
    echo -e "${GREEN}✓ Installation complete! (Using virtual environment)${NC}"
else
    echo -e "${GREEN}✓ Installation complete! (Using system Python)${NC}"
fi
echo ""
