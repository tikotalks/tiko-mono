# GitHub Secrets for Deployment

## Required Secrets

### For All Apps
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token with Pages:Edit permission
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### For Specific Apps (Optional)
- `VITE_TTS_WORKER_URL` - https://tts.tikoapi.org (for apps using TTS)
- `VITE_TTS_CDN_URL` - https://tts.tikocdn.org (for apps using TTS)

### Per-App Site URLs (Add these as GitHub Variables, not Secrets)
- `VITE_SITE_URL_CARDS` - https://tiko-cards.pages.dev
- `VITE_SITE_URL_SEQUENCE` - https://tiko-sequence.pages.dev
- `VITE_SITE_URL_RADIO` - https://tiko-radio.pages.dev
- `VITE_SITE_URL_TIMER` - https://tiko-timer.pages.dev
- `VITE_SITE_URL_TODO` - https://tiko-todo.pages.dev
- `VITE_SITE_URL_TYPE` - https://tiko-type.pages.dev
- `VITE_SITE_URL_YESNO` - https://tiko-yes-no.pages.dev
- `VITE_SITE_URL_ADMIN` - https://tiko-admin.pages.dev

## How to Add Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with its value