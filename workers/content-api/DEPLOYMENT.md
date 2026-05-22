# Content API Deployment

The content API runs on Cloudflare Workers. The repository worker is designed to use D1 as source of truth and KV as cache.

## Required resources

1. D1 database for `CONTENT_DB`
2. KV namespace for `CONTENT_CACHE`
3. Worker route/custom domain for the target environment

## Active routes

Production routes declared in `wrangler.toml`:

- `content.tikoapi.org/*`
- `items.tikoapi.org/*`
- `tts.tikoapi.org/*`

Staging route declared in `wrangler.toml`:

- `content-staging.tikoapi.org/*`

QA evidence on 2026-05-22 found `content-staging.tikoapi.org` does not currently resolve in DNS. Treat it as a configured-but-unprovisioned route until DNS is created.

Identity is not served from `auth.tikoapps.org`; QA evidence found that host does not resolve. Use `https://id.tiko.mt/healthz` for identity health checks.

## Setup

```bash
wrangler d1 create tiko-content
wrangler d1 execute tiko-content --file schema.sql
wrangler kv namespace create CONTENT_CACHE
```

Update `wrangler.toml` with the real D1 database IDs and KV namespace IDs before deploying.

## Production safety check

Before deploying the repository worker to production, verify that the repository-configured D1 binding contains the content data the live site expects:

```bash
corepack pnpm --filter @tiko/content-api-worker exec wrangler d1 execute tiko-content --remote --command \
  "SELECT 'content_projects' AS table_name, COUNT(*) AS n FROM content_projects UNION ALL SELECT 'content_pages', COUNT(*) FROM content_pages UNION ALL SELECT 'content_sections', COUNT(*) FROM content_sections UNION ALL SELECT 'content_items', COUNT(*) FROM content_items;"
```

On 2026-05-22 this query returned `0` for all four listed tables, while the live content API still returned three projects from `https://content.tikoapi.org/query?no-cache=1`. The live worker had also been rolled back to a 2025-09-06 version with message `Rollback content API after legacy shim regression`.

This means the live worker is not certified to be serving from the repository-configured `tiko-content` D1 binding. Do not deploy the current repo worker until the production data source is reconciled.

## Verify before deploy

```bash
corepack pnpm --dir workers/content-api exec tsc -p tsconfig.json --noEmit
corepack pnpm --dir workers/content-api exec wrangler deploy --dry-run --outdir dist
```

## Runtime verification

```bash
curl https://content.tikoapi.org/health
curl https://id.tiko.mt/healthz
curl -X POST 'https://content.tikoapi.org/query?no-cache=1' \
  -H 'Content-Type: application/json' \
  -d '{"method":"getProjects","params":{}}'
```
