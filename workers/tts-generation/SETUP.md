# TTS Worker Setup

Your worker is deployed at: https://tts-generation.silvandiepen.workers.dev

## Database Setup

First, run the database migration to create the audio table:
```sql
-- Run this in your Supabase SQL editor
-- File: supabase/migrations/20241214_create_audio_table.sql
```

## Required Secrets

You need to set the following secrets for the worker to function:

### 1. OpenAI API Key
```bash
npx wrangler secret put OPENAI_API_KEY
# Enter your OpenAI API key when prompted
```

### 2. Supabase URL
```bash
npx wrangler secret put SUPABASE_URL
# Enter your Supabase project URL (e.g., https://xyzcompany.supabase.co)
```

### 3. Supabase Service Key
```bash
npx wrangler secret put SUPABASE_SERVICE_KEY
# Enter your Supabase service role key (NOT the anon key)
```

## Environment Variable for Cards App

Add this to your `.env` file in the root of the project:
```
VITE_TTS_WORKER_URL=https://tts-generation.silvandiepen.workers.dev
```

## How It Works

1. **Deduplication**: Audio is shared across all users and cards
   - Same text + language + voice = same audio file
   - Stored once in `tts_audio` table and R2 bucket
   - Reduces storage costs and generation time

2. **Audio Workflow**:
   - When you call `speak('Hello world')`:
   - Generates unique hash from text+language+voice+model
   - Checks `tts_audio` table for existing audio
   - If exists: Returns cached audio URL
   - If not: Calls OpenAI API, stores in R2 and database
   - Falls back to browser TTS on any error

3. **Storage Structure**:
   - **Database**: `tts_audio` table with metadata
   - **R2 Bucket**: Audio files at `audio/{hash}.mp3`
   - **Browser Cache**: Audio elements cached for immediate playback

4. **Language Support**:
   - Detects language from route or defaults to 'en'
   - Smart fallbacks (Maltese → English, etc.)
   - Browser TTS for unsupported languages

5. **Preloading**: 
   - When cards load, audio is preloaded in background
   - Instant playback when user clicks card

## Testing

1. Set up secrets and environment variable
2. Restart your dev server
3. Create a card with speech text
4. Click the card - should play OpenAI-generated audio
5. Click again - should use cached audio (faster)

Check browser console for TTS activity and any errors.