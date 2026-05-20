# GitHub Deployment

GitHub deployment should build and deploy the content API with Wrangler after Cloudflare resources are provisioned.

## Required GitHub secrets

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

D1 and KV resource IDs belong in `wrangler.toml`; do not store database credentials because the worker uses Cloudflare-native bindings.

## Validation command

```bash
corepack pnpm --dir workers/content-api exec wrangler deploy --dry-run --outdir dist
```
