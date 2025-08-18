# Assets Upload Worker

Cloudflare Worker for managing asset uploads and metadata operations.

## Features

- Upload files to Cloudflare R2 bucket
- Store metadata in Supabase
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

2. **Set up secrets:**
   ```bash
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_SERVICE_KEY
   ```

3. **Deploy:**
   ```bash
   wrangler deploy
   ```

## Environment Variables

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key

## R2 Bucket Binding

The worker expects an R2 bucket binding named `ASSETS_R2_BUCKET` pointing to the `tiko-assets` bucket.

## Domain Configuration

- Production: `assets.tikoapi.org`
- Files served via: `assets.tikocdn.org`