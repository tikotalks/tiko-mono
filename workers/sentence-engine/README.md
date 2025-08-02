# Tiko Sentence Engine Worker

A Cloudflare Worker that provides intelligent word predictions to help kids build sentences. It uses AI to generate contextually appropriate predictions and learns from usage patterns.

## Features

- 🌍 Multi-language support (all languages from i18n_languages)
- 🤖 AI-powered prediction generation
- 📊 Score-based ranking that improves with usage
- 💾 Caching of predictions for performance
- 🎯 Age-appropriate vocabulary (3-10 years)
- 📱 Designed for AAC (Augmentative and Alternative Communication) apps

## API Endpoints

### GET /predict

Get word predictions based on the current sentence path.

**Parameters:**
- `lang` (required): Language code (e.g., 'en', 'fr', 'es')
- `path` (optional): Comma-separated words already selected

**Examples:**
```bash
# Get initial cards for English
GET https://tikoapi.org/sentence/predict?lang=en

# Get predictions after "I want"
GET https://tikoapi.org/sentence/predict?lang=en&path=I,want
```

**Response:**
```json
{
  "success": true,
  "predictions": [
    { "word": "to", "score": 0.92, "category": "prepositions" },
    { "word": "a", "score": 0.87, "category": "articles" },
    { "word": "the", "score": 0.85, "category": "articles" }
  ],
  "isInitial": false,
  "generatedByAI": false
}
```

### POST /select

Record that a user selected a specific word. This helps improve predictions over time.

**Request Body:**
```json
{
  "lang": "en",
  "path": ["I", "want"],
  "choice": "to",
  "userId": "optional-user-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Selection recorded successfully"
}
```

## How It Works

1. **Initial Cards**: When no path is provided, returns common starter words appropriate for children
2. **Predictions**: For existing paths, returns contextually appropriate next words
3. **AI Generation**: If predictions don't exist in the database, uses GPT-4 to generate them
4. **Learning**: Each selection updates scores to improve future predictions
5. **Caching**: All generated predictions are stored for fast retrieval

## Environment Variables

Set these using `wrangler secret put`:

- `OPENAI_API_KEY` - Your OpenAI API key for generating predictions
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key

## Database Schema

The worker uses three main tables:

- `sentence_patterns` - Stores prediction patterns for word sequences
- `sentence_initial_cards` - Stores initial word cards for each language
- `sentence_usage` - Tracks word selections for improving predictions

## Local Development

```bash
# Install dependencies
pnpm install

# Run locally
pnpm run dev

# Deploy to production
pnpm run deploy
```

## Integration

### Using the Service

```typescript
import { sentenceService } from '@tiko/core'

// Get predictions
const response = await sentenceService.getPredictions('en', ['I', 'want'])
console.log(response.predictions)

// Record selection
await sentenceService.recordSelection({
  lang: 'en',
  path: ['I', 'want'],
  choice: 'to'
})
```

### Using the Composable

```vue
<template>
  <div>
    <p>Current sentence: {{ sentence }}</p>
    
    <div v-if="isLoading">Loading predictions...</div>
    
    <button 
      v-for="prediction in predictions" 
      :key="prediction.word"
      @click="selectWord(prediction.word)"
    >
      {{ prediction.word }}
    </button>
    
    <button @click="removeLastWord" :disabled="!hasPath">
      Remove Last
    </button>
    
    <button @click="clearPath">
      Clear
    </button>
  </div>
</template>

<script setup>
import { useSentenceBuilder } from '@tiko/core'

const {
  sentence,
  predictions,
  isLoading,
  hasPath,
  selectWord,
  removeLastWord,
  clearPath
} = useSentenceBuilder({
  language: 'en',
  maxPathLength: 20
})
</script>
```

## Deployment

The worker is automatically deployed via GitHub Actions when changes are pushed to the master branch.

## Performance

- Initial predictions are cached per language
- Path predictions are cached and reused
- Scores are updated asynchronously to not block responses
- AI generation happens only when needed

## Future Enhancements

- User-specific personalization
- Grammar-aware predictions
- Context categories (home, school, play)
- Voice integration
- Predictive phrases (multi-word predictions)