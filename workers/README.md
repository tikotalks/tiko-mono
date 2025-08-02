# Tiko Cloudflare Workers

This directory contains all Cloudflare Workers for the Tiko platform.

## Workers

### 🌐 i18n-translator
Translates UI text to multiple languages using GPT-4 and stores in database.
- **Endpoint**: `https://tikoapi.org/translate`
- **Purpose**: Automated translation management

### 📸 media-upload
Handles media uploads with AI-powered image analysis.
- **Endpoint**: `https://media.tikocdn.org/*`
- **Purpose**: Media storage and analysis

### 💬 sentence-engine
Provides intelligent word predictions for kids' sentence building.
- **Endpoint**: `https://tikoapi.org/sentence/*`
- **Purpose**: AAC communication assistance

## Deployment

### 🚀 Automatic Deployment (Recommended)

Workers are automatically deployed when you push to the `master` branch via GitHub Actions.

**Setup (one-time)**:

1. **Add GitHub Secret**:
   - Go to GitHub repo → Settings → Secrets → Actions
   - Add `CLOUDFLARE_API_TOKEN` ([Create here](https://dash.cloudflare.com/profile/api-tokens))

2. **Set Worker Secrets in Cloudflare**:
   ```bash
   # Login once
   npx wrangler login
   
   # Set secrets for each worker
   cd workers/[worker-name]
   npx wrangler secret put OPENAI_API_KEY --env production
   # ... other secrets as needed
   ```
   
   See [detailed guide](./GITHUB_DEPLOYMENT.md) for all secrets.

**Deploy**:
```bash
git add .
git commit -m "feat: update worker"
git push origin master
```

That's it! Check the Actions tab on GitHub to monitor deployment.

### Manual Deployment (Development Only)

For testing or emergency deployments:
```bash
# Set environment variable
export CLOUDFLARE_API_TOKEN="your-token"

# Deploy a specific worker
cd workers/[worker-name]
npx wrangler deploy --env production
```

**Note**: Account ID is already configured in each worker's `wrangler.toml`.

## Development

Run workers locally:
```bash
# Run all workers in dev mode
pnpm run dev

# Run individual workers
cd i18n-translator && pnpm run dev
cd media-upload && pnpm run dev
cd sentence-engine && pnpm run dev
```

## Required Secrets

### All Workers
- `OPENAI_API_KEY` - Your OpenAI API key

### i18n-translator & sentence-engine
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key

### Setting Secrets
```bash
cd [worker-directory]
npx wrangler secret put SECRET_NAME
# Enter the secret value when prompted
```

## Automatic Deployment

The workers are automatically deployed when you push to the `master` branch. 

Required GitHub secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

## Architecture

```
workers/
├── i18n-translator/     # Translation service
├── media-upload/        # Media handling with R2
├── sentence-engine/     # Sentence prediction
├── package.json         # Workspace scripts
├── setup-workers.sh     # Setup script
└── DEPLOYMENT.md        # Detailed deployment guide
```

## Troubleshooting

### Authentication Issues
```bash
# Re-login to Cloudflare
npx wrangler logout
npx wrangler login
```

### Check Worker Logs
```bash
# Tail logs for a worker
cd [worker-directory]
npx wrangler tail
```

### List Secrets
```bash
cd [worker-directory]
npx wrangler secret list
```

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Detailed Deployment Guide](./DEPLOYMENT.md)