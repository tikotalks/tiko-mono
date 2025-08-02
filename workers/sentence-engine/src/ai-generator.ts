import type { Prediction } from './types'

interface GenerateOptions {
  languageCode: string
  path: string[]
  apiKey: string
  isInitial?: boolean
}

export async function generatePredictions(options: GenerateOptions): Promise<Prediction[]> {
  const { languageCode, path, apiKey, isInitial = false } = options

  const prompt = isInitial
    ? buildInitialCardsPrompt(languageCode)
    : buildPredictionPrompt(languageCode, path)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in child language development and AAC (Augmentative and Alternative Communication) systems. You help create word predictions for children learning to construct sentences.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data: any = await response.json()
    const content = data.choices[0].message.content

    // Parse the JSON response
    const predictions = JSON.parse(content)
    
    // Ensure we have at least 20 predictions
    return ensureMinimumPredictions(predictions)
  } catch (error) {
    console.error('AI generation error:', error)
    return getFallbackPredictions(languageCode, isInitial)
  }
}

function buildInitialCardsPrompt(languageCode: string): string {
  return `Generate initial word cards for a child's AAC communication app in ${languageCode} language.

Requirements:
- Provide 20-30 common starter words/phrases that children would use
- Include basic needs, wants, feelings, and common actions
- Words should be age-appropriate (3-10 years old)
- Include categories: needs, feelings, people, actions, questions, objects

Return a JSON array with this exact format:
[
  { "word": "I", "score": 0.95, "category": "pronouns" },
  { "word": "want", "score": 0.90, "category": "actions" },
  { "word": "yes", "score": 0.88, "category": "responses" }
]

Language code: ${languageCode}
Return ONLY the JSON array, no explanation.`
}

function buildPredictionPrompt(languageCode: string, path: string[]): string {
  const sentence = path.join(' ')
  
  return `Given the partial sentence "${sentence}" in ${languageCode}, predict the most likely next words for a child (age 3-10) to continue the sentence.

Requirements:
- Provide at least 20 predictions
- Consider common communication needs for children
- Include words from categories: actions, objects, descriptors, people, places
- Score from 1.0 (most likely) to 0.1 (least likely)
- Keep vocabulary age-appropriate
- Consider grammatical correctness for the language

Return a JSON array with this exact format:
[
  { "word": "eat", "score": 0.92, "category": "actions" },
  { "word": "play", "score": 0.87, "category": "actions" },
  { "word": "the", "score": 0.85, "category": "articles" }
]

Current sentence: "${sentence}"
Language: ${languageCode}
Return ONLY the JSON array, no explanation.`
}

function ensureMinimumPredictions(predictions: Prediction[]): Prediction[] {
  if (predictions.length >= 20) {
    return predictions.slice(0, 30) // Cap at 30
  }

  // Add common fallback words to reach 20
  const fallbacks = getCommonWords()
  const existingWords = new Set(predictions.map(p => p.word.toLowerCase()))
  
  for (const fallback of fallbacks) {
    if (!existingWords.has(fallback.word.toLowerCase())) {
      predictions.push(fallback)
      if (predictions.length >= 20) break
    }
  }

  return predictions
}

function getFallbackPredictions(languageCode: string, isInitial: boolean): Prediction[] {
  // Language-specific fallbacks could be added here
  // For now, return English fallbacks as a safe default
  
  if (isInitial) {
    return [
      { word: "I", score: 0.95, category: "pronouns" },
      { word: "want", score: 0.90, category: "actions" },
      { word: "need", score: 0.88, category: "actions" },
      { word: "yes", score: 0.85, category: "responses" },
      { word: "no", score: 0.85, category: "responses" },
      { word: "help", score: 0.82, category: "needs" },
      { word: "please", score: 0.80, category: "polite" },
      { word: "thank you", score: 0.78, category: "polite" },
      { word: "more", score: 0.75, category: "quantity" },
      { word: "stop", score: 0.73, category: "actions" },
      { word: "go", score: 0.70, category: "actions" },
      { word: "eat", score: 0.68, category: "actions" },
      { word: "drink", score: 0.65, category: "actions" },
      { word: "play", score: 0.63, category: "actions" },
      { word: "mom", score: 0.60, category: "people" },
      { word: "dad", score: 0.58, category: "people" },
      { word: "happy", score: 0.55, category: "feelings" },
      { word: "sad", score: 0.53, category: "feelings" },
      { word: "tired", score: 0.50, category: "feelings" },
      { word: "hungry", score: 0.48, category: "feelings" }
    ]
  }

  return getCommonWords()
}

function getCommonWords(): Prediction[] {
  return [
    { word: "the", score: 0.60, category: "articles" },
    { word: "a", score: 0.58, category: "articles" },
    { word: "to", score: 0.55, category: "prepositions" },
    { word: "and", score: 0.53, category: "conjunctions" },
    { word: "it", score: 0.50, category: "pronouns" },
    { word: "is", score: 0.48, category: "verbs" },
    { word: "in", score: 0.45, category: "prepositions" },
    { word: "my", score: 0.43, category: "possessives" },
    { word: "with", score: 0.40, category: "prepositions" },
    { word: "for", score: 0.38, category: "prepositions" },
    { word: "on", score: 0.35, category: "prepositions" },
    { word: "at", score: 0.33, category: "prepositions" },
    { word: "this", score: 0.30, category: "demonstratives" },
    { word: "that", score: 0.28, category: "demonstratives" },
    { word: "can", score: 0.25, category: "modals" },
    { word: "will", score: 0.23, category: "modals" },
    { word: "not", score: 0.20, category: "negation" },
    { word: "all", score: 0.18, category: "quantifiers" },
    { word: "some", score: 0.15, category: "quantifiers" },
    { word: "very", score: 0.13, category: "intensifiers" }
  ]
}