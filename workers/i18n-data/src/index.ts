import type { Env, TranslationDataRequest, TranslationDataResponse, AppTranslationsResponse } from './types'
import {
  fetchAllTranslationData,
  fetchAppTranslationData,
  fetchActiveLanguages,
  fetchAllKeys,
  fetchAllTranslationsRaw,
  fetchTranslationsForLanguage
} from './database'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

function jsonResponse(body: unknown, status = 200, cache = true): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...(cache ? { 'Cache-Control': 'public, max-age=300' } : {})
    }
  })
}

function findParentKeyConflicts(keys: string[]): string[] {
  const keySet = new Set(keys)
  const parentKeysWithChildren = new Set<string>()

  for (const key of keys) {
    const parts = key.split('.')
    for (let i = 1; i < parts.length; i++) {
      const parentPath = parts.slice(0, i).join('.')
      if (keySet.has(parentPath)) parentKeysWithChildren.add(parentPath)
    }
  }

  return Array.from(parentKeysWithChildren).sort()
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const url = new URL(request.url)
    const pathname = url.pathname

    try {
      if (pathname === '/keys' && request.method === 'GET') {
        const keys = await fetchAllKeys(env, url.searchParams.get('app') || undefined)
        const keyStrings = keys.map(k => k.key)
        const conflicts = findParentKeyConflicts(keyStrings)

        return jsonResponse({
          success: true,
          data: keys,
          count: keys.length,
          conflicts,
          metadata: {
            timestamp: new Date().toISOString(),
            conflictCount: conflicts.length
          }
        })
      }

      if (pathname === '/languages' && request.method === 'GET') {
        const languages = await fetchActiveLanguages(env)
        return jsonResponse({
          success: true,
          data: languages,
          count: languages.length,
          metadata: { timestamp: new Date().toISOString() }
        })
      }

      if (pathname === '/translations/count' && request.method === 'GET') {
        const translations = await fetchAllTranslationsRaw(env, url.searchParams.get('app') || undefined)
        return jsonResponse({
          success: true,
          totalCount: translations.length,
          metadata: { timestamp: new Date().toISOString() }
        })
      }

      if (pathname === '/translations' && request.method === 'GET') {
        const translations = await fetchAllTranslationsRaw(env, url.searchParams.get('app') || undefined)
        return jsonResponse({
          success: true,
          data: translations,
          count: translations.length,
          metadata: {
            timestamp: new Date().toISOString(),
            note: 'Translations are served from Lezu release bundles'
          }
        })
      }

      if (pathname.startsWith('/translations/') && request.method === 'GET') {
        const languageCode = pathname.split('/translations/')[1]
        if (!languageCode) {
          return jsonResponse({ success: false, error: 'Language code is required' }, 400, false)
        }

        const translations = await fetchTranslationsForLanguage(
          languageCode,
          env,
          url.searchParams.get('app') || undefined
        )

        return jsonResponse({
          success: true,
          language: languageCode,
          data: translations,
          count: translations.length,
          metadata: { timestamp: new Date().toISOString() }
        })
      }

      if (pathname === '/all' && request.method === 'GET') {
        const data = await fetchAllTranslationData(env, url.searchParams.get('app') || undefined)
        const response: TranslationDataResponse = {
          success: true,
          data,
          metadata: {
            timestamp: new Date().toISOString(),
            totalLanguages: Object.keys(data.translations).length,
            totalKeys: data.keys.length
          }
        }
        return jsonResponse(response)
      }

      if (pathname.startsWith('/app/') && request.method === 'GET') {
        const appName = pathname.split('/app/')[1]
        if (!appName) {
          return jsonResponse({ success: false, error: 'App name is required' }, 400, false)
        }

        const data = await fetchAppTranslationData(appName, env)
        const response: AppTranslationsResponse = {
          success: true,
          app: appName,
          data,
          metadata: {
            timestamp: new Date().toISOString(),
            totalLanguages: Object.keys(data.translations).length,
            totalKeys: data.keys.length
          }
        }
        return jsonResponse(response)
      }

      if (pathname === '/generate' && request.method === 'POST') {
        const body: TranslationDataRequest = await request.json()
        const data = body.app
          ? await fetchAppTranslationData(body.app, env)
          : await fetchAllTranslationData(env)

        const response: TranslationDataResponse = {
          success: true,
          data,
          metadata: {
            timestamp: new Date().toISOString(),
            totalLanguages: Object.keys(data.translations).length,
            totalKeys: data.keys.length,
            requestedApp: body.app
          }
        }
        return jsonResponse(response, 200, false)
      }

      return jsonResponse({
        success: false,
        error: 'Route not found',
        availableRoutes: [
          'GET /keys - Get all translation keys from Lezu',
          'GET /languages - Get enabled Lezu locales',
          'GET /translations - Get all raw translations from Lezu bundles',
          'GET /translations/{language} - Get translations for a language',
          'GET /all - Get all translation data',
          'GET /app/{appName} - Get app-scoped translation data',
          'POST /generate - Generate translation payload'
        ]
      }, 404, false)
    } catch (error) {
      console.error('Worker error:', error)
      return jsonResponse({
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : String(error)}`
      }, 500, false)
    }
  }
}
