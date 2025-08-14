# TTS Service

The TTS (Text-to-Speech) service provides high-quality audio generation using OpenAI's TTS API with intelligent fallbacks to browser TTS.

## Features

- **OpenAI TTS Integration**: High-quality speech generation
- **Automatic Fallbacks**: Browser TTS for unsupported languages
- **Deduplication**: Same text across apps shares the same audio file
- **Language Support**: Smart mapping for unsupported languages
- **Caching**: Audio files cached for instant playback
- **Preloading**: Background audio generation for better UX

## Quick Start

```typescript
import { useSpeak } from '@tiko/core';

// In your Vue component
const { speak, preloadAudio } = useSpeak(); // Automatically uses user's language

// Simple usage (uses user's language)
speak('Hello world');

// With specific language override
speak('Bonjour le monde', { language: 'fr', voice: 'nova' });

// Preload audio for multiple texts
preloadAudio([
  { text: 'Hello' }, // Uses user's language
  { text: 'Goodbye' },
  { text: 'How are you?', language: 'fr' } // Override language
]);
```

## Architecture

### Core Components

1. **TTS Service** (`tts.service.ts`): Handles audio generation and caching
2. **useSpeak Composable** (`useSpeak.ts`): Vue composable for easy integration
3. **Worker** (`workers/tts-generation/`): Cloudflare Worker for OpenAI API calls
4. **Database**: `tts_audio` table for deduplication across all users

### Audio Flow

1. **Check Cache**: Look for existing audio in database
2. **Generate**: If not found, call OpenAI TTS API via worker
3. **Store**: Save audio file in R2 bucket and metadata in database
4. **Fallback**: Use browser TTS if any step fails

### Language Support

- **Supported**: 28+ languages with OpenAI TTS
- **Fallback Mapping**: Unsupported languages map to similar ones (e.g., Maltese → English)
- **Browser TTS**: Final fallback for edge cases

## API Reference

### useSpeak()

```typescript
const {
  speak,           // (text: string, options?: SpeakOptions) => Promise<void>
  stop,            // () => void
  pause,           // () => void  
  resume,          // () => void
  preloadAudio,    // (texts: Array<{text: string, language?: string}>) => Promise<void>
  clearCache,      // () => void
  isLoading,       // Ref<boolean>
  error,           // Ref<string | null>
  currentMetadata  // Ref<AudioMetadata | null>
} = useSpeak(); // Automatically uses user's language from auth store
```

### SpeakOptions

```typescript
interface SpeakOptions {
  voice?: string;              // OpenAI voice: 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
  model?: 'tts-1' | 'tts-1-hd'; // Model: 'tts-1' (fast) or 'tts-1-hd' (high quality)
  language?: string;           // Language code: 'en', 'es', 'fr', etc.
}
```

## Setup Requirements

1. **Database Migration**: Run the `tts_audio` table migration
2. **Environment Variables**:
   - `VITE_TTS_WORKER_URL`: Worker endpoint
   - `VITE_SUPABASE_URL`: Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
3. **Worker Secrets**:
   - `OPENAI_API_KEY`: OpenAI API key
   - `SUPABASE_URL`: Supabase project URL  
   - `SUPABASE_SERVICE_KEY`: Supabase service role key

## Examples

### Basic Usage in Cards App

```vue
<script setup>
import { useSpeak } from '@tiko/core';

const { speak } = useSpeak(); // Uses user's language automatically

const handleCardClick = (card) => {
  if (card.speech) {
    speak(card.speech); // Speaks in user's language
  }
};
</script>
```

### Preloading in App Initialization

```typescript
// When cards load, preload their audio
const { preloadAudio } = useSpeak();

const loadCards = async () => {
  const cards = await getCards();
  
  // Preload audio in background
  const textsToPreload = cards
    .filter(card => card.speech)
    .map(card => ({ text: card.speech }));
    
  preloadAudio(textsToPreload);
};
```

### Multi-language Support

```typescript
// Language detection from route
const { speak } = useSpeak(route.query.lang || 'en');

// Dynamic language
speak('Hola mundo', { language: 'es' });
speak('Bonjour', { language: 'fr' });
speak('こんにちは', { language: 'ja' });
```

## Language Fallbacks

Unsupported languages automatically fallback to similar supported languages:

- Maltese (`mt`) → English (`en`)
- Catalan (`ca`) → Spanish (`es`)  
- Welsh (`cy`) → English (`en`)
- Ukrainian (`uk`) → Russian (`ru`)
- And many more...

## Performance

- **Deduplication**: Same text shared across all users and apps
- **Caching**: Audio elements cached in browser for instant replay
- **Preloading**: Background generation prevents delays
- **CDN**: Audio files served from Cloudflare R2 with global edge cache