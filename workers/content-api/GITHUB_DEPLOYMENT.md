# GitHub Deployment Setup for Content API Worker

This guide explains how to set up automated deployments of the Content API Worker using GitHub Actions.

## Prerequisites

1. Cloudflare account with Workers enabled
2. GitHub repository with admin access
3. Wrangler installed locally for initial setup

## Setup Steps

### 1. Get Cloudflare API Token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template or create custom token with:
   - Account: Workers Scripts:Edit
   - Account: Account Settings:Read
   - Zone: Workers Routes:Edit (if using custom domain)
4. Copy the token

### 2. Set GitHub Secrets

In your GitHub repository:
1. Go to Settings → Secrets and variables → Actions
2. Add the following repository secrets:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key

### 3. Create GitHub Action Workflow

Create `.github/workflows/deploy-content-worker.yml`:

```yaml
name: Deploy Content API Worker

on:
  push:
    branches:
      - master
    paths:
      - 'workers/content-api/**'
      - '.github/workflows/deploy-content-worker.yml'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy Content API Worker
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - name: Install dependencies
        run: |
          cd workers/content-api
          pnpm install
      
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: 'workers/content-api'
          environment: 'production'
          secrets: |
            SUPABASE_URL
            SUPABASE_ANON_KEY
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

### 4. Create Staging Deployment Workflow

Create `.github/workflows/deploy-content-worker-staging.yml`:

```yaml
name: Deploy Content API Worker (Staging)

on:
  pull_request:
    types: [opened, synchronize]
    paths:
      - 'workers/content-api/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy Content API Worker to Staging
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - name: Install dependencies
        run: |
          cd workers/content-api
          pnpm install
      
      - name: Deploy to Cloudflare Workers (Staging)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: 'workers/content-api'
          environment: 'staging'
          secrets: |
            SUPABASE_URL
            SUPABASE_ANON_KEY
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## Manual Deployment

You can also trigger deployments manually:

1. Go to Actions tab in your GitHub repository
2. Select "Deploy Content API Worker" workflow
3. Click "Run workflow"
4. Select branch and click "Run workflow"

## Monitoring Deployments

### GitHub Actions
- Check the Actions tab for deployment status
- Each deployment shows detailed logs
- Failed deployments will show error messages

### Cloudflare Dashboard
1. Go to https://dash.cloudflare.com
2. Navigate to Workers & Pages
3. Click on "tiko-content-api"
4. View:
   - Deployment history
   - Analytics and metrics
   - Real-time logs
   - Error rates

## Rollback Procedure

If a deployment causes issues:

### Quick Rollback (Cloudflare Dashboard)
1. Go to Workers & Pages → tiko-content-api
2. Click "Deployments" tab
3. Find the previous working deployment
4. Click "..." menu → "Rollback to this deployment"

### Git Revert
1. Revert the problematic commit:
   ```bash
   git revert <commit-hash>
   git push origin master
   ```
2. This triggers a new deployment with the reverted code

## Best Practices

1. **Test Locally First**
   ```bash
   cd workers/content-api
   pnpm dev
   ```

2. **Use Staging Environment**
   - Create PRs for worker changes
   - Staging deployment runs automatically
   - Test at https://content-staging.tikoapi.org

3. **Monitor After Deployment**
   - Check error rates in Cloudflare dashboard
   - Monitor cache hit rates
   - Verify API responses

4. **Version Management**
   - Update `VITE_DEPLOYED_VERSION_ID` in apps when deploying
   - This ensures proper cache invalidation

## Troubleshooting

### Deployment Fails
1. Check GitHub Actions logs for errors
2. Verify secrets are set correctly
3. Ensure wrangler.toml is valid

### Worker Not Responding
1. Check Cloudflare dashboard for errors
2. Verify KV namespace is bound correctly
3. Check Supabase credentials

### Cache Issues
1. Use cache clear endpoint:
   ```bash
   curl -X POST https://content.tikoapi.org/cache/clear \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"pattern": "content:"}'
   ```

2. Update version ID in apps to bust cache

## Security Notes

- Never commit secrets to the repository
- Use GitHub Secrets for sensitive values
- Rotate API tokens regularly
- Monitor access logs for suspicious activity