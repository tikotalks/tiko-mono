import type { Env, PredictRequest, PredictResponse } from './types'
import { getActiveLanguages, getInitialCards, getSentencePattern, upsertSentencePattern, storeInitialCards } from './database'
import { generatePredictions } from './ai-generator'

export async function handlePredict(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    // Parse query parameters
    const url = new URL(request.url)
    const lang = url.searchParams.get('lang')
    const pathParam = url.searchParams.get('path')

    if (!lang) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameter: lang'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate language is supported
    const supportedLanguages = await getActiveLanguages(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
    if (!supportedLanguages.includes(lang)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Unsupported language: ${lang}`
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse path
    const path = pathParam 
      ? pathParam.split(',').map(word => word.trim()).filter(word => word.length > 0)
      : []

    // If no path, return initial cards
    if (path.length === 0) {
      return handleInitialCards(lang, env)
    }

    // Otherwise, get predictions for the path
    return handlePathPredictions(lang, path, env)

  } catch (error) {
    console.error('Predict error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: `Server error: ${error}`
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

async function handleInitialCards(lang: string, env: Env): Promise<Response> {
  // Check database for initial cards
  let initialCards = await getInitialCards(lang, env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)

  if (!initialCards) {
    // Generate with AI
    const predictions = await generatePredictions({
      languageCode: lang,
      path: [],
      apiKey: env.OPENAI_API_KEY,
      isInitial: true
    })

    // Store for future use
    const cards = predictions.map(p => ({
      word: p.word,
      category: p.category || 'general',
      icon: p.icon
    }))

    await storeInitialCards(lang, cards, env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)

    return new Response(
      JSON.stringify({
        success: true,
        predictions,
        isInitial: true,
        generatedByAI: true
      } as PredictResponse),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  // Convert cards to predictions format
  const predictions = initialCards.cards.map((card, index) => ({
    word: card.word,
    score: 1.0 - (index * 0.02), // Slight score decay by position
    category: card.category,
    icon: card.icon
  }))

  return new Response(
    JSON.stringify({
      success: true,
      predictions,
      isInitial: true,
      generatedByAI: false
    } as PredictResponse),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

async function handlePathPredictions(
  lang: string,
  path: string[],
  env: Env
): Promise<Response> {
  // Create path key for lookup
  const pathKey = path.map(w => w.toLowerCase()).join('_')

  // Check database for existing pattern
  let pattern = await getSentencePattern(lang, pathKey, env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)

  if (!pattern) {
    // Generate with AI
    const predictions = await generatePredictions({
      languageCode: lang,
      path,
      apiKey: env.OPENAI_API_KEY,
      isInitial: false
    })

    // Store for future use
    pattern = {
      language_code: lang,
      path,
      path_key: pathKey,
      predictions,
      usage_count: 0
    }

    await upsertSentencePattern(pattern, env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)

    return new Response(
      JSON.stringify({
        success: true,
        predictions,
        isInitial: false,
        generatedByAI: true
      } as PredictResponse),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  // Return existing predictions
  return new Response(
    JSON.stringify({
      success: true,
      predictions: pattern.predictions,
      isInitial: false,
      generatedByAI: false
    } as PredictResponse),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  )
}