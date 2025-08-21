import type { Env, TranslationDataRequest, TranslationDataResponse, AppTranslationsResponse } from './types'
import { 
  fetchAllTranslationData, 
  fetchAppTranslationData, 
  fetchActiveLanguages, 
  fetchAllKeys,
  fetchAllTranslationsRaw,
  fetchTranslationsForLanguage
} from './database'

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

    const url = new URL(request.url)
    const pathname = url.pathname

    try {
      // Route: GET /keys - Get all translation keys
      if (pathname === '/keys' && request.method === 'GET') {
        const keys = await fetchAllKeys(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
        
        // Check for conflicts
        const keyStrings = keys.map(k => k.key)
        const keySet = new Set(keyStrings)
        const parentKeysWithChildren: string[] = []
        
        for (const key of keyStrings) {
          const parts = key.split('.')
          for (let i = 1; i < parts.length; i++) {
            const parentPath = parts.slice(0, i).join('.')
            if (keySet.has(parentPath) && !parentKeysWithChildren.includes(parentPath)) {
              parentKeysWithChildren.push(parentPath)
            }
          }
        }
        
        return new Response(JSON.stringify({
          success: true,
          data: keys,
          count: keys.length,
          conflicts: parentKeysWithChildren.sort(),
          metadata: {
            timestamp: new Date().toISOString(),
            conflictCount: parentKeysWithChildren.length
          }
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300'
          }
        })
      }

      // Route: GET /languages - Get all languages
      if (pathname === '/languages' && request.method === 'GET') {
        const languages = await fetchActiveLanguages(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
        
        return new Response(JSON.stringify({
          success: true,
          data: languages,
          count: languages.length,
          metadata: {
            timestamp: new Date().toISOString()
          }
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300'
          }
        })
      }

      // Route: GET /translations/count - Get total count without data
      if (pathname === '/translations/count' && request.method === 'GET') {
        const response = await fetch(
          `${env.SUPABASE_URL}/rest/v1/i18n_translations?select=count`,
          {
            headers: {
              'apikey': env.SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`
            }
          }
        )
        
        if (!response.ok) {
          throw new Error(`Failed to fetch count: ${response.status} ${response.statusText}`)
        }
        
        const countResult = await response.json() as any[]
        const totalCount = countResult[0]?.count || 0
        
        return new Response(JSON.stringify({
          success: true,
          totalCount: totalCount,
          metadata: {
            timestamp: new Date().toISOString()
          }
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300'
          }
        })
      }

      // Route: GET /translations - Get ALL translations (raw)
      if (pathname === '/translations' && request.method === 'GET') {
        const translations = await fetchAllTranslationsRaw(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
        
        return new Response(JSON.stringify({
          success: true,
          data: translations,
          count: translations.length,
          metadata: {
            timestamp: new Date().toISOString(),
            note: translations.length >= 10000 ? "Results may be truncated at 10,000 rows" : "All results returned"
          }
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300'
          }
        })
      }

      // Route: GET /translations/{language} - Get translations for specific language
      if (pathname.startsWith('/translations/') && request.method === 'GET') {
        const languageCode = pathname.split('/translations/')[1]
        
        if (!languageCode) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Language code is required'
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

        const translations = await fetchTranslationsForLanguage(languageCode, env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
        
        return new Response(JSON.stringify({
          success: true,
          language: languageCode,
          data: translations,
          count: translations.length,
          metadata: {
            timestamp: new Date().toISOString()
          }
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300'
          }
        })
      }

      // Route: GET /all - Get all translation data
      if (pathname === '/all' && request.method === 'GET') {
        const data = await fetchAllTranslationData(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
        
        const response: TranslationDataResponse = {
          success: true,
          data,
          metadata: {
            timestamp: new Date().toISOString(),
            totalLanguages: Object.keys(data.translations).length,
            totalKeys: data.keys.length
          }
        }

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
          }
        })
      }

      // Route: GET /app/{appName} - Get translations for specific app
      if (pathname.startsWith('/app/') && request.method === 'GET') {
        const appName = pathname.split('/app/')[1]
        
        if (!appName) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'App name is required'
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

        const data = await fetchAppTranslationData(appName, env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
        
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

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
          }
        })
      }

      // Route: POST /generate - Generate TypeScript files
      if (pathname === '/generate' && request.method === 'POST') {
        const body: TranslationDataRequest = await request.json()
        
        const data = body.app 
          ? await fetchAppTranslationData(body.app, env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
          : await fetchAllTranslationData(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
        
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

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        })
      }

      // Route not found
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Route not found',
          availableRoutes: [
            'GET /keys - Get all translation keys',
            'GET /languages - Get all languages',
            'GET /translations - Get ALL raw translations',
            'GET /translations/{language} - Get translations for specific language',
            'GET /all - Get all translation data',
            'GET /app/{appName} - Get translations for specific app',
            'POST /generate - Generate TypeScript files (with optional app filter)'
          ]
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )

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