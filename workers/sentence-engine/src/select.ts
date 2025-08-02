import type { Env, SelectRequest, SelectResponse } from './types'
import { recordUsage, updatePatternScores } from './database'

export async function handleSelect(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    // Parse request body
    const body: SelectRequest = await request.json()

    // Validate required fields
    if (!body.lang || !body.path || !body.choice) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: lang, path, and choice'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Create path key
    const pathKey = body.path.map(w => w.toLowerCase()).join('_')

    // Record usage
    await recordUsage(
      {
        language_code: body.lang,
        path: body.path,
        selected_word: body.choice,
        user_id: body.userId
      },
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_KEY
    )

    // Update pattern scores if path exists
    if (body.path.length > 0) {
      await updatePatternScores(
        body.lang,
        pathKey,
        body.choice,
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_KEY
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Selection recorded successfully'
      } as SelectResponse),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Select error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: `Server error: ${error}`
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}