#!/bin/bash

# Script to create _redirects and _headers files for all apps

# Define the apps
apps=("cards" "radio" "timer" "todo" "type" "ui-docs" "yes-no" "tiko")

# Define redirects content
redirects_content="/*    /index.html   200"

# Define headers content
headers_content="/assets/*
  Cache-Control: max-age=31536000, immutable

/*.js
  Cache-Control: max-age=31536000, immutable

/*.css
  Cache-Control: max-age=31536000, immutable"

# Create files for each app
for app in "${apps[@]}"; do
  app_dir="apps/$app"
  
  if [ -d "$app_dir" ]; then
    echo "Setting up Cloudflare files for $app..."
    
    # Create public directory if it doesn't exist
    mkdir -p "$app_dir/public"
    
    # Create _redirects file
    echo "$redirects_content" > "$app_dir/public/_redirects"
    echo "  ✅ Created $app_dir/public/_redirects"
    
    # Create _headers file  
    echo "$headers_content" > "$app_dir/public/_headers"
    echo "  ✅ Created $app_dir/public/_headers"
  else
    echo "  ⚠️  App directory $app_dir not found"
  fi
done

# Create files for admin tool
admin_dir="tools/admin"
if [ -d "$admin_dir" ]; then
  echo "Setting up Cloudflare files for admin tool..."
  
  mkdir -p "$admin_dir/public"
  
  echo "$redirects_content" > "$admin_dir/public/_redirects"
  echo "  ✅ Created $admin_dir/public/_redirects"
  
  echo "$headers_content" > "$admin_dir/public/_headers"
  echo "  ✅ Created $admin_dir/public/_headers"
fi

echo ""
echo "✅ Cloudflare setup complete!"
echo ""
echo "Next steps:"
echo "1. Commit these changes"
echo "2. Set up each app as a Cloudflare Pages project"
echo "3. Use the build commands from cloudflare-pages.md"