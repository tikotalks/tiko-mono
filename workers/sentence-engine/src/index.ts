import type { Env } from './types'
import { handlePredict } from './predict'
import { handleSelect } from './select'

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
    const path = url.pathname

    try {
      // Route to appropriate handler
      if (path.endsWith('/predict') && request.method === 'GET') {
        const response = await handlePredict(request, env)
        return new Response(response.body, {
          status: response.status,
          headers: {
            ...corsHeaders,
            ...Object.fromEntries(response.headers)
          }
        })
      }

      if (path.endsWith('/select') && request.method === 'POST') {
        const response = await handleSelect(request, env)
        return new Response(response.body, {
          status: response.status,
          headers: {
            ...corsHeaders,
            ...Object.fromEntries(response.headers)
          }
        })
      }

      // Default response for unknown routes
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Not found',
          availableEndpoints: [
            'GET /predict?lang=en&path=I,want',
            'POST /select'
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
          error: 'Internal server error'
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