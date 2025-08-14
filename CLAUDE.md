# CLAUDE.md - Development Notes

## Commands to Run After Code Changes

When making changes to the Cards app:
```bash
cd apps/cards
npm run typecheck  # Check TypeScript types
npm run lint       # Run ESLint
```

## Known Issues

1. **TypeScript Errors in i18n Generated Types**: The file `packages/ui/src/i18n/generated/types.ts` contains invalid characters that cause TypeScript errors. This is a pre-existing issue and not related to new code changes.

## TTS Integration Notes

The OpenAI TTS integration has been implemented with the following components:

1. **Frontend Service** (`apps/cards/src/services/tts.service.ts`): Handles TTS configuration, language detection, and fallback logic
2. **Enhanced Composable** (`apps/cards/src/composables/useEnhancedTTS.ts`): Combines OpenAI TTS with browser fallback
3. **Worker** (`workers/tts-generation/`): Cloudflare Worker that interfaces with OpenAI API and caches audio in R2

### Environment Variables Required
- `VITE_TTS_WORKER_URL`: URL of the deployed TTS worker

### Worker Secrets Required
- `OPENAI_API_KEY`: OpenAI API key for TTS generation
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_KEY`: Supabase service role key

### Language Fallbacks
The system automatically handles unsupported languages by:
1. Checking if OpenAI supports the language
2. Falling back to browser TTS if available
3. Using a mapped fallback language (e.g., Maltese → English)
4. Gracefully degrading to no audio if all options fail