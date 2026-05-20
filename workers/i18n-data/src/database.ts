import type { DatabaseKey, DatabaseLanguage, DatabaseTranslation, Env, TranslationData } from './types'

const DEFAULT_PROJECT_ID = 'project_a2a9847c-edbd-499e-874f-5a58c0cca80c'
const DEFAULT_API_BASE = 'https://api.lezu.app'

function projectId(env: Env): string {
  return env.LEZU_PROJECT_ID || DEFAULT_PROJECT_ID
}

function apiBase(env: Env): string {
  return (env.LEZU_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '')
}

async function lezuResponse(env: Env, path: string, init: RequestInit = {}): Promise<Response> {
  if (!env.LEZU_API_KEY) throw new Error('LEZU_API_KEY is not configured')

  return fetch(`${apiBase(env)}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `ApiKey ${env.LEZU_API_KEY}`,
      ...(init.headers || {})
    }
  })
}

async function lezu<T>(env: Env, path: string, init: RequestInit = {}): Promise<T> {
  const response = await lezuResponse(env, path, init)

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

function flattenMessages(value: unknown, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  if (typeof value === 'string') {
    if (prefix) out[prefix] = value
    return out
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      flattenMessages(nested, prefix ? `${prefix}.${key}` : key, out)
    }
  }
  return out
}

function appPrefixes(appName: string): string[] {
  const normalized = appName.trim().toLowerCase()
  const withoutHyphens = normalized.replace(/-/g, '')
  const withoutTikoPrefix = normalized.replace(/^tiko-/, '')
  const aliases = new Set([normalized, withoutHyphens, withoutTikoPrefix, withoutTikoPrefix.replace(/-/g, '')])

  return Array.from(aliases).filter(Boolean)
}

function filterMessages(messages: Record<string, string>, appName?: string): Record<string, string> {
  if (!appName) return messages
  const commonPrefixes = ['common', 'shared', 'global', 'auth', 'errors', 'validation', 'parentMode']
  const prefixes = appPrefixes(appName)
  return Object.fromEntries(
    Object.entries(messages).filter(([key]) =>
      prefixes.some(prefix => key.startsWith(`${prefix}.`)) ||
      commonPrefixes.some(prefix => key.startsWith(`${prefix}.`))
    )
  )
}

async function fetchValuesBundle(env: Env, localeCode: string, appName?: string): Promise<Record<string, string>> {
  const response = await lezu<unknown>(env, `/v1/i18n/projects/${projectId(env)}/values`)
  const values = unwrap<Array<{ key?: string; localeCode?: string; value?: string }>>(response, 'values')
  const messages = Object.fromEntries(
    values
      .filter(item => item.localeCode === localeCode && item.key && typeof item.value === 'string')
      .map(item => [item.key as string, item.value as string])
  )

  return filterMessages(messages, appName)
}

export async function fetchActiveLanguages(env: Env): Promise<DatabaseLanguage[]> {
  const response = await lezu<unknown>(env, `/v1/i18n/projects/${projectId(env)}/locales`)
  const locales = unwrap<Array<{ id: string; code: string; name: string; enabled?: boolean; isSource?: boolean }>>(response, 'locales')
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

export async function fetchAllKeys(env: Env, appName?: string): Promise<DatabaseKey[]> {
  const response = await lezu<unknown>(env, `/v1/i18n/projects/${projectId(env)}/keys`)
  const keys = unwrap<Array<{ id: string; key: string; description?: string; namespace?: string; createdAt?: string }>>(response, 'keys')
  return keys
    .filter(item => !appName || filterMessages({ [item.key]: '' }, appName)[item.key] !== undefined)
    .map(item => ({
      id: item.id,
      key: item.key,
      description: item.description,
      category: item.namespace || item.key.split('.')[0],
      created_at: item.createdAt
    }))
}

export async function fetchBundle(env: Env, localeCode: string, appName?: string): Promise<Record<string, string>> {
  const response = await lezuResponse(env, `/v1/i18n/bundles/${projectId(env)}/production/${localeCode}`)

  if (response.status === 404) {
    console.warn(`Lezu bundle not found for locale ${localeCode}; falling back to values endpoint`)
    return fetchValuesBundle(env, localeCode, appName)
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Lezu API ${response.status}: ${text || response.statusText}`)
  }

  const payload = await response.json()
  const bundle = unwrap<{ messages?: unknown }>(payload, 'bundle')
  const messages = filterMessages(flattenMessages(bundle.messages || {}), appName)

  if (Object.keys(messages).length === 0) {
    return fetchValuesBundle(env, localeCode, appName)
  }

  return messages
}

export async function fetchTranslationsForLanguage(languageCode: string, env: Env, appName?: string): Promise<DatabaseTranslation[]> {
  const messages = await fetchBundle(env, languageCode, appName)
  return Object.entries(messages).map(([key, value]) => ({
    id: `${languageCode}:${key}`,
    key_id: key,
    language_code: languageCode,
    value,
    version: 1,
    is_published: true,
    key
  }))
}

export async function fetchAllTranslationsRaw(env: Env, appName?: string): Promise<DatabaseTranslation[]> {
  const languages = await fetchActiveLanguages(env)
  const all = await Promise.all(languages.map(language => fetchTranslationsForLanguage(language.code, env, appName)))
  return all.flat()
}

export async function fetchAllTranslationData(env: Env, appName?: string): Promise<TranslationData> {
  const languages = await fetchActiveLanguages(env)
  const keys = await fetchAllKeys(env, appName)
  const translations: Record<string, Record<string, string>> = {}

  for (const language of languages) {
    translations[language.code] = await fetchBundle(env, language.code, appName)
  }

  return { keys, languages, translations }
}

export async function fetchAppTranslationData(appName: string, env: Env): Promise<TranslationData> {
  return fetchAllTranslationData(env, appName)
}
