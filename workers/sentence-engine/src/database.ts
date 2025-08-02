import type { SentencePattern, InitialCards, SentenceUsage, Prediction } from './types'

export async function getActiveLanguages(supabaseUrl: string, supabaseKey: string): Promise<string[]> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/i18n_languages?is_active=eq.true&code=not.like.*-*&select=code`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch languages: ${response.status}`)
  }

  const languages: Array<{ code: string }> = await response.json()
  return languages.map((lang) => lang.code)
}

export async function getInitialCards(
  languageCode: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<InitialCards | null> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/sentence_initial_cards?language_code=eq.${languageCode}`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch initial cards: ${response.status}`)
  }

  const results: InitialCards[] = await response.json()
  return results.length > 0 ? results[0] : null
}

export async function getSentencePattern(
  languageCode: string,
  pathKey: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<SentencePattern | null> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/sentence_patterns?language_code=eq.${languageCode}&path_key=eq.${pathKey}`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch pattern: ${response.status}`)
  }

  const results: SentencePattern[] = await response.json()
  return results.length > 0 ? results[0] : null
}

export async function upsertSentencePattern(
  pattern: SentencePattern,
  supabaseUrl: string,
  supabaseKey: string
): Promise<void> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/sentence_patterns`,
    {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        language_code: pattern.language_code,
        path: pattern.path,
        path_key: pattern.path_key,
        predictions: pattern.predictions,
        usage_count: pattern.usage_count,
        updated_at: new Date().toISOString()
      })
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upsert pattern: ${response.status} - ${error}`)
  }
}

export async function recordUsage(
  usage: SentenceUsage,
  supabaseUrl: string,
  supabaseKey: string
): Promise<void> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/sentence_usage`,
    {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(usage)
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to record usage: ${response.status} - ${error}`)
  }
}

export async function updatePatternScores(
  languageCode: string,
  pathKey: string,
  selectedWord: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<void> {
  // Get current pattern
  const pattern = await getSentencePattern(languageCode, pathKey, supabaseUrl, supabaseKey)
  
  if (!pattern) {
    return
  }

  // Update scores: selected word gets boosted, others decay slightly
  const updatedPredictions = pattern.predictions.map(pred => {
    if (pred.word === selectedWord) {
      // Boost selected word (max 1.0)
      return { ...pred, score: Math.min(pred.score * 0.9 + 0.1, 1.0) }
    } else {
      // Slight decay for non-selected words (min 0.1)
      return { ...pred, score: Math.max(pred.score * 0.98, 0.1) }
    }
  })

  // Sort by score
  updatedPredictions.sort((a, b) => b.score - a.score)

  // Update pattern
  await upsertSentencePattern(
    {
      ...pattern,
      predictions: updatedPredictions,
      usage_count: pattern.usage_count + 1
    },
    supabaseUrl,
    supabaseKey
  )
}

export async function storeInitialCards(
  languageCode: string,
  cards: InitialCards['cards'],
  supabaseUrl: string,
  supabaseKey: string
): Promise<void> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/sentence_initial_cards`,
    {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        language_code: languageCode,
        cards: cards
      })
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to store initial cards: ${response.status} - ${error}`)
  }
}