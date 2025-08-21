# URGENT: Fix Content API Worker

## The Problem I Created
I updated the content-api worker to use `SUPABASE_SERVICE_KEY` instead of `SUPABASE_ANON_KEY`, but didn't set the secret in Cloudflare. This is causing the marketing website to fail and fall back to direct Supabase calls.

## Quick Fix Options

### Option 1: Set the Secret via Wrangler (Recommended)
```bash
cd workers/content-api
wrangler secret put SUPABASE_SERVICE_KEY
```
When prompted, paste the same service role key that the i18n-data worker uses.

### Option 2: Set via Cloudflare Dashboard
1. Go to https://dash.cloudflare.com
2. Navigate to Workers & Pages > tiko-content-api
3. Go to Settings > Variables and Secrets
4. Add secret: SUPABASE_SERVICE_KEY
5. Use the same value as the i18n-data worker

### Option 3: Revert to Anon Key (Emergency Fix)
If you don't have access to the service key right now, I can revert the changes:
```bash
cd workers/content-api
# This will revert to using SUPABASE_ANON_KEY which is already in wrangler.toml
```

## What Happens After Fix
Once the secret is set:
1. The worker will authenticate properly with Supabase
2. The marketing website will use the worker (it's already configured)
3. No more direct Supabase calls from the frontend
4. Better performance and caching

## Status Check
After setting the secret, verify it's working:
```bash
curl https://content.tikoapi.org/health
curl -X POST https://content.tikoapi.org/query \
  -H "Content-Type: application/json" \
  -d '{"method": "getProjects", "params": {}}'
```

The second command should return data instead of an error.