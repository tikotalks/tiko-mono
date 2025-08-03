# I18n Worker System

A new translation system that uses Cloudflare Workers to serve translation data and generates static TypeScript files during build time for optimal performance.

## Overview

The new I18n Worker System replaces the previous database-driven approach with:

1. **Cloudflare Worker API** - Serves translation data from Supabase
2. **Build-time Generation** - Creates static TypeScript files during build
3. **Zero Runtime Dependencies** - No database queries in production
4. **TypeScript Support** - Full type safety and auto-completion
5. **App-specific Filtering** - Only include translations needed per app

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Supabase      │    │  Cloudflare      │    │   Build-time    │
│   Database      │◄───┤    Worker        │◄───┤   Generation    │
│                 │    │                  │    │                 │
│ • i18n_keys     │    │ • /all           │    │ • types.ts      │
│ • i18n_languages│    │ • /app/{name}    │    │ • en.ts         │
│ • i18n_translations │ • /generate      │    │ • nl.ts         │
└─────────────────┘    └──────────────────┘    │ • index.ts      │
                                               └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │   Runtime       │
                                               │   Usage         │
                                               │                 │
                                               │ • useI18n()     │
                                               │ • Static files  │
                                               │ • No DB calls   │
                                               └─────────────────┘
```

## Components

### 1. I18n Data Worker (`workers/i18n-data/`)

**Location:** `workers/i18n-data/`
**Purpose:** Provides API endpoints to fetch translation data from Supabase

**Endpoints:**
- `GET /all` - All translation data
- `GET /app/{appName}` - App-specific translations + common keys
- `POST /generate` - Generate data with optional app filter

**Features:**
- 5-minute caching for performance
- CORS support for build scripts
- App-specific filtering (includes common keys)
- Error handling and fallbacks

### 2. Build-time Generation Scripts

**Script:** `scripts/generate-i18n-from-worker.js`
**Purpose:** Fetches data from worker and generates TypeScript files

**Usage:**
```bash
# Generate all translations
pnpm run generate:i18n:worker

# Generate from production worker
pnpm run generate:i18n:worker:prod

# Generate app-specific translations
node scripts/generate-i18n-from-worker.js --app=timer --env=production
```

**Generated Files:**
- `packages/ui/src/i18n/generated/types.ts` - TypeScript interfaces
- `packages/ui/src/i18n/generated/en.ts` - English translations
- `packages/ui/src/i18n/generated/nl.ts` - Dutch translations
- `packages/ui/src/i18n/generated/index.ts` - Main export file

### 3. Vite Plugin Integration

**Plugin:** `scripts/vite-plugin-i18n-worker.js`
**Purpose:** Integrates worker-based generation into Vite builds

**Configuration:**
```javascript
// Automatically integrated in vite.config.base.js
// Uses worker-based plugin for production builds
// Falls back to simple plugin for development
```

**Environment Variables:**
- `USE_I18N_WORKER=true` - Force worker plugin in development
- `NODE_ENV=production` - Automatically uses worker plugin

### 4. Updated useI18n Composable

**Location:** `packages/ui/src/composables/useI18n.ts`
**Purpose:** Uses generated static files for translations

**Features:**
- Imports generated static files
- TypeScript support with auto-completion
- Parameter interpolation
- Locale persistence and fallbacks
- Zero runtime database dependencies

## Usage

### Basic Translation

```vue
<template>
  <div>
    <h1>{{ t('common.welcome') }}</h1>
    <p>{{ t('app.description') }}</p>
    <button>{{ t('actions.save') }}</button>
  </div>
</template>

<script setup>
import { useI18n } from '@tiko/ui'

const { t } = useI18n()
</script>
```

### With Parameters

```vue
<template>
  <p>{{ t('user.greeting', { name: userName }) }}</p>
</template>

<script setup>
import { useI18n } from '@tiko/ui'

const { t } = useI18n()
const userName = ref('John')
</script>
```

### Language Switching

```vue
<template>
  <select @change="changeLanguage($event.target.value)">
    <option v-for="locale in availableLocales" :key="locale" :value="locale">
      {{ t(`languages.${locale}`) }}
    </option>
  </select>
</template>

<script setup>
import { useI18n } from '@tiko/ui'

const { t, setLocale, availableLocales } = useI18n()

const changeLanguage = async (locale) => {
  await setLocale(locale)
}
</script>
```

## App-Specific Filtering

When generating translations for a specific app, the system includes:

1. **App-specific keys** - Keys starting with `{appName}.`
   - Example: `timer.start`, `timer.pause`, `timer.reset`

2. **Common keys** - Shared across all apps
   - `common.*` - Common UI elements
   - `shared.*` - Shared functionality
   - `global.*` - Global app elements
   - `auth.*` - Authentication related
   - `errors.*` - Error messages
   - `validation.*` - Form validation

Example for `timer` app:
```typescript
// Includes:
// - timer.start, timer.pause, timer.reset
// - common.save, common.cancel, common.loading
// - auth.login, auth.logout
// - errors.network, errors.generic
```

## Setup and Deployment

### 1. Deploy the Worker

```bash
cd workers/i18n-data
pnpm install
wrangler deploy
```

### 2. Set Environment Variables

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
```

### 3. Update Build Process

The worker plugin is already integrated into the base Vite configuration and will automatically:
- Use worker-based generation for production builds
- Fetch translations before build starts
- Generate static TypeScript files
- Cache results for 5 minutes

### 4. Test the System

```bash
# Test the complete system
node scripts/test-i18n-worker-system.js

# Generate translations manually
pnpm run generate:i18n:worker:prod
```

## Development Workflow

### Adding New Translation Keys

1. **Add to Database** - Use the admin panel or translation service
2. **Regenerate Files** - Run generation script
3. **Use in Code** - TypeScript auto-completion will show new keys

```bash
# Regenerate after adding keys
pnpm run generate:i18n:worker:prod
```

### Local Development

For local development, you can:

1. **Use existing generated files** (recommended)
2. **Run worker locally** and generate from local endpoint
3. **Force worker plugin** with `USE_I18N_WORKER=true`

### Production Builds

Production builds automatically:
1. Fetch latest translations from production worker
2. Generate static TypeScript files
3. Bundle translations into the app
4. Provide zero-runtime-dependency i18n

## Benefits

### Performance
- **Zero runtime database calls** - All translations are bundled
- **Smaller bundle size** - Only includes needed translations per app
- **Fast builds** - Worker caching reduces generation time
- **CDN cacheable** - Static files can be cached by CDN

### Developer Experience
- **TypeScript support** - Full type safety and auto-completion
- **Hot reloading** - Generated files work with Vite HMR
- **Easy debugging** - Generated files are human-readable
- **Flexible deployment** - Works with any hosting platform

### Maintainability
- **Single source of truth** - Database remains the authoritative source
- **Automated workflow** - Generation happens during build
- **App isolation** - Each app only gets its needed translations
- **Version consistency** - Build-time generation ensures consistency

## Migration from Old System

### For Apps Already Using useI18n

No changes needed! The updated `useI18n` composable maintains the same API while using the new static files under the hood.

### For Apps Using Database I18n

1. **Replace database calls** with `useI18n` composable
2. **Update imports** to use generated static files
3. **Run generation script** to create initial files
4. **Test functionality** with the new system

### Build Process Updates

The Vite plugin integration means:
- **No manual build steps** - Generation happens automatically
- **Environment-aware** - Uses appropriate worker endpoint
- **Graceful fallbacks** - Falls back to existing files if worker fails

## Troubleshooting

### Worker Not Available
- System falls back to existing generated files
- Warning logged but build continues
- Check worker deployment and environment variables

### Missing Translation Keys
- Check if key exists in database
- Regenerate files after adding keys
- Verify app-specific filtering includes your keys

### TypeScript Errors
- Ensure generated files are up to date
- Check that types.ts includes your keys
- Verify imports are correct

### Performance Issues
- Worker has 5-minute cache - respect cache headers
- Consider app-specific generation for large projects
- Monitor worker logs for performance insights

## Future Enhancements

- **Incremental updates** - Only regenerate changed translations
- **Build-time validation** - Verify all keys exist before build
- **Development proxy** - Live reload translations in development
- **Analytics integration** - Track translation usage and coverage