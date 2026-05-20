/// <reference types="@cloudflare/workers-types" />

export interface Env {
  ADMIN_API_KEY: string
  USER_REMOVAL_DB: D1Database
  USER_REMOVAL_LOG?: KVNamespace
}

interface UserRemovalRequest {
  userId: string
  adminKey: string
}

interface UserRemovalProgress {
  step: string
  status: 'in_progress' | 'completed' | 'failed'
  message: string
  timestamp: string
}

interface RemovalResults {
  userItems: number
  collections: number
  userMedia: number
  userProfiles: number
  userSettings: number
  appSettings: number
  sessions: number
  devices: number
  magicLinks: number
  authAccount: boolean
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Enable CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    try {
      const url = new URL(request.url)
      const path = url.pathname

      if (path === '/remove-user' && request.method === 'DELETE') {
        return await handleUserRemoval(request, env, corsHeaders)
      }

      if (path === '/removal-status' && request.method === 'GET') {
        return await handleRemovalStatus(request, env, corsHeaders)
      }

      return new Response('Not Found', { 
        status: 404,
        headers: corsHeaders 
      })

    } catch (error) {
      console.error('Worker error:', error)
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }
  },
}

async function handleUserRemoval(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let userId = 'unknown'

  try {
    const body: UserRemovalRequest = await request.json()
    userId = body.userId || userId

    // Verify admin key
    if (body.adminKey !== env.ADMIN_API_KEY) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }

    if (!body.userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User ID is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }

    // Log the removal start
    await logRemovalProgress(env, body.userId, {
      step: 'initiated',
      status: 'in_progress',
      message: 'User removal process started',
      timestamp: new Date().toISOString()
    })

    // Start the removal process
    const result = await removeUserCompletely(body.userId, env)

    // Log completion
    await logRemovalProgress(env, body.userId, {
      step: 'completed',
      status: 'completed',
      message: 'User removal completed successfully',
      timestamp: new Date().toISOString()
    })

    return new Response(JSON.stringify({
      success: true,
      message: 'User account and all associated data have been removed',
      details: result
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })

  } catch (error) {
    console.error('User removal error:', error)

    await logRemovalProgress(env, userId, {
      step: 'failed',
      status: 'failed',
      message: `User removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    })

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove user'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
}

async function handleRemovalStatus(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url)
  const userId = url.searchParams.get('userId')

  if (!userId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'User ID is required'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }

  try {
    const log = await env.USER_REMOVAL_LOG?.get(userId)
    const progress = log ? JSON.parse(log) : null

    return new Response(JSON.stringify({
      success: true,
      progress
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to retrieve removal status'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
}

async function removeUserCompletely(userId: string, env: Env): Promise<RemovalResults> {
  const results: RemovalResults = {
    userItems: 0,
    collections: 0,
    userMedia: 0,
    userProfiles: 0,
    userSettings: 0,
    appSettings: 0,
    sessions: 0,
    devices: 0,
    magicLinks: 0,
    authAccount: false
  }

  // Step 1: Remove all user app data
  await logRemovalProgress(env, userId, {
    step: 'removing_items',
    status: 'in_progress',
    message: 'Removing user items and collections...',
    timestamp: new Date().toISOString()
  })

  results.userItems = await deleteByUserId(env.USER_REMOVAL_DB, 'items', userId)
  results.collections = await deleteByUserId(env.USER_REMOVAL_DB, 'collections', userId)

  // Step 2: Remove all user media metadata
  await logRemovalProgress(env, userId, {
    step: 'removing_media',
    status: 'in_progress',
    message: 'Removing user media metadata...',
    timestamp: new Date().toISOString()
  })

  results.userMedia = await deleteByUserId(env.USER_REMOVAL_DB, 'user_media', userId)

  // Step 3: Remove user profile data
  await logRemovalProgress(env, userId, {
    step: 'removing_profile',
    status: 'in_progress',
    message: 'Removing user profile...',
    timestamp: new Date().toISOString()
  })

  results.userProfiles = await deleteByUserId(env.USER_REMOVAL_DB, 'user_profiles', userId)

  // Step 4: Remove user settings
  await logRemovalProgress(env, userId, {
    step: 'removing_settings',
    status: 'in_progress',
    message: 'Removing user settings...',
    timestamp: new Date().toISOString()
  })

  results.userSettings = await deleteByUserId(env.USER_REMOVAL_DB, 'user_settings', userId)
  results.appSettings = await deleteByUserId(env.USER_REMOVAL_DB, 'app_settings', userId)

  // Step 5: Remove identity rows. Tiko identity is D1-backed; there is no Supabase Auth account.
  await logRemovalProgress(env, userId, {
    step: 'removing_identity',
    status: 'in_progress',
    message: 'Removing identity sessions, devices, magic links, and user row...',
    timestamp: new Date().toISOString()
  })

  results.sessions = await deleteByUserId(env.USER_REMOVAL_DB, 'sessions', userId)
  results.devices = await deleteByUserId(env.USER_REMOVAL_DB, 'devices', userId)
  results.magicLinks = await deleteByUserId(env.USER_REMOVAL_DB, 'magic_links', userId)

  const userDelete = await env.USER_REMOVAL_DB
    .prepare('DELETE FROM users WHERE id = ?')
    .bind(userId)
    .run()

  results.authAccount = (userDelete.meta.changes ?? 0) > 0

  return results
}

async function deleteByUserId(db: D1Database, tableName: string, userId: string): Promise<number> {
  if (!/^[a-z_]+$/.test(tableName)) {
    throw new Error(`Unsafe table name: ${tableName}`)
  }

  const result = await db
    .prepare(`DELETE FROM ${tableName} WHERE user_id = ?`)
    .bind(userId)
    .run()

  return result.meta.changes ?? 0
}

async function logRemovalProgress(
  env: Env,
  userId: string,
  progress: UserRemovalProgress
): Promise<void> {
  if (!env.USER_REMOVAL_LOG) return
  
  try {
    const existingLog = await env.USER_REMOVAL_LOG.get(userId)
    const logs = existingLog ? JSON.parse(existingLog) : []
    
    logs.push(progress)
    
    await env.USER_REMOVAL_LOG.put(userId, JSON.stringify(logs), {
      expirationTtl: 86400 // Keep logs for 24 hours
    })
  } catch (error) {
    console.error('Failed to log removal progress:', error)
  }
}