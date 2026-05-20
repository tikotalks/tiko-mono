# Tiko Content API Worker

Cloudflare Worker for cached content queries backed by D1.

## Runtime bindings

- `CONTENT_DB` — D1 database containing content tables from `schema.sql`
- `CONTENT_CACHE` — KV namespace used only as response cache
- `CACHE_TTL` — cache max age in seconds

## Endpoints

- `GET /health` — health check
- `POST /query` — execute a content query `{ method, params }`
- `POST /cache/clear` — clear cached responses
- `GET /content/:method?...` — legacy query URL shape

## Local development

```bash
pnpm install
pnpm wrangler dev
```

## Verification

```bash
corepack pnpm --dir workers/content-api exec tsc -p tsconfig.json --noEmit
corepack pnpm --dir workers/content-api exec wrangler deploy --dry-run --outdir dist
```

## Deployment

Provision the D1 database, apply `schema.sql`, replace the placeholder database IDs in `wrangler.toml`, then deploy with Wrangler or the repository workflow.
