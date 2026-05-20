# TTS Worker Setup

## Database Setup

Apply the D1 schema before deploying:

```bash
wrangler d1 create tiko-tts
wrangler d1 execute tiko-tts --file schema.sql
```

Replace the placeholder `database_id` in `wrangler.toml` with the created D1 database id.

## Required Secrets

```bash
wrangler secret put OPENAI_API_KEY
```

## Environment Variable for Cards App

Add this to your `.env` file in the root of the project:

```env
VITE_TTS_WORKER_URL=https://tts.tikoapi.org
```

## How It Works

1. **Deduplication**: Audio is shared across all users and cards
   - Same text + language + voice + model = same audio file
   - Metadata is stored once in the D1 `tts_audio` table
   - Audio bytes are stored once in R2 at `audio/{hash}.mp3`

2. **Audio Workflow**:
   - Generates unique hash from text + language + voice + model
   - Checks `tts_audio` table for existing audio
   - If found: returns cached audio URL
   - If not found: calls OpenAI API, stores audio in R2, and writes metadata to D1
   - App can fall back to browser TTS on errors

3. **Storage Structure**:
   - **Database**: `tts_audio` table with metadata
   - **R2 Bucket**: Audio files at `audio/{hash}.mp3`
   - **Browser Cache**: Audio elements cached for immediate playback

4. **Language Support**:
   - Detects language from route or defaults to `en`
   - Smart fallbacks (Maltese → English, etc.)
   - Browser TTS for unsupported languages

## Testing

1. Set up the D1 database, R2 bucket, and OpenAI secret
2. Restart your dev server
3. Create a card with speech text
4. Click the card; it should play generated audio
5. Click again; it should use cached audio

Check browser console and worker logs for TTS activity and errors.
