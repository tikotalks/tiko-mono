# Tiko I18n System Documentation

This document describes the comprehensive internationalization (i18n) system for Tiko applications.

## Overview

The Tiko i18n system provides static, type-safe translations that are generated from a database source of truth. This approach combines the benefits of centralized translation management with the performance and reliability of static assets.

### Key Features

- **Database as Source of Truth**: All translations are managed in Supabase
- **Static Generation**: TypeScript files generated at build time
- **Section Filtering**: Apps only include relevant translation sections
- **Type Safety**: Full TypeScript support with auto-completion
- **Performance**: No runtime database queries
- **Git-Safe**: Generated files are excluded from version control

## Architecture

```
Database (Supabase)
       ↓
   Generation Script
       ↓
  TypeScript Files (per app)
       ↓
    App Bundle
```

## Quick Start

### 1. Generate Translation Files

```bash
# Generate all languages for local development
pnpm run generate:i18n

# Generate for specific app (filters sections)
pnpm run generate:i18n --app=yes-no

# Generate specific languages only
pnpm run generate:i18n --languages=en,nl,fr
```

### 2. Add Plugin to App

Add the i18n generation plugin to your app's `vite.config.ts`:

```typescript
import { createAppI18nPlugin } from '../../scripts/vite-plugin-i18n-generation'

export default defineConfig({
  plugins: [
    vue(),
    createAppI18nPlugin('yes-no'), // Your app name
    // ... other plugins
  ]
})
```

### 3. Use in Components

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
import { useStaticI18n } from '@tiko/ui'

const { t, setLocale, currentLocale } = useStaticI18n()
const userName = 'John'
</script>
```

## Section Filtering

Apps can filter which translation sections they include to reduce bundle size:

### App Configuration

Edit `/scripts/generate-language-files.ts` to configure section filtering:

```typescript
const APP_SECTION_CONFIG = {
  'yes-no': {
    excluded: ['admin', 'deployment', 'media', 'content']
  },
  'admin': {
    excluded: [] // Admin includes everything
  },
  'timer': {
    excluded: ['admin', 'deployment', 'media', 'content']
  }
}
```

### Section Examples

- `common.*` - Shared UI elements (buttons, messages)
- `admin.*` - Admin dashboard translations
- `deployment.*` - Deployment and DevOps translations
- `media.*` - Media library translations
- `content.*` - CMS content translations
- `user.*` - User-specific translations
- `auth.*` - Authentication flows

## Generated Files Structure

```
packages/ui/src/i18n/generated/
├── .gitignore           # Excludes all generated files
├── types.ts             # TypeScript interfaces
├── index.ts             # Main export file
├── en.ts                # English translations
├── nl.ts                # Dutch translations
├── fr.ts                # French translations
└── yes-no.ts            # App-specific export (if building for specific app)
```

### Example Generated File

```typescript
// packages/ui/src/i18n/generated/en.ts
import type { Translations } from './types'

const translations: Translations = {
  common: {
    save: "Save",
    cancel: "Cancel",
    loading: "Loading..."
  },
  user: {
    welcome: "Welcome, {name}!",
    profile: "Profile"
  }
}

export default translations
```

### TypeScript Interfaces

```typescript
// packages/ui/src/i18n/generated/types.ts
export interface Translations {
  common: {
    save: string
    cancel: string
    loading: string
  }
  user: {
    welcome: string
    profile: string
  }
}

export type TranslationKey = 'common.save' | 'common.cancel' | 'user.welcome' | 'user.profile'
```

## API Reference

### useStaticI18n()

Main composable for using static translations:

```typescript
const {
  t,                    // Translation function
  tl,                   // Translation with explicit locale
  currentLocale,        // Reactive current locale
  setLocale,           // Set locale function
  availableLocales,    // Available locales
  hasKey,              // Check if key exists
  getAllTranslations   // Get all translations for current locale
} = useStaticI18n()
```

### Translation Function

```typescript
// Basic usage
t('common.save')                    // "Save"

// With parameters
t('user.welcome', { name: 'John' }) // "Welcome, John!"

// With explicit locale
tl('common.save', 'nl')            // "Opslaan"
```

### Locale Management

```typescript
// Get current locale
console.log(currentLocale.value)   // "en"

// Set locale
await setLocale('nl')

// Check available locales
console.log(availableLocales.value) // ["en", "nl", "fr"]
```

## Development Workflow

### Adding New Translations

1. **Add to Database**: Use the admin dashboard to add new translation keys
2. **Regenerate Files**: Run `pnpm run generate:i18n`
3. **Use in Code**: Import and use the new keys with type safety

### During Development

The Vite plugin automatically regenerates translation files when:
- Starting development server
- Building for production
- Translation files change (with watch enabled)

### Manual Regeneration

```bash
# Regenerate all translations
pnpm run generate:i18n

# Regenerate for specific app
pnpm run generate:i18n --app=yes-no

# Regenerate with verbose logging
pnpm run generate:i18n --verbose

# Regenerate specific languages
pnpm run generate:i18n --languages=en,nl
```

## Build Integration

### Automatic Generation

The Vite plugin runs generation automatically:

```typescript
// vite.config.ts
import { createAppI18nPlugin } from '../../scripts/vite-plugin-i18n-generation'

export default defineConfig({
  plugins: [
    createAppI18nPlugin('yes-no'),
  ]
})
```

### Manual Build Steps

For custom build processes:

```bash
# 1. Generate translations
pnpm run generate:i18n --app=yes-no --production

# 2. Build app
pnpm run build:app yes-no
```

## Advanced Usage

### Scoped Translations

Create scoped translation functions for cleaner code:

```typescript
import { createScopedT } from '@tiko/ui'

// Create scoped function for user translations
const tu = createScopedT('user')

// Use without prefix
tu('welcome', { name: 'John' })  // Uses 'user.welcome'
tu('profile')                   // Uses 'user.profile'
```

### Custom Options

```typescript
const { t } = useStaticI18n({
  fallbackLocale: 'en',
  persistLocale: true,
  storageKey: 'my-app:locale'
})
```

### Runtime Locale Detection

```typescript
// Browser locale detection with fallback
const { t, setLocale } = useStaticI18n()

// This happens automatically, but can be customized
const browserLocale = navigator.language
if (availableLocales.value.includes(browserLocale)) {
  await setLocale(browserLocale)
}
```

## Migration Guide

### From Database I18n

If you're migrating from database-driven i18n:

1. **Add Generation Plugin**:
   ```typescript
   // vite.config.ts
   plugins: [
     createAppI18nPlugin('your-app-name')
   ]
   ```

2. **Update Imports**:
   ```typescript
   // Old
   import { useDatabaseTranslations } from '@tiko/ui'
   
   // New
   import { useStaticI18n } from '@tiko/ui'
   ```

3. **Generate Files**:
   ```bash
   pnpm run generate:i18n --app=your-app-name
   ```

### From Manual JSON Files

If you have manual JSON translation files:

1. **Import to Database**: Use the admin import feature
2. **Generate Static Files**: Run the generation script
3. **Update Code**: Switch to `useStaticI18n`

## Troubleshooting

### Common Issues

**❌ "Generated translation files not found"**
```bash
# Solution: Generate the files
pnpm run generate:i18n --app=your-app-name
```

**❌ "Invalid locale"**
```typescript
// Solution: Check available locales
const { availableLocales } = useStaticI18n()
console.log(availableLocales.value)
```

**❌ "Translation missing for key"**
- Check if key exists in database
- Verify section filtering isn't excluding the key
- Regenerate files after adding new keys

### Debug Mode

Enable verbose logging:

```bash
pnpm run generate:i18n --verbose --app=your-app
```

### Manual Debugging

```typescript
const { getAllTranslations, hasKey } = useStaticI18n()

// Check what translations are loaded
console.log(getAllTranslations())

// Check if specific key exists
console.log(hasKey('common.save'))
```

## Performance Benefits

### Build Time
- ✅ No runtime database queries
- ✅ Tree-shaking removes unused translations
- ✅ TypeScript optimization

### Bundle Size
- ✅ Section filtering reduces size
- ✅ Only includes needed languages
- ✅ Minification-friendly structure

### Runtime Performance
- ✅ Instant translation lookup
- ✅ No async loading delays
- ✅ Memory-efficient caching

## Best Practices

1. **Use Section Filtering**: Configure apps to only include relevant sections
2. **Type Safety**: Always use TypeScript interfaces for translation keys
3. **Fallback Strategy**: Configure fallback locales for missing translations
4. **Build Integration**: Use Vite plugin for automatic generation
5. **Git Hygiene**: Keep generated files out of version control
6. **Testing**: Test with different locales during development

## Contributing

When adding new features to the i18n system:

1. Update the generation script in `/scripts/generate-language-files.ts`
2. Update the Vite plugin in `/scripts/vite-plugin-i18n-generation.ts`
3. Update the composable in `/packages/ui/src/composables/useStaticI18n.ts`
4. Update this documentation
5. Add tests for new functionality

## Related Files

- `/scripts/generate-language-files.ts` - Main generation script
- `/scripts/vite-plugin-i18n-generation.ts` - Vite integration
- `/packages/ui/src/composables/useStaticI18n.ts` - Runtime composable
- `/packages/core/src/services/translation.service.ts` - Database service
- `/tools/admin/` - Translation management UI