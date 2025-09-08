# Media Cache Worker

This Cloudflare Worker caches all public media items from Supabase to reduce database load and improve performance.

## Features

- Caches all public media items in Cloudflare KV
- Automatically refreshes cache on deployment (uses deployment version as cache key)
- 24-hour cache expiration
- Automatic cleanup of old cache entries
- CORS enabled for cross-origin requests
- Graceful fallback to direct Supabase queries

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Automated KV Setup (Recommended)

Run the automated setup script that will create KV namespaces for all environments and update your wrangler.toml:

```bash
# Make scripts executable (first time only)
chmod +x scripts/*.sh

# Run the setup
npm run setup:kv
```

This will:
- Create KV namespaces for development, staging, and production
- Automatically update wrangler.toml with the namespace IDs
- Show you the commands to set up secrets

### 3. Configure Secrets

Set the required secrets for each environment using wrangler:

#### Development
```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_KEY
```

#### Staging
```bash
npx wrangler secret put SUPABASE_URL --env staging
npx wrangler secret put SUPABASE_SERVICE_KEY --env staging
```

#### Production
```bash
npx wrangler secret put SUPABASE_URL --env production
npx wrangler secret put SUPABASE_SERVICE_KEY --env production
```

### 4. Deploy

Deploy using the npm scripts:

```bash
# Deploy to production
npm run deploy

# Deploy to specific environments
npm run deploy:dev
npm run deploy:staging
npm run deploy:production
```

Or use wrangler directly:
```bash
# Development
npx wrangler deploy

# Staging
npx wrangler deploy --env staging

# Production
npx wrangler deploy --env production
```

## Usage

The worker exposes a single endpoint:

### GET `/`

Fetches all public media items.

Query Parameters:
- `refresh=true` - Force refresh the cache (optional)

Response:
```json
{
  "media": [...],
  "cachedAt": "2024-01-15T12:00:00Z",
  "deploymentVersion": "2024-01-15"
}
```

Response Headers:
- `X-Cache-Status`: "HIT" or "MISS"
- `X-Deployment-Version`: Current deployment version

## Development

Run the worker locally:
```bash
npx wrangler dev
```

Note: You'll need to set up local environment variables in a `.dev.vars` file:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

## Environment Variables

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key (for accessing private tables)
- `DEPLOYMENT_VERSION` (optional) - Override the deployment version (defaults to current date)

## Integration

The worker is integrated with the `@tiko/core` package through the `mediaCacheService`:

```typescript
import { mediaCacheService } from '@tiko/core';

// Get public media (with cache)
const media = await mediaCacheService.getPublicMedia();

// Force refresh
const media = await mediaCacheService.getPublicMedia(true);
```

The `useImages` composable automatically uses this service for public media:

```typescript
import { useImages, ImageLibraryType } from '@tiko/core';

const { imageList, loadImages } = useImages({ 
  libraryType: ImageLibraryType.PUBLIC 
});

// Will automatically use the cache worker if available
await loadImages();
```