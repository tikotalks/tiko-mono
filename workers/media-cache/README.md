# Media Cache Worker

This Cloudflare Worker caches all public media items from D1 to reduce database load and improve performance.

## Overview

The worker fetches public media metadata from the `MEDIA_DB` D1 binding and stores deployment-versioned responses in KV.

## Setup

```bash
npm install
wrangler d1 create tiko-media
wrangler d1 execute tiko-media --file schema.sql
wrangler deploy
```

Replace placeholder D1 database ids in `wrangler.toml` before deploying to shared environments.

## Bindings

- `MEDIA_CACHE`: KV namespace used as response cache
- `MEDIA_DB`: D1 database containing public media metadata
- `DEPLOYMENT_VERSION`: optional variable used to version cache keys

## API

### GET `/`

Returns cached public media response.

Query params:

- `refresh=true`: bypass KV and refresh from D1

Response shape:

```json
{
  "media": [],
  "cachedAt": "2026-05-20T00:00:00.000Z",
  "deploymentVersion": "2026-05-20"
}
```
