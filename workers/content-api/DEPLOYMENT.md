# Content API Deployment

The content API runs on Cloudflare Workers with D1 as source of truth and KV as cache.

## Required resources

1. D1 database for `CONTENT_DB`
2. KV namespace for `CONTENT_CACHE`
3. Worker route/custom domain for the target environment

## Setup

```bash
wrangler d1 create tiko-content
wrangler d1 execute tiko-content --file schema.sql
wrangler kv namespace create CONTENT_CACHE
```

Update `wrangler.toml` with the real D1 database IDs and KV namespace IDs before deploying.

## Verify before deploy

```bash
corepack pnpm --dir workers/content-api exec tsc -p tsconfig.json --noEmit
corepack pnpm --dir workers/content-api exec wrangler deploy --dry-run --outdir dist
```
