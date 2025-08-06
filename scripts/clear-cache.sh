#!/bin/bash

echo "🧹 Clearing all Vite caches in the monorepo..."

# Find and remove all .vite directories
find . -type d -name ".vite" -exec rm -rf {} + 2>/dev/null

# Find and remove all node_modules/.vite directories
find . -type d -path "*/node_modules/.vite" -exec rm -rf {} + 2>/dev/null

# Clear other common cache directories
find . -type d -name ".cache" -exec rm -rf {} + 2>/dev/null
find . -type d -name ".temp" -exec rm -rf {} + 2>/dev/null

echo "✅ All caches cleared!"
echo ""
echo "💡 Tip: You can also add this to your package.json scripts:"
echo '   "clear-cache": "sh scripts/clear-cache.sh"'
echo ""
echo "🚀 Now restart your dev server with --force flag:"
echo "   pnpm dev:admin --force"