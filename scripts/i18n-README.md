# I18n Translation Script

This script automatically adds translation keys with AI-generated translations to all supported languages.

## Setup

1. **Set OpenAI API Key**: You need an OpenAI API key to use ChatGPT for translations:
   ```bash
   export OPENAI_API_KEY=your_api_key_here
   ```

2. **Make the script executable**:
   ```bash
   chmod +x scripts/i18n-add.mjs
   ```

## Usage

```bash
pnpm i18n:add [key] [value]
```

### Examples

```bash
# Add a common UI element
pnpm i18n:add common.showMore "Show more"

# Add a button label
pnpm i18n:add common.continue "Continue"

# Add an auth-related key
pnpm i18n:add auth.forgotPassword "Forgot Password?"

# Add an app-specific key
pnpm i18n:add cards.createCard "Create new card"
```

## How it works

1. **Key Parsing**: Parses the key path (e.g., `common.showMore`) into section and key name
2. **Existence Check**: Checks if the key already exists in types.ts, keys.ts, and all language files
3. **Interactive Prompt**: If key exists, prompts user to update, skip, or cancel
4. **Language Detection**: Automatically finds all available languages from the `packages/ui/src/i18n/locales/base/` directory
5. **AI Translation**: Calls ChatGPT API to translate the value into all supported languages
6. **Validation**: Ensures all languages have translations before proceeding
7. **File Updates**: 
   - Adds the key to `packages/ui/src/i18n/types.ts` (TranslationSchema interface)
   - Adds the key to `packages/ui/src/i18n/keys.ts`
   - Adds translations to all base locale files (`packages/ui/src/i18n/locales/base/*.ts`)
   - Can update existing translations if user chooses

## Supported Languages

The script automatically supports all languages with base locale files:
- English (en)
- German (de) 
- French (fr)
- Spanish (es)
- Dutch (nl)
- Italian (it)
- Portuguese (pt)
- Polish (pl)
- Russian (ru)
- Swedish (sv)
- And 19+ more languages...

## Validation

After adding translations, run the validation script to ensure everything is correct:

```bash
pnpm -w run check:i18n
```

## Features

### Interactive Key Conflict Resolution
When adding a key that already exists, the script will:
- Show where the key exists (types.ts, keys.ts, language files)
- Ask if you want to update existing translations
- Allow you to cancel the operation

Example:
```
⚠️  Key already exists in:
  - TranslationSchema (types.ts)
  - Translation keys (keys.ts)
  - Language files: en, es, fr, de, nl, it, pt, pl, ru, sv

Do you want to update existing translations? (yes/no/cancel): 
```

## Error Handling

The script includes comprehensive error handling for:
- Missing OpenAI API key
- Invalid key format
- API failures
- Missing sections in locale files
- Duplicate keys (with option to update)
- File system errors
- TypeScript interface updates

## Notes

- **Cost**: Each translation request uses OpenAI API credits
- **Quality**: Uses GPT-4 for high-quality translations with temperature 0.3 for consistency
- **Safety**: Validates all responses before writing to files
- **Backup**: Always commit your changes before running the script

## Troubleshooting

### "Missing script" error
Make sure you're running from the workspace root:
```bash
cd /path/to/tiko-mono
pnpm i18n:add common.test "Test"
```

### API key issues
```bash
# Check if API key is set
echo $OPENAI_API_KEY

# Set it temporarily
export OPENAI_API_KEY=sk-your-key-here

# Set it permanently in your shell profile
echo 'export OPENAI_API_KEY=sk-your-key-here' >> ~/.bashrc
source ~/.bashrc
```

### Invalid JSON response
If ChatGPT returns invalid JSON, the script will show the raw response and exit. This is usually temporary - try running the command again.