#!/bin/bash

# Install required packages for CV builder frontend features
echo "Installing CV Builder frontend dependencies..."

cd talentsphere-frontend

# Install jsPDF for PDF generation
npm install jspdf

# Install html2canvas for HTML to Canvas conversion
npm install html2canvas

echo "✓ Dependencies installed successfully!"
echo ""
echo "Installed packages:"
echo "  - jspdf: Client-side PDF generation"
echo "  - html2canvas: HTML to Canvas conversion for PDF export"
echo ""
echo "You can now use the new CV Builder with frontend rendering!"
