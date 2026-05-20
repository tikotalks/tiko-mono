# GitHub Deployment Notes

Tiko Workers deploy to Cloudflare. Each worker owns its runtime configuration in `wrangler.toml`.

Current platform dependencies:

- Cloudflare D1 for relational metadata
- Cloudflare R2 for binary storage
- Cloudflare KV for cache-only data
- Lezu for i18n data and translation

Secrets should be set per worker/environment with `wrangler secret put`.
