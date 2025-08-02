# Tiko i18n Translator Worker

A Cloudflare Worker that automatically translates UI text to multiple languages using OpenAI GPT-4 and stores the translations in Supabase.

## Features

- Accepts a translation key and English text
- Fetches active languages from the database (only base language codes)
- Automatically translates to all active languages (or specific ones)
- Stores translations in Supabase database using proper key IDs
- Provides context-aware translations for better accuracy
- Returns confidence scores for translations
- Supports versioning and auto-publishing

## API Usage

### Endpoint

```
POST https://api.tiko.app/translate
```

### Request Body

```json
{
  "key": "common.save",
  "englishTranslation": "Save",
  "languages": ["fr", "es", "de"], // Optional: defaults to all non-English languages
  "context": "Button label for saving form data", // Optional: helps improve translation accuracy
  "namespace": "common" // Optional: for organizing translations
}
```

### Response

```json
{
  "success": true,
  "key": "common.save",
  "translations": {
    "en-GB": "Save",
    "en-US": "Save",
    "fr": "Enregistrer",
    "es": "Guardar",
    "de": "Speichern"
  },
  "metadata": {
    "timestamp": "2024-01-17T10:30:00Z",
    "model": "gpt-4-turbo-preview"
  }
}
```

## Language Support

The worker automatically fetches active languages from the `i18n_languages` table in the database. Only base language codes (without dashes) are used for translations. Examples:

- `de` - German
- `el` - Greek
- `es` - Spanish
- `fr` - French
- `it` - Italian
- `nl` - Dutch
- `pl` - Polish
- `pt` - Portuguese
- `ro` - Romanian
- `ru` - Russian
- `sv` - Swedish

Locale-specific codes like `en-GB`, `fr-CA`, etc. are filtered out during translation.

## Environment Variables

Set these using `wrangler secret put`:

- `OPENAI_API_KEY` - Your OpenAI API key
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key

## Local Development

```bash
# Install dependencies
pnpm install

# Run locally
pnpm run dev

# Deploy to production
pnpm run deploy
```

## Database Schema

The worker uses the following tables in Supabase:

### i18n_languages
```sql
CREATE TABLE i18n_languages (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  native_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### i18n_keys
```sql
CREATE TABLE i18n_keys (
  id SERIAL PRIMARY KEY,
  key VARCHAR(500) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id)
);
```

### i18n_translations
```sql
CREATE TABLE i18n_translations (
  id SERIAL PRIMARY KEY,
  key_id INTEGER REFERENCES i18n_keys(id) ON DELETE CASCADE,
  language_code VARCHAR(10) REFERENCES i18n_languages(code) ON DELETE CASCADE,
  value TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  UNIQUE(key_id, language_code, version)
);
```

## Example Usage

```javascript
const response = await fetch('https://api.tiko.app/translate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    key: 'timer.start',
    englishTranslation: 'Start Timer',
    context: 'Button to start a countdown timer in the timer app'
  })
})

const result = await response.json()
console.log(result.translations)
```