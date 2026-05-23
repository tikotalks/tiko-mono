# Cloudflare Resource Status

Last verified: 2026-05-23T15:01:23Z

This document records the live Cloudflare resource state that must be respected before redeploying Tiko content/identity surfaces.

## Canonical identity origin

- Canonical host: `id.tiko.mt`
- Live health check: `GET https://id.tiko.mt/healthz`
- Verified result: HTTP 200 with `{"ok":true,"service":"tiko-identity-api","hasD1":true}`
- `auth.tikoapps.org` is not the canonical identity origin and currently does not resolve. Do not use it as a deployment or application target.

## Content API production state

- Canonical production content host: `content.tikoapi.org`
- `GET https://content.tikoapi.org/health`: HTTP 200
- `GET https://content.tikoapi.org/query`: HTTP 404, as expected for a query endpoint that requires POST
- `POST https://content.tikoapi.org/query?no-cache=1` with `{"method":"getProjects","params":{}}`: HTTP 200 and returns live project data including `marketing`, `media`, and `shop`
- `content-staging.tikoapi.org` currently does not resolve, even though staging routes are present in `workers/content-api/wrangler.toml`.

## Repo-configured bindings

`workers/content-api/wrangler.toml` currently configures:

- Worker: `tiko-content-api`
- Routes: `content.tikoapi.org/*`, `items.tikoapi.org/*`
- KV binding: `CONTENT_CACHE`
- D1 binding: `CONTENT_DB` → database name `tiko-content`
- Staging D1 binding: `CONTENT_DB` → database name `tiko-content-staging`

Remote D1 table counts for repo-configured `tiko-content` on 2026-05-23:

- `content_projects`: 0
- `content_pages`: 0
- `content_sections`: 0
- `content_items`: 0

This means the live `content.tikoapi.org/query?no-cache=1` data is not proven to come from the repo-configured `tiko-content` D1 binding.

## Deployment history note

`wrangler deployments list --name tiko-content-api` shows a 2026-05-21 rollback message: `Rollback content API after legacy shim regression`, pointing production back to an older 2025-09-06 Worker version.

## No-deploy guard

Do **not** redeploy `workers/content-api` to production until one of these is true:

1. `tiko-content` is populated with the production content data and verified through `CONTENT_DB` table counts plus live query smoke tests.
2. `workers/content-api/wrangler.toml` is updated to point at the actual intended production content source and that source is documented.
3. A planned migration/cutover explicitly moves production content from the rollback/legacy source to the repo-configured D1 binding.

Safe validation that does not deploy:

```bash
corepack pnpm@8.15.0 --filter @tiko/content-api-worker exec tsc -p tsconfig.json --noEmit
corepack pnpm@8.15.0 --filter @tiko/content-api-worker exec wrangler deploy --dry-run --outdir dist-dry-run
rm -rf workers/content-api/dist-dry-run
```

Both validations passed on 2026-05-23.
