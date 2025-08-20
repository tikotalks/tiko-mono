# Multi-App Authentication Setup

This guide explains how authentication URLs are configured for all Tiko apps.

## ✅ Simplified Setup

### 1. **Root Environment Variables**
Create a `.env` file in the root directory with shared configuration:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://kejvhvszhevfwgsztedf.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# TTS Configuration (optional)
VITE_TTS_WORKER_URL=https://tts.tikoapi.org
VITE_TTS_CDN_URL=https://tts.tikocdn.org
```

### 2. **App-Specific URLs in CI/CD**
Each app gets its own `VITE_SITE_URL` automatically during deployment:

| App | Deployment URL |
|-----|----------------|
| Timer | https://timer.tikoapps.org |
| Yes/No | https://yesno.tikoapps.org |
| Cards | https://cards.tikoapps.org |
| Radio | https://radio.tikoapps.org |
| Todo | https://todo.tikoapps.org |
| Type | https://type.tikoapps.org |
| Sequence | https://sequence.tikoapps.org |
| Admin | https://admin.tikoapps.org |

### 3. **Supabase Dashboard Configuration**

Go to your Supabase project → Authentication → URL Configuration:

1. **Site URL**: Set to your primary domain (e.g., `https://tiko.tikoapps.org`)

2. **Redirect URLs**: Add ALL these URLs:
```
https://timer.tikoapps.org/auth/callback
https://yesno.tikoapps.org/auth/callback
https://cards.tikoapps.org/auth/callback
https://radio.tikoapps.org/auth/callback
https://todo.tikoapps.org/auth/callback
https://type.tikoapps.org/auth/callback
https://sequence.tikoapps.org/auth/callback
https://admin.tikoapps.org/auth/callback
https://tiko.tikoapps.org/auth/callback
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
http://localhost:3002/auth/callback
http://localhost:5000/auth/callback
```

### 4. **GitHub Secrets Required**

Add these secrets in GitHub → Settings → Secrets and variables → Actions:

- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_TTS_WORKER_URL` - https://tts.tikoapi.org (optional)
- `VITE_TTS_CDN_URL` - https://tts.tikocdn.org (optional)

## 🚀 How It Works

1. **Shared Config**: All apps inherit Supabase credentials from GitHub secrets
2. **Dynamic URLs**: Each app gets its own `VITE_SITE_URL` during CI/CD build
3. **Auth Redirects**: Users return to the same app they started from
4. **Registration Emails**: Use the Site URL configured in Supabase

## 📝 Local Development

For local development, create a `.env` file in your app directory:

```bash
# Copy from root .env
VITE_SUPABASE_URL=https://kejvhvszhevfwgsztedf.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Set local URL
VITE_SITE_URL=http://localhost:3000
```

## 🔧 Troubleshooting

### Registration emails going to wrong URL?
- Check the "Site URL" in Supabase Dashboard
- This is what's used for email confirmations

### Login redirects working but registration isn't?
- Login uses dynamic `getAuthRedirectUrl()` 
- Registration emails use Supabase's Site URL setting

### App not redirecting properly after auth?
- Ensure the app's callback URL is in Supabase's redirect whitelist
- Check that `VITE_SITE_URL` is set correctly in deployment