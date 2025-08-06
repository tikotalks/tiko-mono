# Production Setup Summary

## Live Endpoints

The Tiko Content API Worker is now live at:

- **Production URL**: https://content.tikoapi.org
- **Worker URL**: https://tiko-content-api.silvandiepen.workers.dev (redirects to custom domain)

## Verified Endpoints

### Status Page
```bash
curl https://content.tikoapi.org/
```

### Health Check
```bash
curl https://content.tikoapi.org/health
```

### Query Content
```bash
curl -X POST https://content.tikoapi.org/query \
  -H "Content-Type: application/json" \
  -d '{"method": "getProjects", "params": {}}'
```

## App Configuration

To use the production worker in any Tiko app:

### 1. Update .env file
```env
# Enable worker for better performance
VITE_USE_CONTENT_WORKER=true
VITE_CONTENT_API_URL=https://content.tikoapi.org
VITE_DEPLOYED_VERSION_ID=v1.0.0
```

### 2. Use in code
```typescript
// The useContent composable automatically uses the worker when configured
const content = useContent({ 
  projectSlug: 'marketing',
  useWorker: true // Optional - will use env var by default
})

// All methods work the same
const page = await content.getPage('home', 'en')
```

## Cache Behavior

- **Default TTL**: 24 hours
- **Cache Headers**: 
  - `X-Cache-Status`: HIT, MISS, or BYPASS
  - `X-Cache-Age`: Age of cached content in seconds
- **Cache Busting**: Update `VITE_DEPLOYED_VERSION_ID` when deploying new content

## Performance Benefits

1. **Reduced Latency**: Content served from Cloudflare's edge network
2. **Lower Database Load**: Cached queries reduce Supabase usage
3. **Cost Savings**: Fewer database queries = lower costs
4. **Global Distribution**: Content cached in 300+ edge locations

## Monitoring

Check worker status at:
- https://dash.cloudflare.com → Workers & Pages → tiko-content-api

Monitor:
- Request count
- Cache hit rate
- Error rate
- Response times

## Security

- CORS enabled for all origins
- Supabase credentials stored as encrypted secrets
- Rate limiting applied by Cloudflare
- DDoS protection included

## Next Steps

1. Update all apps to use the worker URL
2. Monitor cache hit rates
3. Adjust TTL if needed
4. Set up alerts for errors