# Deployment Setup Guide

This guide explains how to set up automatic deployments for all Tiko projects via GitHub Actions.

## Overview

Each part of the Tiko monorepo deploys independently:
- **Workers** → Cloudflare Workers (i18n-translator, media-upload, sentence-engine)
- **Apps** → Cloudflare Pages (timer, cards, radio, todo, yes-no)
- **Websites** → Cloudflare Pages (marketing, future media site)
- **Tools** → Cloudflare Pages (admin, ui-docs)

## Required GitHub Secrets

### For Cloudflare (Workers and Pages)
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token (used for all deployments)

### For Supabase (used by apps)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Setup Instructions

### 1. Get Cloudflare API Token
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Custom token" template with these permissions:
   - Account: Cloudflare Pages:Edit
   - Zone: Zone:Read (for all zones)
   - Account: Account:Read
4. Copy the token

### 2. Cloudflare Pages Projects
Cloudflare Pages projects are created automatically when you first deploy.
No manual setup required - the deployment will create projects with these names:
- `tiko-timer` - Timer app
- `tiko-cards` - Cards app  
- `tiko-radio` - Radio app
- `tiko-todo` - Todo app
- `tiko-marketing` - Marketing website
- `tiko-admin` - Admin tool
- `tiko-ui-docs` - UI documentation

### 3. Add Secrets to GitHub
1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add each secret from the list above

### 4. Link Custom Domains (Optional)
In Cloudflare Pages dashboard for each project:
1. Go to Custom domains
2. Add custom domain
3. DNS records are automatically configured if using Cloudflare DNS

## How It Works

### Deployment Triggers via Commit Messages

**IMPORTANT**: Deployments are ONLY triggered by explicit commit message triggers. File changes alone will NOT trigger deployments.

#### Force Builds by Category
Add these to your commit message to force deployments:
- `[build:all]` - Forces ALL projects to build and deploy
- `[build:apps]` - Forces all apps to deploy (timer, cards, radio, todo, yes-no)
- `[build:workers]` - Forces all workers to deploy (i18n-translator, media-upload, sentence-engine)
- `[build:websites]` - Forces all websites to deploy (marketing)
- `[build:tools]` - Forces all tools to deploy (admin, ui-docs)

#### Force Specific Deployments
**Apps:**
- `[build:timer]` - Deploy timer app only
- `[build:cards]` - Deploy cards app only
- `[build:radio]` - Deploy radio app only
- `[build:todo]` - Deploy todo app only
- `[build:yes-no]` - Deploy yes-no app only

**Workers:**
- `[build:i18n-translator]` - Deploy i18n translator worker only
- `[build:media-upload]` - Deploy media upload worker only
- `[build:sentence-engine]` - Deploy sentence engine worker only

**Websites:**
- `[build:marketing]` - Deploy marketing website only

**Tools:**
- `[build:admin]` - Deploy admin tool only
- `[build:ui-docs]` - Deploy UI docs only

#### No Skip Triggers Needed
Since deployments only happen with explicit triggers, there's no need for skip triggers. Simply don't include a build trigger in your commit message if you don't want to deploy.

### Build Process
1. GitHub Actions runs on push to master
2. Checks commit message for deployment triggers
3. ONLY deploys if explicit triggers are found
4. Dependencies (packages/ui, packages/core) are built first
5. Each deployment runs in parallel for speed
6. Uses wrangler CLI to deploy to Cloudflare Pages

### No Automatic Deployments
- Changes to files do NOT automatically trigger deployments
- You must explicitly use commit message triggers
- This gives you full control over when deployments happen

## Testing Deployments

After setup, test deployments with explicit triggers:

```bash
# Deploy all workers
git commit --allow-empty -m "test: workers deployment [build:workers]"
git push

# Deploy specific app to Cloudflare Pages
git commit --allow-empty -m "test: timer deployment [build:timer]"
git push

# Deploy everything (workers + pages)
git commit --allow-empty -m "test: full deployment [build:all]"
git push

# Deploy multiple specific items
git commit --allow-empty -m "test: multi deploy [build:cards] [build:radio]"
git push

# Regular commits don't trigger deployments
echo "# Docs update" >> README.md
git add . && git commit -m "docs: update readme" && git push  # No deployment
```

## Monitoring

- **GitHub Actions**: Check Actions tab for deployment status
- **Cloudflare Workers**: Check Workers & Pages dashboard for worker status
- **Cloudflare Pages**: Check Workers & Pages dashboard for pages deployment status

## Environment Variables

### Build-time Variables (Vite apps)
Set in GitHub secrets with `VITE_` prefix:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Runtime Variables (Workers)
Set directly in Cloudflare Workers dashboard:
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

### Pages Environment Variables
Set in Cloudflare Pages dashboard for each project if needed:
- Most variables are built into the static files during build
- Runtime variables can be set per project in Pages settings

## Troubleshooting

### Build Failures
- Check GitHub Actions logs for specific errors
- Ensure all dependencies are properly installed
- Verify environment variables are set

### Deployment Failures
- Check Cloudflare Workers & Pages logs
- Verify API tokens have correct permissions
- Ensure Cloudflare account has Pages enabled

### Common Issues
1. **"Project not found"** - Cloudflare Pages project will be created on first deploy
2. **"Unauthorized"** - Invalid CLOUDFLARE_API_TOKEN or insufficient permissions
3. **"Build failed"** - Missing environment variables or build errors
4. **"Module not found"** - Dependencies not built in correct order
5. **"Pages deployment failed"** - Check wrangler logs for specific errors