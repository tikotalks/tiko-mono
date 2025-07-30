#!/bin/bash

# Cloudflare Pages Build Script
# Usage: ./scripts/cloudflare-pages-build.sh <app-name>

APP_NAME=$1

if [ -z "$APP_NAME" ]; then
  echo "Error: App name is required"
  echo "Usage: ./scripts/cloudflare-pages-build.sh <app-name>"
  exit 1
fi

echo "🚀 Cloudflare Pages Build for: $APP_NAME"

# Map app names to Nx project names
case $APP_NAME in
  "yesno")
    NX_PROJECT="yes-no"
    ;;
  *)
    NX_PROJECT="$APP_NAME"
    ;;
esac

# Run the detection script
node scripts/cloudflare-build.js $APP_NAME

# Check exit code
if [ $? -eq 0 ]; then
  echo "✅ Build detection passed, proceeding with build"
  
  # Run the actual build
  echo "🔨 Running: npx nx build $NX_PROJECT"
  npx nx build $NX_PROJECT
  
  # Exit with the build result
  exit $?
else
  echo "⏭️  Build detection indicated skip"
  exit 1
fi