import type { Env, TranslationRequest, TranslationResponse } from './types'
import { translateWithOpenAI } from './translator'
import { fetchActiveLanguages, fetchOrCreateKey, insertTranslation } from './database'
import { TranslationCache } from './cache'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // Handle GET requests for health check
    if (request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok', service: 'i18n-translator' }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }

    // Only accept POST requests for translation
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders })
    }

    const url = new URL(request.url)
    
    // Handle direct translation endpoint (no database storage)
    if (url.pathname === '/translate-direct') {
      try {
        const body = await request.json()
        
        if (!body.englishTranslation || !body.languages) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Missing required fields: englishTranslation and languages'
            }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            }
          )
        }
        
        // Initialize cache
        const cache = new TranslationCache(env.TRANSLATION_CACHE)
        
        // Check cache first
        const cachedTranslations = await cache.get(
          body.englishTranslation,
          body.languages,
          body.context
        )
        
        if (cachedTranslations) {
          console.log('Returning cached translations')
          return new Response(
            JSON.stringify({
              success: true,
              translations: cachedTranslations,
              cached: true
            }),
            {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            }
          )
        }
        
        // Not in cache, translate using OpenAI
        console.log('Cache miss, calling OpenAI')
        const translations = await translateWithOpenAI(
          body.englishTranslation,
          body.languages,
          body.context,
          env.OPENAI_API_KEY
        )
        
        // Convert to simple object format
        const translationMap: Record<string, string> = {}
        translations.forEach(t => {
          translationMap[t.language] = t.translation
        })
        
        // Store in cache
        await cache.set(
          body.englishTranslation,
          body.languages,
          translationMap,
          body.context
        )
        
        return new Response(
          JSON.stringify({
            success: true,
            translations: translationMap,
            cached: false
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        )
      } catch (error) {
        console.error('Translation error:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        
        // Include more details in the error response
        return new Response(
          JSON.stringify({
            success: false,
            error: `Translation error: ${errorMessage}`,
            details: {
              message: errorMessage,
              type: error instanceof Error ? error.constructor.name : typeof error
            }
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        )
      }
    }

    try {
      // Parse request body
      const body: TranslationRequest = await request.json()

      // Validate required fields
      if (!body.key || !body.englishTranslation) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing required fields: key and englishTranslation'
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        )
      }

      // Fetch active languages from database (excluding locales with dashes)
      const activeLanguages = await fetchActiveLanguages(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
      
      // Filter to only base language codes (no dashes) and exclude English
      const baseLanguages = activeLanguages.filter(lang => 
        !lang.code.includes('-') && lang.code !== 'en'
      )

      // Get languages to translate to
      let targetLanguages = baseLanguages.map(lang => lang.code)
      
      // If specific languages requested, validate them
      if (body.languages && body.languages.length > 0) {
        const validLanguageCodes = baseLanguages.map(lang => lang.code)
        const invalidLanguages = body.languages.filter(lang => !validLanguageCodes.includes(lang))
        
        if (invalidLanguages.length > 0) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Unsupported or inactive languages: ${invalidLanguages.join(', ')}`
            }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            }
          )
        }
        
        targetLanguages = body.languages
      }

      // Create or fetch the translation key
      const keyRecord = await fetchOrCreateKey(
        body.key,
        body.context,
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_KEY
      )

      // Translate using OpenAI
      const translations = await translateWithOpenAI(
        body.englishTranslation,
        targetLanguages,
        body.context,
        env.OPENAI_API_KEY
      )

      // Store translations in database
      const errors: string[] = []
      const storedTranslations: Record<string, string> = {}

      // Store English translation first
      try {
        await insertTranslation(
          {
            key_id: keyRecord.id,
            language_code: 'en',
            value: body.englishTranslation,
            version: 1,
            is_published: true,
            notes: body.context ? `Context: ${body.context}` : undefined
          },
          env.SUPABASE_URL,
          env.SUPABASE_SERVICE_KEY
        )
        storedTranslations['en'] = body.englishTranslation
      } catch (error) {
        errors.push(`Failed to store English translation: ${error}`)
      }

      // Store translated versions
      for (const result of translations) {
        try {
          await insertTranslation(
            {
              key_id: keyRecord.id,
              language_code: result.language,
              value: result.translation,
              version: 1,
              is_published: true,
              notes: `Translated by GPT-4. Confidence: ${result.confidence}${body.context ? `. Context: ${body.context}` : ''}`
            },
            env.SUPABASE_URL,
            env.SUPABASE_SERVICE_KEY
          )
          storedTranslations[result.language] = result.translation
        } catch (error) {
          errors.push(`Failed to store ${result.language}: ${error}`)
        }
      }

      // Prepare response
      const responseData: TranslationResponse = {
        success: errors.length === 0,
        key: body.key,
        translations: storedTranslations,
        errors: errors.length > 0 ? errors : undefined,
        metadata: {
          timestamp: new Date().toISOString(),
          model: 'gpt-4-turbo-preview'
        }
      }

      return new Response(JSON.stringify(responseData), {
        status: errors.length === 0 ? 200 : 207,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })

    } catch (error) {
      console.error('Worker error:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Internal server error: ${error}`
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }
  }
}