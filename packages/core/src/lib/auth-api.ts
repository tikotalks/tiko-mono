// Tiko device-first identity API client.
// This replaces the previous direct Supabase Auth REST calls. Apps should talk to
// the Cloudflare identity origin and store only Tiko session bundles locally.

export interface AuthSession {
  access_token: string
  refresh_token?: string
  expires_in?: number
  expires_at: number
  token_type: string
  user: AuthUser
}

export interface AuthUser {
  id: string
  email: string | null
  created_at: string
  updated_at: string
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
}

interface IdentityApiUser {
  id: string
  primaryEmail: string | null
  createdAt: string
  updatedAt: string
  lastSeenAt: string | null
}

interface IdentitySessionBundle {
  user: IdentityApiUser
  device?: unknown
  session: {
    id: string
    userId: string
    deviceId: string
    expiresAt: string
  }
  sessionToken?: string
}

interface IdentityApiSuccess<T> {
  ok: true
  data: T
}

interface IdentityApiError {
  ok: false
  error: {
    code: string
    message: string
  }
}

type IdentityApiBody<T> = IdentityApiSuccess<T> | IdentityApiError

export interface AuthAPIOptions {
  baseUrl?: string
  fetchImpl?: typeof fetch
}

const SESSION_STORAGE_KEY = 'tiko_auth_session'

function resolveIdentityBaseUrl(): string {
  const globalConfig = globalThis as typeof globalThis & {
    __TIKO_IDENTITY_URL__?: string
    __TIKO_CONFIG__?: { identityUrl?: string }
  }

  return (
    globalConfig.__TIKO_IDENTITY_URL__ ||
    globalConfig.__TIKO_CONFIG__?.identityUrl ||
    'https://id.tiko.mt'
  ).replace(/\/+$/, '')
}

export class AuthAPI {
  private readonly baseUrl: string
  private readonly fetchImpl: typeof fetch

  constructor(options: AuthAPIOptions = {}) {
    this.baseUrl = (options.baseUrl || resolveIdentityBaseUrl()).replace(/\/+$/, '')
    this.fetchImpl = options.fetchImpl || fetch
  }

  private async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    const body = (await response.json()) as IdentityApiBody<T>

    if (!response.ok) {
      if (body.ok === false) {
        throw new Error(body.error.message)
      }
      throw new Error('Identity API call failed')
    }

    if (body.ok === false) {
      throw new Error(body.error.message)
    }

    return body.data
  }

  async sendMagicLink(email: string): Promise<void> {
    const session = this.getStoredSession()
    const headers: Record<string, string> = {}
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
    }

    await this.apiCall('/api/identity/email', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email })
    })
  }

  async getUser(accessToken: string): Promise<AuthUser> {
    const bundle = await this.apiCall<IdentitySessionBundle>('/api/identity/session', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    return toAuthUser(bundle.user)
  }

  getStoredSession(): AuthSession | null {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!stored) return null

    try {
      const session = JSON.parse(stored) as AuthSession
      if (session.expires_at && session.expires_at < Date.now() / 1000) {
        localStorage.removeItem(SESSION_STORAGE_KEY)
        return null
      }
      return session
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }
  }

  storeSession(session: AuthSession): void {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  }

  storeIdentityBundle(bundle: IdentitySessionBundle): void {
    const expiresAt = Math.floor(new Date(bundle.session.expiresAt).getTime() / 1000)
    this.storeSession({
      access_token: bundle.sessionToken || '',
      expires_at: expiresAt,
      token_type: 'Bearer',
      user: toAuthUser(bundle.user)
    })
  }

  clearSession(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }
}

function toAuthUser(user: IdentityApiUser): AuthUser {
  return {
    id: user.id,
    email: user.primaryEmail,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
    user_metadata: {},
    app_metadata: {}
  }
}

export const authAPI = new AuthAPI()
