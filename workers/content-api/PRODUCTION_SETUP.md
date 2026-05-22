# Production Setup Summary

## Live Endpoints

The active Tiko content worker endpoints are:

- **Production content API**: `https://content.tikoapi.org`
- **Production items REST API**: `https://items.tikoapi.org`
- **Production TTS route**: `https://tts.tikoapi.org`
- **Identity API health**: `https://id.tiko.mt/healthz`

The following hosts are **not active production endpoints** and should not be used as health checks unless DNS/routes are provisioned separately:

- `https://content-staging.tikoapi.org` — no DNS record observed during QA evidence collection.
- `https://auth.tikoapps.org` — no DNS record observed during QA evidence collection; use `https://id.tiko.mt` for identity.

## Verified Endpoints

### Content health

```bash
curl https://content.tikoapi.org/health
```

Expected response shape:

```json
{"status":"ok","timestamp":1779433997490}
```

### Identity health

```bash
curl https://id.tiko.mt/healthz
```

Expected response shape:

```json
{"ok":true,"service":"tiko-identity-api","hasD1":true}
```

### Query content

```bash
curl -X POST 'https://content.tikoapi.org/query?no-cache=1' \
  -H "Content-Type: application/json" \
  -d '{"method":"getProjects","params":{}}'
```

Expected response shape:

```json
{"data":[{"slug":"marketing"},{"slug":"media"},{"slug":"shop"}]}
```

## Current deployment state

The live `tiko-content-api` Worker was rolled back on 2026-05-21 with the deployment message `Rollback content API after legacy shim regression`.

Because of that rollback, the live `https://content.tikoapi.org/query` response currently returns content rows even though the repository-configured `tiko-content` D1 binding has zero rows in the key content tables. Do **not** redeploy this worker until one of these is true:

1. The `tiko-content` D1 database is populated with the production content rows; or
2. `wrangler.toml` is updated to the actual production data binding/source and verified with Wrangler evidence; or
3. A migration/backfill plan intentionally switches production from the rolled-back legacy data source to the repo D1 binding.

## Repository D1 binding evidence

`workers/content-api/wrangler.toml` currently declares:

- `CONTENT_DB` production database name: `tiko-content`
- `CONTENT_DB` staging database name: `tiko-content-staging`
- `CONTENT_CACHE` KV binding for cache responses

Remote Wrangler evidence collected for `tiko-content` showed the expected schema exists, but these key tables are empty:

- `content_projects`: `0`
- `content_pages`: `0`
- `content_sections`: `0`
- `content_items`: `0`

This is a deployment safety note: a deploy of the current repo worker against the current repo D1 binding would not serve the same project data as the live rolled-back worker.

## App Configuration

To use the production worker in any Tiko app:

```env
VITE_USE_CONTENT_WORKER=true
VITE_CONTENT_API_URL=https://content.tikoapi.org
VITE_DEPLOYED_VERSION_ID=v1.0.0
```

## Cache Behavior

- **Default TTL**: 24 hours
- **Cache Headers**:
  - `X-Cache-Status`: HIT, MISS, or BYPASS
  - `X-Cache-Age`: Age of cached content in seconds
- **Cache Busting**: Update `VITE_DEPLOYED_VERSION_ID` when deploying new content

## Monitoring

Check worker status at:

- Cloudflare dashboard → Workers & Pages → `tiko-content-api`

Monitor:

- Request count
- Cache hit rate
- Error rate
- Response times
