# TTS Generation Worker

This Cloudflare Worker handles OpenAI Text-to-Speech generation for the Cards app.

## Features

- Generates high-quality speech using OpenAI's TTS API
- Caches generated audio in R2 storage for fast retrieval
- Supports multiple languages with automatic fallback
- Deduplicates requests by content hash
- Stores metadata in Supabase for tracking

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create R2 bucket:**
   ```bash
   wrangler r2 bucket create tiko-tts-audio
   ```

3. **Set secrets:**
   ```bash
   # OpenAI API key
   wrangler secret put OPENAI_API_KEY
   
   # Supabase credentials
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_SERVICE_KEY
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
  "language": "en",
  "cardId": "card-123",
  "userId": "user-456"
}
```

**Response:**
```json
{
  "success": true,
  "audioUrl": "/audio?key=audio/user-456/abc123.mp3",
  "metadata": {
    "url": "/audio?key=audio/user-456/abc123.mp3",
    "provider": "openai",
    "language": "en",
    "voice": "nova",
    "model": "tts-1",
    "generatedAt": "2024-01-01T00:00:00Z",
    "size": 123456
  }
}
```

### GET /audio
Retrieve cached audio file.

**Parameters:**
- `key`: The audio file key from the generate response

**Response:**
- Audio file (audio/mpeg) with appropriate caching headers

## Configuration

The worker uses the following environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Supabase service role key
- `AUDIO_BUCKET`: R2 bucket binding (configured in wrangler.toml)

## Language Support

The worker supports all OpenAI TTS languages. For unsupported languages, the app will automatically fallback to browser TTS or a supported language mapping.