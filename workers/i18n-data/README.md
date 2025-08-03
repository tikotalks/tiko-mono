# I18n Data Worker

A Cloudflare Worker that provides API endpoints for fetching translation data from Supabase to generate static TypeScript files during build time.

## Features

- **Get All Translations** - Fetch all translation data for all apps
- **Get App-Specific Translations** - Fetch translations filtered by app name
- **Caching** - Built-in 5-minute cache for better performance
- **CORS Support** - Ready for use from build scripts

## API Endpoints

### GET /all
Fetches all translation data (keys, languages, and translations).

**Response:**
```json
{
  "success": true,
  "data": {
    "keys": [...],
    "languages": [...],
    "translations": {
      "en": { "key1": "value1", ... },
      "nl": { "key1": "waarde1", ... }
    }
  },
  "metadata": {
    "timestamp": "2025-08-03T10:00:00.000Z",
    "totalLanguages": 5,
    "totalKeys": 150
  }
}
```

### GET /app/{appName}
Fetches translations for a specific app (includes common/shared keys).

**Example:** `GET /app/timer`

**Response:**
```json
{
  "success": true,
  "app": "timer",
  "data": {
    "keys": [...],
    "languages": [...],
    "translations": {
      "en": { "timer.start": "Start", "common.save": "Save" },
      "nl": { "timer.start": "Start", "common.save": "Opslaan" }
    }
  },
  "metadata": {
    "timestamp": "2025-08-03T10:00:00.000Z",
    "totalLanguages": 5,
    "totalKeys": 45
  }
}
```

### POST /generate
Generate translation data with optional app filter.

**Request Body:**
```json
{
  "app": "timer" // Optional
}
```

## App-Specific Filtering

When fetching translations for a specific app, the worker includes:
- Keys starting with `{appName}.` (e.g., `timer.start`, `timer.pause`)
- Common keys starting with: `common.`, `shared.`, `global.`, `auth.`, `errors.`, `validation.`

## Setup

1. **Deploy the worker:**
   ```bash
   cd workers/i18n-data
   pnpm install
   wrangler deploy
   ```

2. **Set environment variables:**
   ```bash
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_SERVICE_KEY
   ```

## Usage in Build Scripts

```typescript
// Fetch all translations
const response = await fetch('https://i18n-data.your-subdomain.workers.dev/all')
const data = await response.json()

// Fetch app-specific translations
const appResponse = await fetch('https://i18n-data.your-subdomain.workers.dev/app/timer')
const appData = await appResponse.json()
```

## Development

```bash
# Start development server
pnpm run dev

# Deploy to production
pnpm run deploy
```