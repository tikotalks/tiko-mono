import type { Env, TranslationResult } from './types'
import { translateWithLezu } from './database'

export async function translateWithLezuProvider(
  text: string,
  targetLanguages: string[],
  context: string | undefined,
  envOrApiKey: Env | string,
  key?: string
): Promise<TranslationResult[]> {
  if (typeof envOrApiKey === 'string') {
    throw new Error('Configure LEZU_API_KEY and call translateWithLezuProvider with Env')
  }

  const translationKey = key || `direct.${await hashText(`${text}|${context || ''}`)}`
  const translations = await translateWithLezu(translationKey, text, targetLanguages, envOrApiKey)
  return targetLanguages.map(language => ({
    language,
    translation: translations[language] || text,
    confidence: translations[language] ? 1 : 0
  }))
}

async function hashText(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 16)
}
