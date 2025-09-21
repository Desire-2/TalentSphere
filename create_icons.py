#!/usr/bin/env python3
"""
Create missing icon files for TalentSphere frontend
This creates basic placeholder icons to fix the 404 errors
"""

import os
from PIL import Image, ImageDraw, ImageFont

def create_icon(size, filename, text="TS"):
    """Create a simple icon with text"""
    
    # Create a square image with blue background
    img = Image.new('RGBA', (size, size), color=(37, 99, 235, 255))  # Blue color #2563eb
    draw = ImageDraw.Draw(img)
    
    # Try to use a system font, fallback to default
    try:
        font_size = size // 3
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    # Get text bounding box
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Center the text
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    # Draw white text
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    
    return img

def main():
    """Create all missing icon files"""
    
    # Define the public directory
    public_dir = "/home/desire/My_Project/TalentSphere/talentsphere-frontend/public"
    
    if not os.path.exists(public_dir):
        print(f"Error: Public directory not found: {public_dir}")
        return
    
    # Icon configurations
    icons = [
        {"size": 16, "filename": "favicon-16x16.png"},
        {"size": 32, "filename": "favicon-32x32.png"},
        {"size": 180, "filename": "apple-touch-icon.png"},
        {"size": 192, "filename": "logo-192.png"},
        {"size": 512, "filename": "logo-512.png"},
    ]
    
    print("🎨 Creating missing icon files...")
    
    for icon in icons:
        filepath = os.path.join(public_dir, icon["filename"])
        
        if os.path.exists(filepath):
            print(f"  ✅ {icon['filename']} already exists")
            continue
        
        try:
            # Create icon
            img = create_icon(icon["size"], icon["filename"])
            
            # Save as PNG
            img.save(filepath, 'PNG')
            print(f"  ✅ Created {icon['filename']} ({icon['size']}x{icon['size']})")
            
        except Exception as e:
            print(f"  ❌ Failed to create {icon['filename']}: {e}")
    
    print("🎉 Icon creation completed!")

if __name__ == "__main__":
    main()