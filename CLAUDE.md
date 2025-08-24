# CLAUDE.md - Development Notes

## IMPORTANT: Git Commit Rules

**NEVER include "Co-Authored-By: Claude" in commit messages.** The user does not want Claude credited as a co-author in commits.

**DO NOT COMMIT CHANGES WITHOUT EXPLICIT USER PERMISSION.** Only commit when:
- The user explicitly tells you to "commit" 
- The user asks you to "deploy" (which requires a commit)
- Otherwise, make all changes but DO NOT run git commit or git push

## Commands to Run After Code Changes

When making changes to the Cards app:
```bash
cd apps/cards
npm run typecheck  # Check TypeScript types
npm run lint       # Run ESLint
```

## Translation System Rules

**CRITICAL: DO NOT EDIT LANGUAGE FILES**
- NEVER edit any files in `packages/ui/src/i18n/generated/` directories
- Translation keys are managed in the database, not in code files
- When encountering missing translation keys, use direct string literals (e.g., `t('yesno.buttonSize')`) in the code
- The user will add missing keys to the database separately
- Language files are auto-generated and should never be manually modified

**When providing translation keys to user:**
- Format as `key : value` with each key on a new line
- Always provide values in English
- Do not use quotes (") in the values
- Example format:
```
yesno.buttonSize : Button Size
yesno.small : Small
yesno.medium : Medium
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

## Deployment via Commit Messages

The repository uses GitHub Actions for automated deployments to Cloudflare Pages and Workers. Deployments can be triggered through special keywords in commit messages.

### Commit Message Triggers for Apps

Apps are deployed to Cloudflare Pages when pushing to the `master` branch with the following triggers:

- `[build:cards]` - Deploy only the Cards app
- `[build:timer]` - Deploy only the Timer app
- `[build:yes-no]` - Deploy only the Yes-No app
- `[build:radio]` - Deploy only the Radio app
- `[build:todo]` - Deploy only the Todo app
- `[build:type]` - Deploy only the Type app
- `[build:all]` or `[build:apps]` - Deploy all apps

Example:
```bash
git commit -m "feat: add new feature to cards app [build:cards]"
git push origin master
```

### Commit Message Triggers for Workers

Workers are deployed to Cloudflare Workers with these triggers:

- `[build:i18n-translator]` - Deploy only the i18n translator worker
- `[build:media-upload]` - Deploy only the media upload worker
- `[build:sentence-engine]` - Deploy only the sentence engine worker
- `[build:report-issue]` - Deploy only the report issue worker
- `[build:all]` or `[build:workers]` - Deploy all workers

### Multiple Deployments

You can trigger multiple deployments in a single commit:
```bash
git commit -m "fix: update cards and i18n system [build:cards] [build:i18n-translator]"
```

### Manual Deployments

Deployments can also be triggered manually via GitHub Actions:
1. Go to the Actions tab in the repository
2. Select either "Deploy Apps to Cloudflare Pages" or "Deploy Cloudflare Workers"
3. Click "Run workflow"
4. Select the target to deploy

### Deployment URLs

After successful deployment:
- **Apps**: Available at `https://tiko-{app-name}.pages.dev` (e.g., `https://tiko-cards.pages.dev`)
- **Workers**: Available via their configured routes on `tikoapi.org`

## Missing Translation Keys

The following translation keys need to be added to the database:

```
sequence.play : Play
sequence.playMode : Play Mode
sequence.restart : Restart
```