import type { AuthContext, AuthEnv } from './types'
import { AuthError, type ApiKeyRow } from './types'
import { hashSecret, isApiKeyToken } from './crypto'

export function extractBearerToken(request: Request): string {
  const header = request.headers.get('Authorization')
  if (!header) {
    throw new AuthError(401, 'MISSING_AUTH', 'Authorization header required')
  }
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    throw new AuthError(401, 'INVALID_AUTH_FORMAT', 'Authorization header must use Bearer format')
  }
  return match[1].trim()
}

export async function validateApiKey(token: string, env: AuthEnv): Promise<AuthContext> {
  const keyHash = await hashSecret(token, env.IDENTITY_TOKEN_PEPPER)

  const row = await env.IDENTITY_DB.prepare(
    `SELECT id, key_prefix, scope, plan, rate_limit_rpm, rate_limit_rpd, state, user_id
     FROM api_keys
     WHERE key_hash = ? AND state = 'active'
     LIMIT 1`,
  )
    .bind(keyHash)
    .first<ApiKeyRow>()

  if (!row) {
    throw new AuthError(401, 'INVALID_API_KEY', 'Invalid or revoked API key')
  }

  // Touch last_used_at (fire-and-forget)
  const now = new Date().toISOString()
  env.IDENTITY_DB.prepare(`UPDATE api_keys SET last_used_at = ?, updated_at = ? WHERE id = ?`)
    .bind(now, now, row.id)
    .run()

  return {
    type: 'api_key',
    userId: row.user_id || 'api-key:' + row.id,
    apiKeyId: row.id,
    apiKeyPrefix: row.key_prefix,
    plan: row.plan as 'free' | 'pro',
    scope: row.scope,
    rateLimitRpm: row.rate_limit_rpm,
    rateLimitRpd: row.rate_limit_rpd,
  }
}

export function routeByTokenType(token: string): 'api_key' | 'session' {
  return isApiKeyToken(token) ? 'api_key' : 'session'
}
