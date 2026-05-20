import type { SentencePattern, InitialCards, SentenceUsage, Prediction } from './types'

type SentencePatternRow = Omit<SentencePattern, 'path' | 'predictions'> & {
  path: string
  predictions: string
}

type InitialCardsRow = Omit<InitialCards, 'cards'> & {
  cards: string
}

function parseJsonArray<T>(value: string | null | undefined, fallback: T[]): T[] {
  if (!value) {
    return fallback
  }

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed as T[] : fallback
  } catch {
    return fallback
  }
}

function mapPattern(row: SentencePatternRow): SentencePattern {
  return {
    ...row,
    path: parseJsonArray<string>(row.path, []),
    predictions: parseJsonArray<Prediction>(row.predictions, [])
  }
}

function mapInitialCards(row: InitialCardsRow): InitialCards {
  return {
    ...row,
    cards: parseJsonArray<InitialCards['cards'][number]>(row.cards, [])
  }
}

export async function getActiveLanguages(db: D1Database): Promise<string[]> {
  const result = await db
    .prepare(
      `SELECT code
       FROM sentence_languages
       WHERE is_active = 1
         AND code NOT LIKE '%-%'
       ORDER BY code`
    )
    .all<{ code: string }>()

  return result.results.map((lang) => lang.code)
}

export async function getInitialCards(
  languageCode: string,
  db: D1Database
): Promise<InitialCards | null> {
  const row = await db
    .prepare(
      `SELECT id, language_code, cards, created_at
       FROM sentence_initial_cards
       WHERE language_code = ?`
    )
    .bind(languageCode)
    .first<InitialCardsRow>()

  return row ? mapInitialCards(row) : null
}

export async function getSentencePattern(
  languageCode: string,
  pathKey: string,
  db: D1Database
): Promise<SentencePattern | null> {
  const row = await db
    .prepare(
      `SELECT id, language_code, path, path_key, predictions, usage_count, created_at, updated_at
       FROM sentence_patterns
       WHERE language_code = ? AND path_key = ?`
    )
    .bind(languageCode, pathKey)
    .first<SentencePatternRow>()

  return row ? mapPattern(row) : null
}

export async function upsertSentencePattern(
  pattern: SentencePattern,
  db: D1Database
): Promise<void> {
  const now = new Date().toISOString()

  await db
    .prepare(
      `INSERT INTO sentence_patterns (
         language_code,
         path,
         path_key,
         predictions,
         usage_count,
         created_at,
         updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(language_code, path_key) DO UPDATE SET
         path = excluded.path,
         predictions = excluded.predictions,
         usage_count = excluded.usage_count,
         updated_at = excluded.updated_at`
    )
    .bind(
      pattern.language_code,
      JSON.stringify(pattern.path),
      pattern.path_key,
      JSON.stringify(pattern.predictions),
      pattern.usage_count,
      pattern.created_at ?? now,
      now
    )
    .run()
}

export async function recordUsage(
  usage: SentenceUsage,
  db: D1Database
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO sentence_usage (
         language_code,
         path,
         selected_word,
         user_id,
         created_at
       )
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(
      usage.language_code,
      JSON.stringify(usage.path),
      usage.selected_word,
      usage.user_id ?? null,
      usage.created_at ?? new Date().toISOString()
    )
    .run()
}

export async function updatePatternScores(
  languageCode: string,
  pathKey: string,
  selectedWord: string,
  db: D1Database
): Promise<void> {
  // Get current pattern
  const pattern = await getSentencePattern(languageCode, pathKey, db)
  
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
    db
  )
}

export async function storeInitialCards(
  languageCode: string,
  cards: InitialCards['cards'],
  db: D1Database
): Promise<void> {
  const now = new Date().toISOString()

  await db
    .prepare(
      `INSERT INTO sentence_initial_cards (
         language_code,
         cards,
         created_at
       )
       VALUES (?, ?, ?)
       ON CONFLICT(language_code) DO UPDATE SET
         cards = excluded.cards`
    )
    .bind(languageCode, JSON.stringify(cards), now)
    .run()
}