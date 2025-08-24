# Branch-Based Deployment Configuration

## Reusable Workflows

To reduce code duplication, the deployment system uses reusable workflows:

- **`.github/workflows/reusable-determine-environment.yml`**: Determines the deployment environment based on branch
- **`.github/workflows/reusable-check-environment.yml`**: Validates required environment variables

These are used by all deployment workflows to maintain consistency.

## Overview

The Tiko mono repository now supports automatic deployment to different environments based on the branch:

- **master branch** → Production (e.g., `sequence.tikoapps.org`)
- **develop branch** → Development (e.g., `develop.sequence.tikoapps.org`)

## How It Works

### Master Branch
- Uses commit message triggers (e.g., `[build:cards]`, `[build:all]`)
- Deploys to production URLs
- Manual control over what gets deployed

### Develop Branch
- Automatically detects changed files
- Deploys affected apps without needing commit message triggers
- If UI or Core packages change, all apps are redeployed
- Deploys to development URLs with `develop.` prefix

## Cloudflare Pages Setup

For each app, you'll need TWO Cloudflare Pages projects:

### Production Projects
- `tiko-timer` → `timer.tikoapps.org`
- `tiko-cards` → `cards.tikoapps.org`
- `tiko-sequence` → `sequence.tikoapps.org`
- `tiko-radio` → `radio.tikoapps.org`
- `tiko-todo` → `todo.tikoapps.org`
- `tiko-type` → `type.tikoapps.org`
- `tiko-yes-no` → `yesno.tikoapps.org`

### Development Projects
- `tiko-timer-develop` → `develop.timer.tikoapps.org`
- `tiko-cards-develop` → `develop.cards.tikoapps.org`
- `tiko-sequence-develop` → `develop.sequence.tikoapps.org`
- `tiko-radio-develop` → `develop.radio.tikoapps.org`
- `tiko-todo-develop` → `develop.todo.tikoapps.org`
- `tiko-type-develop` → `develop.type.tikoapps.org`
- `tiko-yes-no-develop` → `develop.yesno.tikoapps.org`

## Setting Up Custom Domains in Cloudflare

1. Go to Cloudflare Dashboard → Pages
2. For each `-develop` project:
   - Click on the project
   - Go to "Custom domains"
   - Add the corresponding `develop.*.tikoapps.org` domain
   - Cloudflare will automatically handle the DNS records

## GitHub Actions Configuration

The workflows automatically:
1. Detect the current branch
2. Set the appropriate URL prefix and project suffix
3. Deploy to the correct Cloudflare Pages project
4. Use the correct VITE_SITE_URL for each environment

## Environment Variables

The same secrets are used for both environments:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_TTS_WORKER_URL`
- `VITE_TTS_CDN_URL`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Deployment Behavior

### Production (master branch)
```bash
# Deploy specific app
git commit -m "fix: update cards logic [build:cards]"

# Deploy all apps
git commit -m "feat: update UI components [build:all]"
```

### Development (develop branch)
```bash
# Just commit - affected apps deploy automatically
git commit -m "fix: update cards logic"

# Changes to UI/Core trigger all apps
git commit -m "feat: update UI components"
```

## Manual Deployments

You can still trigger manual deployments via GitHub Actions:
1. Go to Actions tab
2. Select "Deploy Apps to Cloudflare Pages"
3. Click "Run workflow"
4. Select target app and branch