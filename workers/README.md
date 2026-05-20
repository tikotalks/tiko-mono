# Tiko Workers

Cloudflare Workers for Tiko. Runtime data uses Cloudflare services:

- D1 for relational metadata
- R2 for binary media/audio/assets
- KV for cache-only data
- Lezu for translations

Legacy external database services are not part of the Tiko worker runtime.

Use each worker's `wrangler.toml` for bindings and each worker-local `schema.sql` for D1 schema.
