# TTS Generation Worker

This Cloudflare Worker handles OpenAI Text-to-Speech generation for the Cards app.

## Features

- Generates speech using OpenAI's TTS API
- Caches generated audio in R2 storage for fast retrieval
- Supports multiple languages with automatic fallback
- Deduplicates requests by content hash
- Stores metadata in Cloudflare D1 for tracking

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create resources:**
   ```bash
   wrangler r2 bucket create tiko-tts-audio
   wrangler d1 create tiko-tts
   wrangler d1 execute tiko-tts --file schema.sql
   ```

3. **Set secrets:**
   ```bash
   wrangler secret put OPENAI_API_KEY
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

## API Endpoints

### POST /generate

Generate TTS audio for text.

**Request:**
```json
{
  "text": "Hello world",
  "voice": "nova",
  "model": "tts-1",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "audioUrl": "/audio?key=audio/abc123.mp3",
  "cached": false
}
```

### GET /audio

Retrieve cached audio file.

**Parameters:**
- `key`: The audio file key from the generate response

**Response:**
- Audio file (audio/mpeg) with appropriate caching headers

## Bindings

- `OPENAI_API_KEY`: OpenAI API key secret
- `AUDIO_BUCKET`: R2 bucket binding configured in `wrangler.toml`
- `TTS_DB`: D1 database binding configured in `wrangler.toml`

## Language Support

The worker supports all OpenAI TTS languages. For unsupported languages, the app can fallback to browser TTS or a supported language mapping.
