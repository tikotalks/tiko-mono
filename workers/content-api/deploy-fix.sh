#!/bin/bash

echo "=== Tiko Content API Worker Deployment Fix ==="
echo ""
echo "This script will fix the 'Legacy API keys are disabled' error by updating to use service role keys."
echo ""
echo "Prerequisites:"
echo "1. You need your Supabase service role key (not the anon key)"
echo "2. Find it in your Supabase dashboard: Settings > API > service_role key"
echo ""
echo "Press Enter to continue..."
read

# Set the service key secret
echo ""
echo "Setting SUPABASE_SERVICE_KEY secret..."
echo "You'll be prompted to enter your service role key (it will be hidden)"
wrangler secret put SUPABASE_SERVICE_KEY

# Deploy the worker
echo ""
echo "Deploying the worker..."
wrangler deploy

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "The worker has been deployed with the updated authentication."
echo "The content API should now work without the 'Legacy API keys' error."
echo ""
echo "Test the deployment:"
echo "curl https://content.tikoapi.org/health"