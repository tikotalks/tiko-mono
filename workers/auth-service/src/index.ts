import { createAuth, getAuthBasePath, isAuthRoute } from './auth'
import type {
  AuthSessionResponse,
  AuthUserResponse,
  EmailOtpSendRequest,
  EmailOtpVerifyRequest,
  Env,
  GoogleSignInRequest,
  SessionPayload,
  UserProfileRecord
} from './types'

const AUTH_BASE_PATH = getAuthBasePath()

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const auth = createAuth(env, ctx)

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(request, env)
      })
    }

    const url = new URL(request.url)

    if (isAuthRoute(url.pathname)) {
      return withCors(await auth.handler(request), request, env)
    }

    if (url.pathname === '/health' && request.method === 'GET') {
      return json(
        {
          ok: true,
          service: 'tiko-auth-service',
          hasD1: Boolean(env.AUTH_DB),
          hasAuthSecret: Boolean(env.BETTER_AUTH_SECRET),
          hasGoogle: Boolean(env.AUTH_GOOGLE_CLIENT_ID && env.AUTH_GOOGLE_CLIENT_SECRET),
          hasResend: Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL)
        },
        200,
        request,
        env
      )
    }

    if (url.pathname === '/session' && request.method === 'GET') {
      const sessionPayload = await buildSessionPayload(auth, request, env)

      return json(sessionPayload, 200, request, env)
    }

    if (url.pathname === '/user' && request.method === 'GET') {
      const sessionPayload = await buildSessionPayload(auth, request, env)

      if (!sessionPayload.authenticated || !sessionPayload.user) {
        return json({ success: false, error: 'Not authenticated' }, 401, request, env)
      }

      return json({ success: true, user: sessionPayload.user }, 200, request, env)
    }

    if (url.pathname === '/user/metadata' && request.method === 'PATCH') {
      const sessionResult = await auth.api.getSession({
        headers: request.headers
      })

      if (!sessionResult?.session || !sessionResult.user) {
        return json({ success: false, error: 'Not authenticated' }, 401, request, env)
      }

      const body = (await request.json()) as Record<string, unknown>
      const profile = await upsertUserProfile(env, sessionResult.user, body)
      const user = toCompatUser(sessionResult.user, profile)

      return json({ success: true, user }, 200, request, env)
    }

    if (url.pathname === '/email-otp/send' && request.method === 'POST') {
      const body = (await request.json()) as EmailOtpSendRequest
      const validationError = validateOtpSend(body)

      if (validationError) {
        return json({ success: false, error: validationError }, 400, request, env)
      }

      const authRequest = createInternalAuthRequest(
        request,
        `${AUTH_BASE_PATH}/email-otp/send-verification-otp`,
        {
          email: body.email,
          type: 'sign-in'
        }
      )

      return withCors(await auth.handler(authRequest), request, env)
    }

    if (url.pathname === '/email-otp/verify' && request.method === 'POST') {
      const body = (await request.json()) as EmailOtpVerifyRequest
      const validationError = validateOtpVerify(body)

      if (validationError) {
        return json({ success: false, error: validationError }, 400, request, env)
      }

      const authRequest = createInternalAuthRequest(
        request,
        `${AUTH_BASE_PATH}/sign-in/email-otp`,
        {
          email: body.email,
          otp: body.code,
          name: body.name
        }
      )

      const response = await auth.handler(authRequest)

      return withCors(response, request, env)
    }

    if (url.pathname === '/oauth/google' && (request.method === 'GET' || request.method === 'POST')) {
      const body = request.method === 'POST' ? ((await request.json()) as GoogleSignInRequest) : {}
      const callbackURLInput =
        body.callbackURL || body.returnUrl || url.searchParams.get('callbackURL') || url.searchParams.get('returnUrl') || undefined
      const errorCallbackURLInput =
        body.errorCallbackURL || url.searchParams.get('errorCallbackURL') || undefined
      const callbackURL = resolveAllowedRedirect(callbackURLInput, env)
      const errorCallbackURL = resolveAllowedRedirect(errorCallbackURLInput, env)

      if (callbackURLInput && !callbackURL) {
        return json({ success: false, error: 'Invalid callback URL' }, 400, request, env)
      }

      if (errorCallbackURLInput && !errorCallbackURL) {
        return json({ success: false, error: 'Invalid error callback URL' }, 400, request, env)
      }

      const authRequest = createInternalAuthRequest(
        request,
        `${AUTH_BASE_PATH}/sign-in/social`,
        {
          provider: 'google',
          callbackURL,
          errorCallbackURL,
          disableRedirect: request.method === 'POST'
        },
        'POST'
      )

      return withCors(await auth.handler(authRequest), request, env)
    }

    if (url.pathname === '/sign-out' && request.method === 'POST') {
      const authRequest = createInternalAuthRequest(request, `${AUTH_BASE_PATH}/sign-out`)

      return withCors(await auth.handler(authRequest), request, env)
    }

    return json({ success: false, error: 'Not found' }, 404, request, env)
  }
}

function validateOtpSend(body: Partial<EmailOtpSendRequest>): string | null {
  if (!body.email) {
    return 'Email is required'
  }

  if (!isValidEmail(body.email)) {
    return 'Email is invalid'
  }

  return null
}

function validateOtpVerify(body: Partial<EmailOtpVerifyRequest>): string | null {
  if (!body.email) {
    return 'Email is required'
  }

  if (!body.code) {
    return 'Code is required'
  }

  if (!isValidEmail(body.email)) {
    return 'Email is invalid'
  }

  if (!/^[0-9]{6}$/.test(body.code)) {
    return 'Code format is invalid'
  }

  return null
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function buildSessionPayload(
  auth: ReturnType<typeof createAuth>,
  request: Request,
  env: Env
): Promise<SessionPayload> {
  const sessionResult = await auth.api.getSession({
    headers: request.headers
  })

  if (!sessionResult?.session || !sessionResult.user) {
    return {
      authenticated: false,
      user: null,
      session: null
    }
  }

  const profile = await upsertUserProfile(env, sessionResult.user)

  return {
    authenticated: true,
    user: toCompatUser(sessionResult.user, profile),
    session: {
      id: sessionResult.session.id,
      token: sessionResult.session.token,
      expiresAt: sessionResult.session.expiresAt.toISOString()
    }
  }
}

async function upsertUserProfile(
  env: Env,
  user: AuthUserResponse,
  metadataPatch?: Record<string, unknown>
): Promise<UserProfileRecord | null> {
  const existingProfile = await getUserProfile(env, user.id)
  const existingMetadata = parseJsonObject(existingProfile?.metadata)
  const nextMetadata = metadataPatch ? { ...existingMetadata, ...metadataPatch } : existingMetadata
  const nextName = asOptionalString(metadataPatch?.name) || asOptionalString(metadataPatch?.full_name) || user.name || existingProfile?.name || null
  const nextAvatarUrl =
    asOptionalString(metadataPatch?.avatar_url) ||
    asOptionalString(metadataPatch?.image) ||
    user.image ||
    existingProfile?.avatar_url ||
    null
  const now = new Date().toISOString()

  await env.AUTH_DB.prepare(
    `
      INSERT INTO user_profiles (
        user_id,
        email,
        name,
        avatar_url,
        metadata,
        last_sign_in_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?)
      ON CONFLICT(user_id) DO UPDATE SET
        email = excluded.email,
        name = excluded.name,
        avatar_url = excluded.avatar_url,
        metadata = excluded.metadata,
        last_sign_in_at = excluded.last_sign_in_at,
        updated_at = excluded.updated_at
    `
  )
    .bind(
      user.id,
      user.email,
      nextName,
      nextAvatarUrl,
      JSON.stringify(nextMetadata),
      now,
      existingProfile?.created_at || now,
      now
    )
    .run()

  return {
    ...(existingProfile || {}),
    user_id: user.id,
    email: user.email,
    name: nextName,
    avatar_url: nextAvatarUrl,
    metadata: JSON.stringify(nextMetadata),
    role: existingProfile?.role || 'user',
    created_at: existingProfile?.created_at || now,
    updated_at: now
  }
}

async function getUserProfile(env: Env, userId: string): Promise<UserProfileRecord | null> {
  const row = await env.AUTH_DB.prepare(
    `
      SELECT
        user_id,
        email,
        name,
        avatar_url,
        role,
        metadata,
        created_at,
        updated_at
      FROM user_profiles
      WHERE user_id = ?
      LIMIT 1
    `
  )
    .bind(userId)
    .first<UserProfileRecord>()

  return row || null
}

function toCompatUser(user: AuthUserResponse, profile: UserProfileRecord | null): SessionPayload['user'] {
  const metadata = parseJsonObject(profile?.metadata)

  return {
    id: user.id,
    email: user.email,
    full_name: profile?.name || user.name || '',
    avatar_url: profile?.avatar_url || user.image || '',
    email_verified: user.emailVerified,
    phone_verified: false,
    app_metadata: {
      role: profile?.role || 'user'
    },
    user_metadata: metadata,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString()
  }
}

function parseJsonObject(value: string | null | undefined): Record<string, any> {
  if (!value) {
    return {}
  }

  try {
    const parsed = JSON.parse(value)

    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function asOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function createInternalAuthRequest(
  request: Request,
  pathname: string,
  body?: Record<string, unknown>,
  method = request.method
): Request {
  const url = new URL(request.url)
  url.pathname = pathname
  url.search = ''

  const headers = new Headers(request.headers)
  headers.set('Content-Type', 'application/json')

  return new Request(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
}

function resolveAllowedRedirect(urlValue: string | null | undefined, env: Env): string | undefined {
  if (!urlValue) {
    return undefined
  }

  try {
    const parsed = new URL(urlValue)
    const allowedOrigins = parseAllowedOrigins(env.ALLOWED_APP_ORIGINS)

    if (!allowedOrigins.has(parsed.origin)) {
      return undefined
    }

    return parsed.toString()
  } catch {
    return undefined
  }
}

function buildCorsHeaders(request: Request, env: Env): Record<string, string> {
  const requestOrigin = request.headers.get('Origin')
  const allowedOrigins = parseAllowedOrigins(env.ALLOWED_APP_ORIGINS)
  const allowOrigin =
    requestOrigin && allowedOrigins.has(requestOrigin) ? requestOrigin : allowedOrigins.values().next().value || '*'

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin'
  }
}

function parseAllowedOrigins(value: string): Set<string> {
  return new Set(
    value
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean)
  )
}

function json(body: unknown, status: number, request: Request, env: Env): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...buildCorsHeaders(request, env),
      'Content-Type': 'application/json'
    }
  })
}

function withCors(response: Response, request: Request, env: Env): Response {
  const headers = new Headers(response.headers)
  const corsHeaders = buildCorsHeaders(request, env)

  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}
