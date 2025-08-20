#!/bin/bash

# Setup authentication URLs for each Tiko app
# This script helps configure environment variables for proper auth redirects

echo "🔧 Setting up authentication URLs for Tiko apps..."

# Base configuration
SUPABASE_URL="https://kejvhvszhevfwgsztedf.supabase.co"
SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-your_anon_key_here}"

# App configurations
declare -A APP_URLS=(
  ["cards"]="https://tiko-cards.pages.dev"
  ["sequence"]="https://tiko-sequence.pages.dev"
  ["radio"]="https://tiko-radio.pages.dev"
  ["timer"]="https://tiko-timer.pages.dev"
  ["todo"]="https://tiko-todo.pages.dev"
  ["type"]="https://tiko-type.pages.dev"
  ["yes-no"]="https://tiko-yes-no.pages.dev"
  ["tiko"]="https://tiko.tikoapps.org"
)

# Create .env files for each app
for app in "${!APP_URLS[@]}"; do
  app_dir="apps/$app"
  if [ -d "$app_dir" ]; then
    env_file="$app_dir/.env"
    
    echo "📝 Creating $env_file..."
    
    cat > "$env_file" << EOF
# Supabase Configuration
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Site URL for Auth Redirects
VITE_SITE_URL=${APP_URLS[$app]}

# TTS Configuration (optional)
VITE_TTS_WORKER_URL=https://tts.tikoapi.org
VITE_TTS_CDN_URL=https://tts.tikocdn.org
EOF
    
    echo "✅ Created $env_file with VITE_SITE_URL=${APP_URLS[$app]}"
  fi
done

# Create admin .env
echo "📝 Creating tools/admin/.env..."
cat > "tools/admin/.env" << EOF
# Supabase Configuration
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Site URL for Auth Redirects
VITE_SITE_URL=https://tiko-admin.pages.dev
EOF

echo "
✅ Environment files created!

🚀 Next steps:

1. Update VITE_SUPABASE_ANON_KEY in each .env file with your actual key

2. Add these URLs to Supabase Dashboard (Authentication → URL Configuration → Redirect URLs):
"

# Print all callback URLs for easy copying
for app in "${!APP_URLS[@]}"; do
  echo "   ${APP_URLS[$app]}/auth/callback"
done
echo "   https://tiko-admin.pages.dev/auth/callback"
echo "   http://localhost:3000/auth/callback"
echo "   http://localhost:3001/auth/callback"
echo "   http://localhost:3002/auth/callback"
echo "   http://localhost:5000/auth/callback"

echo "
3. Choose one Site URL in Supabase Dashboard (e.g., https://tiko.tikoapps.org)

4. Add GitHub secrets for deployment:
   - CLOUDFLARE_API_TOKEN
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY

5. (Optional) Add per-app GitHub variables:
   - VITE_SITE_URL_CARDS
   - VITE_SITE_URL_SEQUENCE
   - etc.
"