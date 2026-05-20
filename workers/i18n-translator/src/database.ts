import type { DatabaseKey, DatabaseLanguage, DatabaseTranslation, Env } from './types'

const DEFAULT_PROJECT_ID = 'project_a2a9847c-edbd-499e-874f-5a58c0cca80c'
const DEFAULT_API_BASE = 'https://api.lezu.app'

export function projectId(env: Env): string {
  return env.LEZU_PROJECT_ID || DEFAULT_PROJECT_ID
}

function apiBase(env: Env): string {
  return (env.LEZU_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '')
}

async function lezu<T>(env: Env, path: string, init: RequestInit = {}): Promise<T> {
  if (!env.LEZU_API_KEY) throw new Error('LEZU_API_KEY is not configured')

  const response = await fetch(`${apiBase(env)}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `ApiKey ${env.LEZU_API_KEY}`,
      ...(init.headers || {})
    }
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Lezu API ${response.status}: ${text || response.statusText}`)
  }

  return response.json()
}

function unwrap<T>(response: unknown, key: string): T {
  const root = response as { data?: Record<string, unknown> }
  return (root.data?.[key] ?? root.data ?? response) as T
}

export async function fetchActiveLanguages(env: Env): Promise<DatabaseLanguage[]> {
  const response = await lezu<unknown>(env, `/v1/i18n/projects/${projectId(env)}/locales`)
  const locales = unwrap<Array<{ id: string; code: string; name: string; enabled?: boolean }>>(response, 'locales')
  return locales
    .filter(locale => locale.enabled !== false)
    .map(locale => ({
      id: locale.id,
      code: locale.code,
      name: locale.name,
      native_name: locale.name,
      is_active: locale.enabled !== false
    }))
}

export async function fetchOrCreateKey(key: string, description: string | undefined, env: Env): Promise<DatabaseKey> {
  const created = await lezu<unknown>(env, `/v1/i18n/projects/${projectId(env)}/keys`, {
    method: 'POST',
    body: JSON.stringify({ key, description })
  }).catch(async error => {
    const keysResponse = await lezu<unknown>(env, `/v1/i18n/projects/${projectId(env)}/keys`)
    const keys = unwrap<Array<{ id: string; key: string; description?: string; namespace?: string }>>(keysResponse, 'keys')
    const existing = keys.find(item => item.key === key)
    if (!existing) throw error
    return { data: { key: existing } }
  })

  const record = unwrap<{ id: string; key: string; description?: string; namespace?: string }>(created, 'key')
  return {
    id: record.id,
    key: record.key,
    description: record.description,
    category: record.namespace || record.key.split('.')[0]
  }
}

export async function insertTranslation(translation: DatabaseTranslation, env: Env): Promise<void> {
  const content = { [translation.key_id]: translation.value }
  await lezu<unknown>(env, `/v1/i18n/projects/${projectId(env)}/import`, {
    method: 'POST',
    body: JSON.stringify({ locale: translation.language_code, content })
  })
}

async function importSourceAndGenerate(
  key: string,
  englishTranslation: string,
  languages: string[],
  env: Env
): Promise<void> {
  await lezu<unknown>(env, `/v1/i18n/projects/${projectId(env)}/import`, {
    method: 'POST',
    body: JSON.stringify({
      locale: 'en',
      content: { [key]: englishTranslation },
      options: {
        translateMissing: true,
        targetLocales: languages.filter(language => language !== 'en')
      }
    })
  })
}

async function readValuesForKey(key: string, languages: string[], env: Env): Promise<Record<string, string>> {
  const params = new URLSearchParams()
  for (const language of languages) params.append('locale', language)
  const response = await lezu<unknown>(env, `/v1/i18n/projects/${projectId(env)}/values?${params.toString()}`)
  const values = unwrap<Array<{ key?: string; keyName?: string; localeCode?: string; locale?: string; value?: string }>>(response, 'values')
  const translations: Record<string, string> = {}

  for (const value of values) {
    const valueKey = value.key || value.keyName
    const locale = value.localeCode || value.locale
    if (valueKey === key && locale && typeof value.value === 'string') {
      translations[locale] = value.value
    }
  }

  return translations
}

export async function translateWithLezu(
  key: string,
  englishTranslation: string,
  languages: string[],
  env: Env
): Promise<Record<string, string>> {
  const uniqueLanguages = Array.from(new Set(languages.length > 0 ? languages : ['en']))
  await importSourceAndGenerate(key, englishTranslation, uniqueLanguages, env)
  const values: Record<string, string> = await readValuesForKey(key, uniqueLanguages, env).catch(() => ({} as Record<string, string>))
  return Object.fromEntries(uniqueLanguages.map(language => [language, values[language] || (language === 'en' ? englishTranslation : '')]))
}
