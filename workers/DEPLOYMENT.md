# Cloudflare Workers Deployment Guide

## Prerequisites

1. **Cloudflare Account**: Create one at https://dash.cloudflare.com/sign-up
2. **API Token**: Generate at https://dash.cloudflare.com/profile/api-tokens
   - Use template: "Edit Cloudflare Workers"
   - Account permissions: Cloudflare Workers:Edit
   - Zone permissions: None needed

## Initial Setup

### 1. Set up Wrangler Authentication

```bash
# Option 1: Login interactively (easiest for local development)
npx wrangler login

# Option 2: Use API token (for CI/CD)
export CLOUDFLARE_API_TOKEN="your-api-token-here"
```

### 2. Get Your Account ID

```bash
# After logging in, run:
npx wrangler whoami
# Copy the account_id from the output
```

### 3. Update wrangler.toml files

Update each worker's `wrangler.toml` with your account ID:

```toml
account_id = "your-actual-account-id"
```

## Setting Secrets

Each worker needs different secrets. Set them using:

### For i18n-translator:
```bash
cd workers/i18n-translator
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_KEY
```

### For media-upload:
```bash
cd workers/media-upload
npx wrangler secret put OPENAI_API_KEY
```

### For sentence-engine:
```bash
cd workers/sentence-engine
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_KEY
```

## Manual Deployment

### Deploy all workers:
```bash
# From the root directory
cd workers
pnpm run deploy:all
```

### Deploy individual workers:
```bash
# i18n-translator
cd workers/i18n-translator
pnpm run deploy

# media-upload
cd workers/media-upload
pnpm run deploy

# sentence-engine
cd workers/sentence-engine
pnpm run deploy
```

## Automatic Deployment (GitHub Actions)

The repository is already configured for automatic deployment. You just need to add secrets to GitHub:

### 1. Go to your GitHub repository settings
### 2. Navigate to Settings > Secrets and variables > Actions
### 3. Add these repository secrets:

- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `OPENAI_API_KEY` - Your OpenAI API key
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key

### 4. How it works:
- Pushing to `master` branch triggers deployment
- Only changed workers are deployed
- Use `[build-all]` in commit message to force deploy all workers

## Custom Domains Setup

### 1. Add your domains to Cloudflare
- Go to Cloudflare dashboard
- Add `tikoapi.org` (or your domain)
- Update your domain's nameservers

### 2. Configure routes
The workers are already configured with routes:
- i18n-translator: `tikoapi.org/translate`
- media-upload: `media.tikocdn.org/*`
- sentence-engine: `tikoapi.org/sentence/*`

### 3. SSL/TLS
Cloudflare automatically provides SSL certificates.

## Verifying Deployment

After deployment, test your workers:

```bash
# Test i18n-translator
curl https://tikoapi.org/translate \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"key":"test.hello","englishTranslation":"Hello"}'

# Test sentence-engine
curl "https://tikoapi.org/sentence/predict?lang=en"

# Test media-upload
curl https://media.tikocdn.org/
```

## Monitoring

View logs and analytics in the Cloudflare dashboard:
1. Go to Workers & Pages
2. Select your worker
3. View real-time logs, metrics, and errors

## Troubleshooting

### Common Issues:

1. **Authentication error**
   ```bash
   # Re-authenticate
   npx wrangler login
   ```

2. **Route conflicts**
   - Check existing routes: `npx wrangler route list`
   - Remove conflicts in Cloudflare dashboard

3. **Secret not found**
   - List secrets: `npx wrangler secret list`
   - Re-add missing secrets

4. **Build errors**
   - Check TypeScript: `pnpm typecheck`
   - Update dependencies: `pnpm install`

## Cost Considerations

Cloudflare Workers pricing (as of 2024):
- **Free tier**: 100,000 requests/day
- **Paid tier**: $5/month for 10 million requests
- **Additional**: $0.50 per million requests

Your workers usage:
- i18n-translator: Low (only when adding new translations)
- media-upload: Medium (depends on upload frequency)
- sentence-engine: High (called frequently by users)

Consider enabling caching and rate limiting for cost optimization.