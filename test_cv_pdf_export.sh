#!/bin/bash
# Quick Test Script for CV PDF Export Fix

echo "=================================="
echo "CV PDF Export Fix - Test Guide"
echo "=================================="
echo ""

echo "1. Starting frontend..."
cd talentsphere-frontend
npm run dev &
FRONTEND_PID=$!
echo "   Frontend started (PID: $FRONTEND_PID)"
echo ""

sleep 5

echo "2. Test Steps:"
echo "   ✓ Navigate to: http://localhost:5173/cv-builder"
echo "   ✓ Generate a CV (select Professional template for best gradient test)"
echo "   ✓ Click 'Download PDF' button"
echo "   ✓ Wait for print preview (0.5-2 seconds)"
echo "   ✓ Verify gradients show in print preview:"
echo "     • Header: Blue to indigo gradient"
echo "     • Section accents: Blue gradient bars"
echo "     • Skill cards: Light blue backgrounds"
echo "   ✓ Save as PDF"
echo "   ✓ Open saved PDF and verify design matches screen"
echo ""

echo "3. What to Check:"
echo "   ✅ Header gradient (blue to indigo)"
echo "   ✅ Section border colors (blue accents)"
echo "   ✅ Background highlights (light blue)"
echo "   ✅ Text colors (black/gray/blue)"
echo "   ✅ Skill tags (colored backgrounds)"
echo "   ✅ Icons (if any, should be visible)"
echo "   ✅ Overall layout (should match screen)"
echo ""

echo "4. Expected Behavior:"
echo "   • Print window opens automatically"
echo "   • Brief pause (0.5-2s) while styles load"
echo "   • Print dialog shows automatically"
echo "   • PDF has full colors and gradients"
echo "   • Window closes after print/cancel"
echo ""

echo "5. Troubleshooting:"
echo "   If gradients don't show:"
echo "   • Enable 'Print backgrounds' in print dialog"
echo "   • Try Chrome/Edge (best support)"
echo "   • Check browser allows popups"
echo "   • Wait longer (styles may be loading)"
echo ""

echo "Press Ctrl+C to stop frontend when done testing"
wait $FRONTEND_PID
