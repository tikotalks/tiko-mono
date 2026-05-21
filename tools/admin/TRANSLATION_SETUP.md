# Translation System Setup

## Quick Start

1. **Login to Admin Tool**
   - Navigate to the admin tool
   - Login with your credentials

2. **Import Existing Translations**
   - Go to "Translations" in the menu
   - Click the "Import" button (upload icon)
   - Select a JSON file from `packages/ui/src/i18n/locales/base/`
   - Enter the locale code (e.g., "en", "fr", "de")
   - Click Import

3. **Repeat for Each Locale**
   - Import each locale file one by one
   - The system will create versions and maintain history

## Manual Database Import (Alternative)

If you need to import all translations at once via script:

```bash
cd tools/admin/scripts
SUPABASE_SERVICE_KEY=your-service-key node import-translations-simple.js
```

## Viewing Translations

Once imported, you can:
- View all translations in the table
- Edit values inline
- Filter by locale
- See completion statistics
- Review pending translations (if any)

## Notes

- The import creates approved translations automatically when done by an admin
- Each import creates a new version if the key already exists
- The system maintains full version history