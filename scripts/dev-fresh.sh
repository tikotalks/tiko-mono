#!/bin/bash

# Get the app name from the first argument
APP=$1

if [ -z "$APP" ]; then
  echo "❌ Please specify an app to run"
  echo "Usage: ./scripts/dev-fresh.sh <app-name>"
  echo "Example: ./scripts/dev-fresh.sh admin"
  exit 1
fi

echo "🧹 Clearing caches..."
node scripts/clean-cache.js

echo ""
echo "🏗️  Rebuilding packages..."
pnpm build:packages

echo ""
echo "🚀 Starting $APP with force flag..."

if [ "$APP" = "admin" ]; then
  cd tools/admin && pnpm dev --force
else
  cd "apps/$APP" && pnpm dev --force
fi