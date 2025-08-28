# Azure TTS Worker

This Cloudflare Worker provides text-to-speech functionality using Azure Cognitive Services Speech SDK.

## Features

- Support for 100+ languages and locales
- Multiple voices per language with gender options
- Adjustable speech rate (0.5-2.0x)
- Adjustable pitch (-50 to +50 Hz)
- KV caching for fast repeated requests
- R2 storage for audio files
- Language and voice discovery endpoints

## API Endpoints

### GET /languages
Returns all supported languages with their display names and voice counts.

### GET /voices
Returns all available voices. Add `?language=en` to filter by language code.

### POST /generate
Generate speech from text.

Request body:
```json
{
  "text": "Hello world",
  "language": "en",
  "voice": "en-US-JennyNeural",
  "speed": 1.0,  // Optional: 0.5-2.0, default 1.0
  "pitch": 0     // Optional: -50 to +50, default 0
}
```

Response:
```json
{
  "success": true,
  "audioUrl": "/audio?key=audio/abc123.mp3",
  "cached": false,
  "metadata": {
    "url": "/audio?key=audio/abc123.mp3",
    "provider": "azure",
    "language": "en",
    "voice": "en-US-JennyNeural",
    "generatedAt": "2024-12-14T10:00:00Z",
    "size": 12345,
    "speed": 1.0,
    "pitch": 0
  }
}
```

### GET /audio
Retrieve generated audio files.

Query parameters:
- `key`: The audio file key from the generate response

## Environment Variables

### Required Secrets
- `AZURE_SPEECH_KEY`: Your Azure Speech Service subscription key
- `AZURE_SPEECH_REGION`: Your Azure region (e.g., "westeurope")
- `SUPABASE_URL`: Supabase project URL for metadata storage
- `SUPABASE_SERVICE_KEY`: Supabase service role key

### Bindings
- `AUDIO_BUCKET`: R2 bucket for audio file storage
- `AUDIO_CACHE`: KV namespace for metadata caching

## Deployment

```bash
cd workers/azure-tts
npm install
wrangler secret put AZURE_SPEECH_KEY
wrangler secret put AZURE_SPEECH_REGION
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler deploy --env production
```

## Usage in Frontend

```typescript
import { useSpeak } from '@tiko/core';

const { speak, setPreferredProvider } = useSpeak();

// Set Azure as preferred provider
setPreferredProvider('azure');

// Speak with Azure TTS
speak('Hello from Azure!', {
  provider: 'azure',
  voice: 'en-US-JennyNeural',
  speed: 1.2,
  pitch: 10
});
```

## Language Support

Azure TTS supports more languages than OpenAI, including:
- Maltese (mt-MT)
- Catalan (ca-ES) 
- Welsh (cy-GB)
- Irish (ga-IE)
- Basque (eu-ES)
- And many more...

See `src/azure-languages.ts` for the full list of supported languages and voices.