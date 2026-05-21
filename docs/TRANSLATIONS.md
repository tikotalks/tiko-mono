# Translation Management

This document explains the translation workflow for the Tiko project.

## Overview

Translations are managed through a database-driven system with version control and approval workflows. The system supports:

- Database storage of all translations
- Version history and rollback
- Approval workflow for non-admin contributors
- Locale inheritance (e.g., en-GB falls back to en)
- Import/export functionality
- GPT-powered auto-translation (coming soon)

## Architecture

1. **Database**: All translations are stored in Supabase with versioning
2. **Admin UI**: Web interface for managing translations
3. **Export Script**: Generates JSON files for runtime use
4. **Runtime**: Apps use generated JSON files (never query database directly)

## Translation Workflow

### 1. Adding/Editing Translations via UI

1. Navigate to the Translation Admin in the admin tool
2. Select target locale from dropdown
3. Edit translations inline or use the import feature
4. Changes by admins are auto-approved
5. Changes by contributors require admin approval

### 2. Importing Translations

The UI supports importing JSON files:

1. Click the Import button in Translation Admin
2. Select a JSON file with translations
3. Specify the locale code
4. Translations are imported with version history

Expected JSON format:
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "errors": {
    "generic": "An error occurred"
  }
}
```

### 3. Exporting Translations for Runtime

Run the export script to generate JSON files:

```bash
# Set your Supabase service key
export SUPABASE_SERVICE_KEY=your-service-key

# Export all translations
pnpm run translations:export

# Or directly
node scripts/export-translations.js
```

This generates files in `packages/ui/src/i18n/locales/generated/`

### 4. Building with Latest Translations

```bash
# Export translations and build
pnpm run build:with-translations
```

## Database Schema

### Core Tables

- `languages`: Language definitions (en, fr, de, etc.)
- `locales`: Locale variations (en-US, en-GB, fr-CA, etc.)
- `translation_versions`: All translation versions with approval status
- `translation_notifications`: Notifications for review requests

### Key Features

- **Versioning**: Every change creates a new version
- **Approval States**: pending, approved, rejected
- **Locale Inheritance**: Automatic fallback chain
- **Row Level Security**: Access control based on user roles

## Development Workflow

### Local Development

1. Make translation changes in the admin UI
2. Run `pnpm run translations:export` to get latest translations
3. Test your changes locally

### CI/CD Integration

Add to your build pipeline:

```yaml
- name: Export Translations
  env:
    SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
  run: pnpm run translations:export

- name: Build Application
  run: pnpm run build
```

## User Roles

- **Admin**: Can approve/reject translations, full access
- **Editor**: Can approve/reject translations
- **Contributor**: Can suggest translations (require approval)
- **User**: Read-only access to approved translations

## Locale Inheritance

The system implements smart fallback:

1. Specific locale (e.g., en-GB)
2. Parent locale (e.g., en)
3. Default locale (en)

Example: If a key is missing in `fr-CA`, it will check `fr`, then `en`.

## Best Practices

1. **Always use generated files**: Never query the database at runtime
2. **Export before building**: Ensure latest translations are included
3. **Review pending translations**: Check the approval queue regularly
4. **Use semantic keys**: `common.save` instead of `save_button_text`
5. **Maintain consistency**: Follow existing naming patterns

## Troubleshooting

### No translations showing

1. Check if you're authenticated
2. Verify translations exist in database
3. Run export script to generate files

### Authentication errors

- Ensure you have a valid Supabase session
- For scripts, use service key authentication

### Missing translations

- Check locale inheritance is working
- Verify the key exists in the base locale
- Use the i18n validation script: `pnpm run check:i18n`