#!/bin/bash

echo "Setting up Media Cache Worker..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Create KV namespace
echo "Creating KV namespace..."
npx wrangler kv:namespace create "MEDIA_CACHE"

# The above command will output something like:
# { binding = "MEDIA_CACHE", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
# You need to copy the ID and update wrangler.toml

echo ""
echo "IMPORTANT: Update the wrangler.toml file with the KV namespace ID from above"
echo ""
echo "Next steps:"
echo "1. Update wrangler.toml with the MEDIA_CACHE_ID"
echo "2. Set the required secrets:"
echo "   npx wrangler secret put SUPABASE_URL"
echo "   npx wrangler secret put SUPABASE_SERVICE_KEY"
echo "3. Deploy the worker:"
echo "   npx wrangler deploy"