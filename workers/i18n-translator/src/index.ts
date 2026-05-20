import type { Env, TranslationRequest, TranslationResponse } from './types'
import { translateWithLezuProvider } from './translator'
import { fetchActiveLanguages, fetchOrCreateKey, insertTranslation, projectId } from './database'
import { TranslationCache } from './cache'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  })
}

function baseLanguages(languages: Awaited<ReturnType<typeof fetchActiveLanguages>>): string[] {
  return languages
    .filter(language => !language.code.includes('-') && language.code !== 'en')
    .map(language => language.code)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    if (request.method === 'GET') {
      return jsonResponse({
        status: 'ok',
        service: 'i18n-translator',
        provider: 'lezu',
        projectId: projectId(env)
      })
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders })
    }

    const url = new URL(request.url)

    try {
      if (url.pathname === '/translate-direct') {
        const body = await request.json() as { englishTranslation?: string; languages?: string[]; context?: string; key?: string }

        if (!body.englishTranslation || !body.languages?.length) {
          return jsonResponse({
            success: false,
            error: 'Missing required fields: englishTranslation and languages'
          }, 400)
        }

        const cache = new TranslationCache(env.TRANSLATION_CACHE)
        const cachedTranslations = await cache.get(body.englishTranslation, body.languages, body.context)
        if (cachedTranslations) {
          return jsonResponse({ success: true, translations: cachedTranslations, cached: true })
        }

        const results = await translateWithLezuProvider(
          body.englishTranslation,
          body.languages,
          body.context,
          env,
          body.key
        )
        const translations = Object.fromEntries(results.map(result => [result.language, result.translation]))
        await cache.set(body.englishTranslation, body.languages, translations, body.context)

        return jsonResponse({ success: true, translations, cached: false, provider: 'lezu' })
      }

      const body: TranslationRequest = await request.json()
      if (!body.key || !body.englishTranslation) {
        return jsonResponse({
          success: false,
          error: 'Missing required fields: key and englishTranslation'
        }, 400)
      }

      const activeLanguages = await fetchActiveLanguages(env)
      const validBaseLanguages = baseLanguages(activeLanguages)
      let targetLanguages = validBaseLanguages

      if (body.languages?.length) {
        const invalidLanguages = body.languages.filter(language => !validBaseLanguages.includes(language) && language !== 'en')
        if (invalidLanguages.length > 0) {
          return jsonResponse({
            success: false,
            error: `Unsupported or inactive languages: ${invalidLanguages.join(', ')}`
          }, 400)
        }
        targetLanguages = body.languages.filter(language => language !== 'en')
      }

      const keyRecord = await fetchOrCreateKey(body.key, body.context, env)
      const languagesToRequest = Array.from(new Set(['en', ...targetLanguages]))
      const translations = await translateWithLezuProvider(
        body.englishTranslation,
        languagesToRequest,
        body.context,
        env,
        body.key
      )

      const errors: string[] = []
      const storedTranslations: Record<string, string> = {}

      for (const result of translations) {
        try {
          await insertTranslation({
            key_id: keyRecord.key,
            language_code: result.language,
            value: result.language === 'en' ? body.englishTranslation : result.translation,
            version: 1,
            is_published: true,
            notes: body.context ? `Context: ${body.context}` : undefined
          }, env)
          storedTranslations[result.language] = result.language === 'en' ? body.englishTranslation : result.translation
        } catch (error) {
          errors.push(`Failed to store ${result.language}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

      const responseData: TranslationResponse = {
        success: errors.length === 0,
        key: body.key,
        translations: storedTranslations,
        errors: errors.length > 0 ? errors : undefined,
        metadata: {
          timestamp: new Date().toISOString(),
          provider: 'lezu',
          projectId: projectId(env)
        }
      }

      return jsonResponse(responseData, errors.length === 0 ? 200 : 207)
    } catch (error) {
      console.error('Worker error:', error)
      return jsonResponse({
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : String(error)}`
      }, 500)
    }
  }
}
