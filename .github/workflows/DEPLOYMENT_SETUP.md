# Deployment Setup Guide

This guide explains how to set up automatic deployments for all Tiko projects via GitHub Actions.

## Overview

Each part of the Tiko monorepo deploys independently:
- **Workers** → Cloudflare Workers
- **Apps** → Netlify (timer, cards, radio, todo)
- **Marketing Website** → Netlify
- **Admin Tool** → Netlify

## Required GitHub Secrets

### For Cloudflare Workers
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token

### For Netlify Deployments
- `NETLIFY_AUTH_TOKEN` - Your Netlify personal access token
- `NETLIFY_TIMER_SITE_ID` - Timer app site ID
- `NETLIFY_CARDS_SITE_ID` - Cards app site ID
- `NETLIFY_RADIO_SITE_ID` - Radio app site ID
- `NETLIFY_TODO_SITE_ID` - Todo app site ID
- `NETLIFY_MARKETING_SITE_ID` - Marketing website site ID
- `NETLIFY_ADMIN_SITE_ID` - Admin tool site ID

### For Supabase (used by apps)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Setup Instructions

### 1. Get Netlify Auth Token
1. Go to https://app.netlify.com/user/applications#personal-access-tokens
2. Click "New access token"
3. Give it a name like "GitHub Actions"
4. Copy the token

### 2. Create Netlify Sites
For each app/website, either:

**Option A: Create manually in Netlify**
1. Go to Netlify dashboard
2. Click "Add new site" → "Deploy manually"
3. Drag any folder to create the site
4. Go to Site settings → General → Site details
5. Copy the Site ID

**Option B: Use Netlify CLI**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Create sites
cd apps/timer && netlify sites:create --name tiko-timer
cd apps/cards && netlify sites:create --name tiko-cards
cd apps/radio && netlify sites:create --name tiko-radio
cd apps/todo && netlify sites:create --name tiko-todo
cd websites/marketing && netlify sites:create --name tiko-marketing
cd tools/admin && netlify sites:create --name tiko-admin

# List sites to get IDs
netlify sites:list
```

### 3. Add Secrets to GitHub
1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add each secret from the list above

### 4. Link Custom Domains (Optional)
In Netlify dashboard for each site:
1. Go to Domain settings
2. Add custom domain
3. Follow DNS configuration instructions

## How It Works

### Automatic Deployment Triggers
- **Workers**: Deploy when files in `workers/**` change
- **Apps**: Deploy when files in `apps/**` or `packages/**` change
- **Marketing**: Deploy when files in `websites/marketing/**` change
- **Admin**: Deploy when files in `tools/admin/**` change

### Manual Deployment Triggers via Commit Messages

#### Force Builds
Add these to your commit message to force deployments:
- `[build:all]` - Forces ALL projects to build and deploy
- `[build:apps]` - Forces all apps to deploy
- `[build:workers]` - Forces all workers to deploy
- `[build:websites]` - Forces all websites to deploy
- `[build:tools]` - Forces all tools to deploy

#### Force Specific Deployments
- `[build:timer]` - Deploy timer app only
- `[build:cards]` - Deploy cards app only
- `[build:radio]` - Deploy radio app only
- `[build:todo]` - Deploy todo app only
- `[build:marketing]` - Deploy marketing website only
- `[build:admin]` - Deploy admin tool only
- `[build:i18n-translator]` - Deploy i18n translator worker only
- `[build:media-upload]` - Deploy media upload worker only
- `[build:sentence-engine]` - Deploy sentence engine worker only

#### Skip Deployments
Add these to skip deployments even if files changed:
- `[skip-ci]` - Skip ALL deployments
- `[skip:apps]` - Skip all app deployments
- `[skip:workers]` - Skip all worker deployments
- `[skip:websites]` - Skip all website deployments
- `[skip:tools]` - Skip all tool deployments
- `[skip:timer]` - Skip timer app deployment
- `[skip:cards]` - Skip cards app deployment
- `[skip:radio]` - Skip radio app deployment
- `[skip:todo]` - Skip todo app deployment
- `[skip:marketing]` - Skip marketing website deployment
- `[skip:admin]` - Skip admin tool deployment

### Build Process
1. GitHub Actions runs on push to master
2. Only affected projects are built and deployed
3. Dependencies (packages/ui, packages/core) are built first
4. Each deployment runs in parallel for speed

## Testing Deployments

After setup, test by making a small change:

```bash
# Test workers deployment
echo "# Test" >> workers/README.md
git add . && git commit -m "test: workers deployment" && git push

# Test timer app deployment
echo "# Test" >> apps/timer/README.md
git add . && git commit -m "test: timer deployment" && git push

# Force deploy all apps without changes
git commit --allow-empty -m "chore: force deploy [build:apps]"
git push

# Force deploy specific worker
git commit --allow-empty -m "fix: update config [build:i18n-translator]"
git push

# Skip CI for documentation changes
echo "# Docs update" >> README.md
git add . && git commit -m "docs: update readme [skip-ci]" && git push
```

## Monitoring

- **GitHub Actions**: Check Actions tab for deployment status
- **Netlify**: Check Netlify dashboard for deployment logs
- **Cloudflare**: Check Workers & Pages for worker status

## Environment Variables

### Build-time Variables (Vite apps)
Set in GitHub secrets with `VITE_` prefix:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Runtime Variables (Workers)
Set directly in Cloudflare Workers:
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

## Troubleshooting

### Build Failures
- Check GitHub Actions logs for specific errors
- Ensure all dependencies are properly installed
- Verify environment variables are set

### Deployment Failures
- Check Netlify/Cloudflare logs
- Verify API tokens have correct permissions
- Ensure site IDs match actual Netlify sites

### Common Issues
1. **"Site not found"** - Wrong NETLIFY_SITE_ID
2. **"Unauthorized"** - Invalid NETLIFY_AUTH_TOKEN
3. **"Build failed"** - Missing environment variables
4. **"Module not found"** - Dependencies not built in correct order