# Tiko Content API Worker

A Cloudflare Worker that provides cached access to Tiko content with automatic query caching.

## Production URL

The worker is deployed at: **https://content.tikoapi.org**

## Features

- **Automatic Caching**: All content queries are cached in Cloudflare KV
- **Version-based Cache Busting**: Use `deployedVersionId` parameter to ensure fresh content after deployments
- **Manual Cache Bypass**: Use `no-cache` parameter to skip cache and refresh
- **Legacy URL Support**: Supports both POST-based queries and GET-based legacy URLs
- **Efficient Edge Computing**: Runs on Cloudflare's global edge network

## Setup

1. Install dependencies:
```bash
cd workers/content-api
pnpm install
```

2. Configure your `wrangler.toml`:
- Update the KV namespace ID
- Set your Supabase credentials in Cloudflare dashboard

3. Deploy:
```bash
pnpm deploy
```

## API Endpoints

### POST /query
Main endpoint for content queries.

```typescript
// Request
POST https://content.tikoapi.org/query?deployedVersionId=v1.2.3
{
  "method": "getPage",
  "params": {
    "projectId": "123",
    "slug": "home",
    "languageCode": "en",
    "includeContent": true
  }
}

// Response
{
  "data": { /* page data */ },
  "cached": true,
  "cacheAge": 3600
}
```

### GET /content/{method}
Legacy endpoint for backwards compatibility.

```
GET https://content.tikoapi.org/content/getPage?projectId=123&slug=home&languageCode=en
```

### POST /cache/clear
Clear cache entries (requires authorization).

```typescript
POST https://content.tikoapi.org/cache/clear
Authorization: Bearer YOUR_TOKEN
{
  "versionId": "v1.2.3"  // Clear specific version
  // or
  "pattern": "content:*" // Clear by pattern
}
```

## Query Parameters

- `deployedVersionId`: Version identifier for cache busting
- `no-cache`: Skip cache lookup and force fresh data

## Available Methods

- `getProject`: Get project details
- `getPage`: Get single page with optional content
- `getPages`: List pages
- `getSection`: Get single section
- `getSections`: List sections
- `getSectionContent`: Get content for a section
- `getPageContent`: Get all content for a page
- `getItems`: List content items
- `getItem`: Get single item
- `getItemsByTemplate`: Get items by template ID
- `getLinkedItems`: Get multiple items by IDs

## Cache Headers

The worker returns useful cache headers:
- `X-Cache-Status`: HIT, MISS, or BYPASS
- `X-Cache-Age`: Age of cached content in seconds
- `ETag`: Entity tag for conditional requests
- `Cache-Control`: Browser caching directives

## Environment Variables

Set these in your Cloudflare dashboard:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `CACHE_TTL`: Cache time-to-live in seconds (default: 86400)

## Development

Run locally with Wrangler:
```bash
pnpm dev
```

This will start a local server with KV storage emulation.