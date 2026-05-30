import type { AuthContext, AuthEnv, SessionRow } from './types'
import { AuthError } from './types'
import { hashSecret } from './crypto'

export async function validateSession(token: string, env: AuthEnv): Promise<AuthContext> {
  const tokenHash = await hashSecret(token, env.IDENTITY_TOKEN_PEPPER)

  // Check KV cache first
  let session: SessionRow | null = null
  const cacheKey = `session:${tokenHash}`

  if (env.IDENTITY_SESSION_CACHE) {
    const cached = await env.IDENTITY_SESSION_CACHE.get(cacheKey)
    if (cached) {
      try {
        session = JSON.parse(cached)
      } catch {
        // Cache corruption — fall through to D1
      }
    }
  }

  // Fall back to D1
  if (!session) {
    session = await env.IDENTITY_DB.prepare(
      `SELECT id, user_id, device_id, state, expires_at
       FROM sessions
       WHERE token_hash = ? AND state = 'active'
       LIMIT 1`,
    )
      .bind(tokenHash)
      .first<SessionRow>()
  }

  if (!session) {
    throw new AuthError(401, 'INVALID_SESSION', 'Invalid or expired session')
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    throw new AuthError(401, 'SESSION_EXPIRED', 'Session has expired')
  }

  // Cache in KV for 60s
  if (env.IDENTITY_SESSION_CACHE) {
    env.IDENTITY_SESSION_CACHE.put(cacheKey, JSON.stringify(session), { expirationTtl: 60 })
  }

  return {
    type: 'session',
    userId: session.user_id,
    sessionId: session.id,
    plan: 'free',
    scope: 'all',
    rateLimitRpm: 10,
    rateLimitRpd: 100,
  }
}
