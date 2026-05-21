import { stripBearer } from './crypto'
import { fingerprintFromRequest } from './fingerprint'
import { anonymousCleanupCutoff, cleanupInactiveAnonymousUsers, createMagicLink, createSession, refreshSession, registerDevice, revokeSession, validateSession, verifyMagicLink } from './repository'
import type { ApiBody, IdentityEnv, RegisterDeviceRequest } from './types'

export async function handleIdentityRequest(request: Request, env: IdentityEnv): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) })
  }

  const url = new URL(request.url)
  const pathname = url.pathname.replace(/\/+$/, '') || '/'

  try {
    if (pathname === '/api/identity/device' && request.method === 'POST') {
      const body = (await request.json()) as RegisterDeviceRequest
      const appId = body.appId || url.searchParams.get('appId') || ''
      const bundle = await registerDevice(env, {
        ...body,
        appId,
        fingerprint: fingerprintFromRequest(request, appId, body.fingerprint)
      })
      return json({ ok: true, data: bundle }, 201, request, env)
    }

    if (pathname === '/api/identity/session' && request.method === 'GET') {
      const token = stripBearer(request.headers.get('authorization'))
      if (!token) return jsonError('missing_session', 'Session bearer token is required.', 401, request, env)
      const session = await validateSession(env, token)
      if (!session) return jsonError('invalid_session', 'Session is invalid or expired.', 401, request, env)
      return json({ ok: true, data: session }, 200, request, env)
    }

    if (pathname === '/api/identity/session' && request.method === 'POST') {
      const token = stripBearer(request.headers.get('authorization'))
      if (token) {
        const refreshed = await refreshSession(env, token)
        if (!refreshed) return jsonError('invalid_session', 'Session is invalid or expired.', 401, request, env)
        return json({ ok: true, data: refreshed }, 200, request, env)
      }

      const body = (await request.json()) as { userId?: string; deviceId?: string }
      if (!body.userId || !body.deviceId) {
        return jsonError('invalid_request', 'userId and deviceId are required when no bearer session is provided.', 400, request, env)
      }
      return json({ ok: true, data: await createSession(env, body.userId, body.deviceId) }, 201, request, env)
    }

    if (pathname === '/api/identity/session' && request.method === 'DELETE') {
      const token = stripBearer(request.headers.get('authorization'))
      if (!token) return jsonError('missing_session', 'Session bearer token is required.', 401, request, env)
      await revokeSession(env, token)
      return json({ ok: true, data: { revoked: true } }, 200, request, env)
    }

    if (pathname === '/api/identity/email' && request.method === 'POST') {
      const token = stripBearer(request.headers.get('authorization'))
      if (!token) return jsonError('missing_session', 'Session bearer token is required.', 401, request, env)
      const session = await validateSession(env, token)
      if (!session) return jsonError('invalid_session', 'Session is invalid or expired.', 401, request, env)
      const body = (await request.json()) as { email?: string; redirectUrl?: string; name?: string; displayName?: string }
      if (!body.email) return jsonError('invalid_email', 'Email is required.', 400, request, env)
      const link = await createMagicLink(env, session.user.id, body.email, 'recovery', body.redirectUrl || null, body.name || body.displayName || null)
      return json({ ok: true, data: { magicLinkId: link.magicLink.id, expiresAt: link.magicLink.expiresAt, queued: Boolean(env.MAGIC_LINK_QUEUE) } }, 202, request, env)
    }

    if (pathname === '/api/identity/verify-magic-link' && request.method === 'GET') {
      const token = url.searchParams.get('token') || ''
      if (!token) return jsonError('missing_token', 'Magic link token is required.', 400, request, env)
      const session = await verifyMagicLink(env, token)
      if (!session) return jsonError('invalid_token', 'Magic link token is invalid or expired.', 400, request, env)
      return json({ ok: true, data: session }, 200, request, env)
    }

    return jsonError('not_found', 'Identity endpoint not found.', 404, request, env)
  } catch (error) {
    return jsonError('identity_error', error instanceof Error ? error.message : 'Identity request failed.', 500, request, env)
  }
}

function json<T>(body: ApiBody<T>, status: number, request: Request, env: IdentityEnv): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(request, env)
    }
  })
}

function jsonError(code: string, message: string, status: number, request: Request, env: IdentityEnv): Response {
  return json({ ok: false, error: { code, message } }, status, request, env)
}

function corsHeaders(request: Request, env: IdentityEnv): Record<string, string> {
  const origin = request.headers.get('origin') || ''
  const allowed = parseAllowedOrigins(env.IDENTITY_ALLOWED_ORIGINS)
  const allowOrigin = isAllowedOrigin(origin, allowed) ? origin || '*' : allowed.find((entry) => entry !== '*') || '*'

  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'access-control-allow-credentials': 'true',
    'access-control-max-age': '86400',
    vary: 'Origin'
  }
}

function parseAllowedOrigins(value?: string): string[] {
  return (value || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}


export async function cleanupInactiveAnonymousUsersForSchedule(env: IdentityEnv, scheduledTime = new Date()): Promise<{ deletedUsers: number; cutoffIso: string; retentionDays: number }> {
  const parsedRetentionDays = Number(env.ANONYMOUS_USER_RETENTION_DAYS || 7)
  const retentionDays = Number.isFinite(parsedRetentionDays) && parsedRetentionDays > 0 ? parsedRetentionDays : 7
  const cutoffIso = anonymousCleanupCutoff(retentionDays, scheduledTime)
  const result = await cleanupInactiveAnonymousUsers(env, cutoffIso)
  return { ...result, cutoffIso, retentionDays }
}

function isAllowedOrigin(origin: string, allowed: string[]): boolean {
  if (!origin) return allowed.includes('*')
  if (allowed.includes('*') || allowed.includes(origin)) return true

  return allowed.some((pattern) => {
    if (!pattern.includes('*')) return false
    const escaped = pattern
      .split('*')
      .map(escapeRegExp)
      .join('.+')
    return new RegExp(`^${escaped}$`).test(origin)
  })
}

function escapeRegExp(value: string): string {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
}
