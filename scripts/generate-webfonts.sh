#!/bin/bash

# Script to generate WOFF and WOFF2 versions of fonts
# Requires: fonttools (pip install fonttools brotli)

echo "Generating web fonts..."

# Function to convert font
convert_font() {
    local input="$1"
    local basename=$(basename "$input" | sed 's/\.[^.]*$//')
    local dir=$(dirname "$input")
    
    echo "Converting $input..."
    
    # Generate WOFF
    if command -v pyftsubset &> /dev/null; then
        pyftsubset "$input" --output-file="$dir/$basename.woff" --flavor=woff --layout-features="*" --unicodes="*"
        echo "  ✓ Generated $basename.woff"
        
        # Generate WOFF2
        pyftsubset "$input" --output-file="$dir/$basename.woff2" --flavor=woff2 --layout-features="*" --unicodes="*"
        echo "  ✓ Generated $basename.woff2"
    else
        echo "  ⚠️  pyftsubset not found. Install with: pip install fonttools brotli"
    fi
}

# Convert Nunito fonts
for font in apps/cards/public/fonts/Nunito-*.ttf; do
    if [ -f "$font" ]; then
        convert_font "$font"
    fi
done

# Convert Yerevanyan fonts (OTF to TTF first, then to WOFF/WOFF2)
for font in apps/cards/public/fonts/Yerevanyan-*.otf; do
    if [ -f "$font" ]; then
        basename=$(basename "$font" .otf)
        dir=$(dirname "$font")
        
        # First convert OTF to TTF
        if command -v pyftsubset &> /dev/null; then
            pyftsubset "$font" --output-file="$dir/$basename.ttf" --unicodes="*" --layout-features="*"
            echo "  ✓ Converted $basename.otf to TTF"
            
            # Then convert to web fonts
            convert_font "$dir/$basename.ttf"
        fi
    fi
done

echo "Done!"