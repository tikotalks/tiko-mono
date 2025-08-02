#!/bin/bash

echo "🚀 Cloudflare Workers Setup Script"
echo "================================="
echo ""

# Check if wrangler is logged in
if ! npx wrangler whoami &> /dev/null; then
    echo "❌ You're not logged in to Cloudflare"
    echo "Please run: npx wrangler login"
    exit 1
fi

echo "✅ Logged in to Cloudflare"
echo ""

# Get account ID
ACCOUNT_ID=$(npx wrangler whoami | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "📋 Your Account ID: $ACCOUNT_ID"
echo ""

# Function to set secrets for a worker
set_worker_secrets() {
    local worker_name=$1
    shift
    local secrets=("$@")
    
    echo "🔐 Setting secrets for $worker_name..."
    cd $worker_name
    
    for secret in "${secrets[@]}"; do
        echo -n "Enter value for $secret: "
        read -s secret_value
        echo ""
        echo "$secret_value" | npx wrangler secret put $secret
    done
    
    cd ..
    echo "✅ Secrets set for $worker_name"
    echo ""
}

# Ask if user wants to update wrangler.toml files
echo "Would you like to update wrangler.toml files with your account ID? (y/n)"
read -n 1 update_config
echo ""

if [[ $update_config == "y" ]]; then
    for worker in i18n-translator media-upload sentence-engine; do
        if [[ -f "$worker/wrangler.toml" ]]; then
            # Add account_id after compatibility_date
            sed -i.bak "/compatibility_date/a\\
account_id = \"$ACCOUNT_ID\"" "$worker/wrangler.toml"
            rm "$worker/wrangler.toml.bak"
            echo "✅ Updated $worker/wrangler.toml"
        fi
    done
    echo ""
fi

# Ask if user wants to set secrets
echo "Would you like to set secrets for the workers? (y/n)"
read -n 1 set_secrets
echo ""

if [[ $set_secrets == "y" ]]; then
    echo ""
    echo "Setting up secrets for each worker..."
    echo ""
    
    # Get OpenAI API key (used by all workers)
    echo -n "Enter your OpenAI API key (used by all workers): "
    read -s OPENAI_KEY
    echo ""
    
    # Get Supabase credentials (used by i18n and sentence)
    echo -n "Enter your Supabase URL: "
    read SUPABASE_URL
    echo ""
    
    echo -n "Enter your Supabase Service Key: "
    read -s SUPABASE_KEY
    echo ""
    
    # Set secrets for each worker
    echo "🔐 Setting secrets for i18n-translator..."
    cd i18n-translator
    echo "$OPENAI_KEY" | npx wrangler secret put OPENAI_API_KEY
    echo "$SUPABASE_URL" | npx wrangler secret put SUPABASE_URL
    echo "$SUPABASE_KEY" | npx wrangler secret put SUPABASE_SERVICE_KEY
    cd ..
    
    echo "🔐 Setting secrets for media-upload..."
    cd media-upload
    echo "$OPENAI_KEY" | npx wrangler secret put OPENAI_API_KEY
    cd ..
    
    echo "🔐 Setting secrets for sentence-engine..."
    cd sentence-engine
    echo "$OPENAI_KEY" | npx wrangler secret put OPENAI_API_KEY
    echo "$SUPABASE_URL" | npx wrangler secret put SUPABASE_URL
    echo "$SUPABASE_KEY" | npx wrangler secret put SUPABASE_SERVICE_KEY
    cd ..
    
    echo ""
    echo "✅ All secrets have been set!"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "You can now deploy your workers:"
echo "  pnpm run deploy:all         - Deploy all workers"
echo "  pnpm run deploy:i18n        - Deploy i18n-translator"
echo "  pnpm run deploy:media       - Deploy media-upload"
echo "  pnpm run deploy:sentence    - Deploy sentence-engine"
echo ""
echo "For automatic deployment, add these secrets to GitHub:"
echo "  - CLOUDFLARE_API_TOKEN"
echo "  - CLOUDFLARE_ACCOUNT_ID ($ACCOUNT_ID)"
echo "  - OPENAI_API_KEY"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_SERVICE_KEY"