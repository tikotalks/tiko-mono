# Translation Workflow

## Overview

The translation system uses a **database for management** and **JSON files for runtime**. This ensures:
- Fast performance (no database queries during app usage)
- Version control for translations
- Offline capability
- Easy deployment

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Translation    │     │   Export/Build   │     │   Vue Apps      │
│  Admin Tool     │────▶│     Process      │────▶│   (Runtime)     │
│  (Database)     │     │  (JSON Files)    │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Workflow Steps

### 1. Development Phase
- Developers add new keys to `packages/ui/src/i18n/keys.ts`
- Keys are typed and provide autocomplete in IDEs

### 2. Translation Management
- Use Translation Admin Tool at `/translations`
- Add/edit translations for all locales
- Translations stored in database with metadata

### 3. Export Process
- Run export script to generate JSON files
- Files saved to `packages/ui/src/i18n/locales/generated/`
- One JSON file per locale

### 4. Build Process
- Build script includes generated JSON files
- i18n system loads from static JSON (no database calls)
- Apps work offline with bundled translations

### 5. Deployment
- JSON files are part of the build artifact
- No database connection needed at runtime
- Fast translation lookups from memory

## Commands

### Export Translations (Manual)
```bash
# Export all locales to JSON
pnpm run translations:export

# Export specific locale
pnpm run translations:export --locale=fr
```

### Build with Fresh Translations
```bash
# Export translations and build
pnpm run build:with-translations
```

### Import Existing Translations to Database
```bash
# One-time import of existing translations
pnpm run translations:import
```

## File Structure

```
packages/ui/src/i18n/
├── keys.ts                     # Translation key definitions (source of truth)
├── locales/
│   ├── base/                   # Base translations (legacy, being migrated)
│   │   └── en.ts
│   └── generated/              # Generated from database (gitignored)
│       ├── en.json
│       ├── fr.json
│       ├── de.json
│       └── ...
└── index.ts                    # Loads from generated JSON files
```

## Build Integration

Add to `package.json`:
```json
{
  "scripts": {
    "translations:export": "node tools/admin/scripts/export-translations.js",
    "translations:import": "node tools/admin/scripts/import-translations.js",
    "prebuild": "pnpm run translations:export",
    "build": "vite build"
  }
}
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Build and Deploy
on: [push]

jobs:
  build:
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm run translations:export
      - run: pnpm run build
      - run: pnpm run deploy
```

## Benefits

1. **Performance**: No database queries at runtime
2. **Reliability**: Works offline, no external dependencies
3. **Version Control**: Can track translation changes in git
4. **Type Safety**: Generated types from keys.ts
5. **Flexibility**: Easy to switch translation sources

## Migration Path

1. **Phase 1**: Import existing translations to database
2. **Phase 2**: Use admin tool for new translations
3. **Phase 3**: Export to JSON for builds
4. **Phase 4**: Deprecate hardcoded locale files

## Best Practices

- **Always export before building** for production
- **Don't commit generated JSON files** (add to .gitignore)
- **Use keys.ts** as the source of truth for structure
- **Test with exported translations** before deploying