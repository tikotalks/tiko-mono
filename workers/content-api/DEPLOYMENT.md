# Deploying the Content API Worker

This guide explains how to deploy the Tiko Content API Worker to Cloudflare.

## Prerequisites

1. A Cloudflare account
2. A domain configured in Cloudflare (for custom domain)
3. Wrangler CLI installed (`npm install -g wrangler`)
4. Access to your Supabase project credentials

## Setup Steps

### 1. Install Dependencies

```bash
cd workers/content-api
pnpm install
```

### 2. Create KV Namespace

```bash
# Create production KV namespace
wrangler kv:namespace create "CONTENT_CACHE"

# Create staging KV namespace (optional)
wrangler kv:namespace create "CONTENT_CACHE" --preview
```

Copy the returned namespace IDs and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CONTENT_CACHE"
id = "your-production-namespace-id"
preview_id = "your-preview-namespace-id"
```

### 3. Set Environment Variables

Set your secrets using Wrangler:

```bash
# Production secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY

# For staging (optional)
wrangler secret put SUPABASE_URL --env staging
wrangler secret put SUPABASE_SERVICE_KEY --env staging
```

When prompted, enter your Supabase project URL and service role key (not the anon key).

**Important**: Use the service role key from your Supabase dashboard under Settings > API. This key has full access to your database and should be kept secret.

### 4. Configure Custom Domain

Update `wrangler.toml` with your domain:

```toml
[env.production]
routes = [
  { pattern = "content.tikoapi.org/*", zone_name = "tikoapi.org" }
]
```

### 5. Deploy

```bash
# Deploy to production
pnpm deploy

# Or deploy to staging
wrangler deploy --env staging
```

## Usage in Apps

### Environment Variables

Add these to your app's `.env` file:

```env
# Enable worker usage
VITE_USE_CONTENT_WORKER=true

# Worker URL
VITE_CONTENT_API_URL=https://content.tikoapi.org

# Version ID for cache busting (update on deploy)
VITE_DEPLOYED_VERSION_ID=v1.0.0
```

### Code Example

```typescript
import { useContent } from '@tiko/core'

// Use with worker
const content = useContent({
  projectSlug: 'marketing',
  useWorker: true,
  workerUrl: import.meta.env.VITE_CONTENT_API_URL,
  deployedVersionId: import.meta.env.VITE_DEPLOYED_VERSION_ID
})

// Load content (will use worker cache)
const page = await content.getPage('home', 'en')
```

## Cache Management

### Automatic Cache Invalidation

The cache automatically expires based on the `CACHE_TTL` setting (default: 24 hours).

### Manual Cache Clear

You can manually clear the cache using the API:

```bash
curl -X POST https://content.tikoapi.org/cache/clear \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"versionId": "v1.0.0"}'
```

### Version-based Cache Busting

Update `VITE_DEPLOYED_VERSION_ID` in your app when deploying new content:

1. Update content in Supabase
2. Deploy apps with new version ID
3. Old cache entries are ignored

## Monitoring

### Check Worker Health

```bash
curl https://content.tikoapi.org/health
```

### View Logs

```bash
# Tail production logs
wrangler tail

# Tail staging logs
wrangler tail --env staging
```

### Analytics

View metrics in Cloudflare dashboard:
1. Go to Workers & Pages
2. Select your worker
3. View Analytics tab

## Performance Tips

1. **Use Version IDs**: Always set `deployedVersionId` for proper cache busting
2. **Batch Requests**: The worker handles concurrent requests efficiently
3. **Monitor Cache Hit Rate**: Check X-Cache-Status headers
4. **Optimize TTL**: Adjust CACHE_TTL based on your content update frequency

## Troubleshooting

### Cache Not Working

1. Check response headers for `X-Cache-Status`
2. Verify KV namespace is properly configured
3. Check worker logs for errors

### CORS Issues

The worker includes CORS headers by default. If you have issues:
1. Check the allowed origins in the worker code
2. Ensure your app domain is allowed

### Performance Issues

1. Check Cloudflare Analytics for slow requests
2. Monitor KV storage usage
3. Consider increasing cache TTL
4. Use `no-cache` parameter sparingly

## Cost Considerations

- **Workers**: 100,000 requests/day free, then $0.50/million
- **KV Storage**: 1 GB free, then $0.50/GB-month
- **KV Operations**: 100,000 reads/day free, then $0.50/million

For Tiko's typical usage, the free tier should be sufficient.