# Translation Admin Tool

The Translation Admin Tool is a centralized interface for managing all i18n translations in the Tiko monorepo. It allows you to edit, manage, and export translations for all supported languages from a single web interface.

## Features

- **View and Edit Translations**: Browse all translation keys and edit values for any target language
- **Inline Editing**: Edit translations directly in the table with instant save
- **Language Switching**: Easily switch between target languages to manage translations
- **Completion Tracking**: See translation progress for each language with percentage completion
- **Search Functionality**: Search for translation keys or values across all translations
- **Export to JSON**: Export translations for any locale as JSON files
- **Auto-translation Ready**: Infrastructure for GPT-based auto-translation (coming soon)
- **Locale Inheritance**: Automatic fallback from specific locales (e.g., en-GB) to base locales (e.g., en)

## Database Setup

Before using the Translation Admin Tool, you need to set up the database table. Run the SQL script:

```bash
# Connect to your Supabase database and run:
psql -h db.kejvhvszhevfwgsztedf.supabase.co -U postgres -d postgres -f tools/admin/src/database/translations.sql
```

This creates:
- `translations` table with proper structure
- Row Level Security policies
- Indexes for performance
- Trigger for automatic updated_at timestamps
- Function for locale fallback logic

## Usage

1. Navigate to the "Translations" section in the admin panel
2. Select your target language from the dropdown
3. Browse or search for translation keys
4. Click on any translation value to edit it inline
5. Changes are saved automatically when you press Enter or click the save button

## Exporting Translations

Click the "Export" button to download translations for the selected locale as a JSON file. The exported file will:
- Include all translations for the selected locale
- Apply locale inheritance (e.g., en-GB inherits from en)
- Be saved to `tools/admin/translations/{locale}.json`

## Adding New Languages

To add support for a new language:

1. Add the locale code to the `availableLocales` array in `TranslationAdminView.vue`
2. Import existing translations if available
3. Start translating missing keys

## Auto-Translation (Coming Soon)

The tool includes infrastructure for GPT-based auto-translation. When implemented, you'll be able to:
- Auto-translate missing values with one click
- Review and edit auto-translated content
- Track which translations were generated automatically

## Locale Inheritance

The system follows BCP 47 locale inheritance:
- Specific locales (e.g., `en-GB`, `fr-CA`) inherit from base locales (e.g., `en`, `fr`)
- If a translation is missing in `en-GB`, it falls back to `en`
- All locales fall back to `en` as the ultimate default

## API

The Translation Service provides these methods:

```typescript
// Get all unique translation keys
getAllKeys(): Promise<string[]>

// Get translations for a locale
getTranslations(locale: string): Promise<Translation[]>

// Save a translation
saveTranslation(key: string, locale: string, value: string, autoTranslated?: boolean): Promise<Translation>

// Delete a translation
deleteTranslation(key: string, locale: string): Promise<void>

// Get effective value with fallback
getEffectiveValue(key: string, locale: string): Promise<string | null>

// Generate complete JSON for a locale
generateJson(locale: string): Promise<Record<string, string>>

// Import translations from JSON
importTranslations(locale: string, translations: Record<string, string>): Promise<void>
```

## Future Enhancements

- [ ] GPT-4 integration for auto-translation
- [ ] Bulk import/export functionality
- [ ] Translation memory and suggestions
- [ ] Collaborative translation workflow
- [ ] Translation versioning and history
- [ ] Context-aware translations
- [ ] Pluralization support
- [ ] Variable interpolation validation