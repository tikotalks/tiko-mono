# Assets Upload Worker

Cloudflare Worker for managing asset uploads and metadata operations.

## Features

- Upload files to Cloudflare R2 bucket
- Store metadata in Cloudflare D1
- Automatic image dimension detection
- File type validation
- CRUD operations for asset metadata
- Public/private access control

## API Endpoints

- `POST /upload` - Upload new asset
- `GET /assets` - List assets with filtering
- `GET /assets/:id` - Get specific asset
- `PUT /assets/:id` - Update asset metadata
- `DELETE /assets/:id` - Delete asset

## Deployment

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Apply the D1 schema:**
   ```bash
   wrangler d1 execute tiko-assets --file schema.sql
   ```

3. **Deploy:**
   ```bash
   wrangler deploy
   ```

## Bindings

- `ASSETS_R2_BUCKET` - R2 bucket for uploaded asset bytes
- `ASSETS_DB` - D1 database for asset metadata

## Domain Configuration

- Production: `assets.tikoapi.org`
- Files served via: `assets.tikocdn.org`
