# I18n Quick Start Guide

## Overview

The Tiko i18n system automatically generates static TypeScript translation files from the database during build time. This provides optimal performance while maintaining the database as the source of truth.

## Setup for Apps

### 1. Configure Your App

Add i18n configuration to your app's `vite.config.ts`:

```typescript
// apps/your-app/vite.config.ts
import { createViteConfig } from '../../vite.config.base'

const pwaConfig = {
  // ... your PWA config
}

const i18nConfig = {
  excludeSections: ['admin', 'deployment', 'media', 'content']  // Sections to exclude
}

export default createViteConfig(__dirname, 3001, pwaConfig, 'your-app-name', i18nConfig)
```

### 2. Use in Components

```vue
<template>
  <div>
    <h1>{{ t('common.title') }}</h1>
    <p>{{ t('user.welcome', { name: userName }) }}</p>
    <button @click="setLocale('nl')">
      {{ t('common.language.dutch') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@tiko/ui'

const { t, setLocale, currentLocale } = useI18n()
const userName = 'John'
</script>
```

## Configuration Options

### Exclude Sections
```typescript
const i18nConfig = {
  excludeSections: ['admin', 'deployment', 'media', 'content']
}
```

### Include Only Specific Sections
```typescript
const i18nConfig = {
  includeSections: ['common', 'user', 'timer']  // Only these sections
}
```

### Specific Languages
```typescript
const i18nConfig = {
  excludeSections: ['admin'],
  languages: ['en', 'nl', 'fr']  // Only these languages
}
```

## Section Examples

- `common.*` - Shared UI elements (save, cancel, loading...)
- `user.*` - User-specific translations
- `auth.*` - Authentication flows
- `admin.*` - Admin dashboard (exclude for regular apps)
- `deployment.*` - DevOps translations (exclude for regular apps)
- `media.*` - Media library (exclude for regular apps)
- `content.*` - CMS content (exclude for regular apps)

## How It Works

1. **Build Time**: The Vite plugin generates TypeScript files from database
2. **Bundle**: Only relevant translations are included in your app
3. **Runtime**: Static translations provide instant lookup with no database queries

## Generated Files

```
packages/ui/src/i18n/generated/
├── .gitignore     # Excludes all generated files from git
├── types.ts       # TypeScript interfaces  
├── index.ts       # Main exports
├── en.ts          # English translations
├── nl.ts          # Dutch translations
└── ...            # Other languages
```

## Benefits

- ✅ **No Runtime Database Queries** - Instant performance
- ✅ **Type Safety** - Full TypeScript support with auto-completion
- ✅ **Small Bundles** - Only include translations your app needs
- ✅ **Git Safe** - Generated files are automatically excluded
- ✅ **Build Integration** - Automatic generation during build process

## Admin Dashboard

For admin pages that need to manage translations, use the database composable:

```typescript
import { useDatabaseI18n } from '@tiko/ui'

const { t, refreshTranslations } = useDatabaseI18n()
```

## Manual Generation

If you need to generate translations manually:

```bash
# Generate all translations for all languages (from workspace root)
pnpm -w run generate:i18n

# Generate for specific app with section filtering
pnpm -w run generate:i18n --app=timer

# Generate for specific languages only
pnpm -w run generate:i18n --languages=en,nl,fr

# Or build your app (automatic generation)
pnpm run build your-app-name
```

## Adding New Translations

1. Add translations in the admin dashboard
2. Build your app (translations auto-generate)
3. Use the new keys with full TypeScript support