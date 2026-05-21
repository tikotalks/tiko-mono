#!/bin/bash

# Script to import translations with proper service key

echo "🌐 Translation Import Script"
echo "==========================="
echo ""
echo "This script will import all existing translations from the i18n files into the database."
echo ""
echo "🔑 Please enter your Supabase service role key:"
echo "(You can find this in Supabase Dashboard > Settings > API > service_role key)"
echo "It should start with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo ""
read -s SUPABASE_SERVICE_KEY

export SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY

# Move to script directory
cd "$(dirname "$0")"

# Run the import with Node.js (no dependencies needed)
echo ""
echo "🚀 Starting import..."
node import-translations-simple.js