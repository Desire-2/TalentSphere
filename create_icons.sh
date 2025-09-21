#!/bin/bash
# Simple script to create basic icon files for TalentSphere

PUBLIC_DIR="/home/desire/My_Project/TalentSphere/talentsphere-frontend/public"

echo "🎨 Creating missing icon files for TalentSphere..."

# Check if ImageMagick is available for icon creation
if command -v convert >/dev/null 2>&1; then
    echo "📦 Using ImageMagick to create icons..."
    
    # Create a simple blue square with white text
    cd "$PUBLIC_DIR"
    
    # Create 16x16 favicon
    if [ ! -f "favicon-16x16.png" ]; then
        convert -size 16x16 xc:"#2563eb" -gravity center -fill white -font Arial-Bold -pointsize 8 -annotate +0+0 "TS" favicon-16x16.png
        echo "  ✅ Created favicon-16x16.png"
    fi
    
    # Create 32x32 favicon
    if [ ! -f "favicon-32x32.png" ]; then
        convert -size 32x32 xc:"#2563eb" -gravity center -fill white -font Arial-Bold -pointsize 16 -annotate +0+0 "TS" favicon-32x32.png
        echo "  ✅ Created favicon-32x32.png"
    fi
    
    # Create 180x180 apple touch icon
    if [ ! -f "apple-touch-icon.png" ]; then
        convert -size 180x180 xc:"#2563eb" -gravity center -fill white -font Arial-Bold -pointsize 72 -annotate +0+0 "TS" apple-touch-icon.png
        echo "  ✅ Created apple-touch-icon.png"
    fi
    
    # Create 192x192 logo
    if [ ! -f "logo-192.png" ]; then
        convert -size 192x192 xc:"#2563eb" -gravity center -fill white -font Arial-Bold -pointsize 76 -annotate +0+0 "TS" logo-192.png
        echo "  ✅ Created logo-192.png"
    fi
    
    # Create 512x512 logo
    if [ ! -f "logo-512.png" ]; then
        convert -size 512x512 xc:"#2563eb" -gravity center -fill white -font Arial-Bold -pointsize 200 -annotate +0+0 "TS" logo-512.png
        echo "  ✅ Created logo-512.png"
    fi
    
else
    echo "⚠️  ImageMagick not found. Creating simple placeholder files..."
    
    # Create simple placeholder files by copying the existing favicon
    cd "$PUBLIC_DIR"
    
    if [ -f "favicon.ico" ]; then
        # Copy favicon.ico as base for other icons (not ideal but fixes 404s)
        [ ! -f "favicon-16x16.png" ] && cp favicon.ico favicon-16x16.png && echo "  ✅ Created favicon-16x16.png (placeholder)"
        [ ! -f "favicon-32x32.png" ] && cp favicon.ico favicon-32x32.png && echo "  ✅ Created favicon-32x32.png (placeholder)"
        [ ! -f "apple-touch-icon.png" ] && cp favicon.ico apple-touch-icon.png && echo "  ✅ Created apple-touch-icon.png (placeholder)"
        [ ! -f "logo-192.png" ] && cp favicon.ico logo-192.png && echo "  ✅ Created logo-192.png (placeholder)"
        [ ! -f "logo-512.png" ] && cp favicon.ico logo-512.png && echo "  ✅ Created logo-512.png (placeholder)"
    else
        echo "  ❌ No favicon.ico found to use as placeholder"
    fi
fi

echo "🎉 Icon creation completed!"
echo ""
echo "📁 Files in public directory:"
ls -la "$PUBLIC_DIR"