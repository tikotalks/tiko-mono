#!/bin/bash

echo "=== Copying secrets from i18n-data to content-api ==="
echo ""
echo "This script will help copy the working secrets from i18n-data worker to content-api worker."
echo ""
echo "Since we can't directly read secrets from Cloudflare, you'll need to:"
echo ""
echo "1. Go to Cloudflare Dashboard (https://dash.cloudflare.com)"
echo "2. Navigate to Workers & Pages"
echo "3. Click on 'i18n-data' worker"
echo "4. Go to Settings > Variables and Secrets"
echo "5. Copy the SUPABASE_SERVICE_KEY value"
echo "6. Come back here and paste it when prompted"
echo ""
echo "Press Enter to continue..."
read

# Set the service key secret
echo ""
echo "Now setting SUPABASE_SERVICE_KEY for content-api worker..."
echo "Paste the service key and press Enter:"
wrangler secret put SUPABASE_SERVICE_KEY

echo ""
echo "=== Secret set! ==="
echo ""
echo "The content-api worker should now work properly."
echo "The marketing website will automatically use the worker instead of direct Supabase calls."