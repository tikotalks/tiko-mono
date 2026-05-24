import type { ApiBody, SessionBundle } from './types'

export type { SessionBundle }

export interface BrowserIdentityClientOptions {
  baseUrl?: string
  storage?: StorageLike
  storageKey?: string
  fetch?: typeof fetch
  getHostname?: () => string
  getLocationOrigin?: () => string
  getUserAgent?: () => string
  getRandomId?: () => string
  now?: () => number
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface StartEmailVerificationInput {
  email: string
  name?: string
  displayName?: string
  redirectUrl?: string
}

export interface UpdateProfileInput {
  displayName?: string | null
  avatarUrl?: string | null
  metadata?: Record<string, unknown>
}

export interface EmailVerificationResult {
  magicLinkId: string
  expiresAt: string
  queued: boolean
}

export interface ProfileUpdateResult {
  user?: SessionBundle['user']
  session?: SessionBundle
}

export interface RevokeCurrentDeviceResult {
  revoked: boolean
}

const DEFAULT_IDENTITY_BASE_URL = 'https://id.tiko.mt'
const DEFAULT_STORAGE_KEY = 'tiko_identity_session'
const HOST_APP_ID_ALIASES: Record<string, string> = {
  yesno: 'yes-no'
}

export function createBrowserIdentityClient(options: BrowserIdentityClientOptions = {}): BrowserIdentityClient {
  return new BrowserIdentityClient(options)
}

export function resolveIdentityBaseUrl(): string {
  return DEFAULT_IDENTITY_BASE_URL
}

export class BrowserIdentityClient {
  private readonly baseUrl: string
  private readonly storageKey: string
  private readonly fetcher: typeof fetch
  private readonly getHostname: () => string
  private readonly getLocationOrigin: () => string
  private readonly getUserAgent: () => string
  private readonly getRandomId: () => string
  private readonly now: () => number
  private readonly storage?: StorageLike

  constructor(options: BrowserIdentityClientOptions = {}) {
    this.baseUrl = stripTrailingSlash(options.baseUrl || resolveIdentityBaseUrl())
    this.storageKey = options.storageKey || DEFAULT_STORAGE_KEY
    this.fetcher = options.fetch || globalThis.fetch.bind(globalThis)
    this.getHostname = options.getHostname || (() => globalThis.location?.hostname || 'tiko')
    this.getLocationOrigin = options.getLocationOrigin || (() => globalThis.location?.origin || '')
    this.getUserAgent = options.getUserAgent || (() => globalThis.navigator?.userAgent || '')
    this.getRandomId = options.getRandomId || defaultRandomId
    this.now = options.now || (() => Date.now())
    this.storage = options.storage || getBrowserStorage()
  }

  async getOrCreateSession(): Promise<SessionBundle> {
    const stored = this.getStoredSession()

    if (stored && !isExpired(stored, this.now())) {
      try {
        return await this.refreshSession(stored.sessionToken)
      } catch {
        return stored
      }
    }

    if (stored) {
      this.clearStoredSession()
    }

    return this.createDeviceSession()
  }

  async refreshSession(sessionToken = this.getStoredSession()?.sessionToken): Promise<SessionBundle> {
    if (!sessionToken) {
      throw new Error('No identity session token is available')
    }

    const response = await this.request('/api/identity/session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` }
    })

    const bundle = await this.readApiResponse<SessionBundle>(response, 'Failed to refresh identity session')
    this.storeSession(bundle)
    return bundle
  }

  async updateProfile(input: UpdateProfileInput, sessionToken = this.getStoredSession()?.sessionToken): Promise<ProfileUpdateResult> {
    if (!sessionToken) {
      throw new Error('No identity session token is available')
    }

    const response = await this.request('/api/identity/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify(input)
    })

    return this.readApiResponse<ProfileUpdateResult>(response, 'Failed to update identity profile')
  }

  async startEmailVerification(input: StartEmailVerificationInput, sessionToken?: string): Promise<EmailVerificationResult> {
    const token = sessionToken || (await this.getOrCreateSession()).sessionToken
    const response = await this.request('/api/identity/email', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        email: input.email,
        name: input.name,
        displayName: input.displayName,
        redirectUrl: input.redirectUrl || this.getDefaultRedirectUrl()
      })
    })

    return this.readApiResponse<EmailVerificationResult>(response, 'Failed to start email verification')
  }

  async verifyMagicLink(token: string): Promise<SessionBundle> {
    const response = await this.request(`/api/identity/verify-magic-link?token=${encodeURIComponent(token)}`, {
      method: 'GET'
    })

    const bundle = await this.readApiResponse<SessionBundle>(response, 'Magic link verification failed')
    this.storeSession(bundle)
    return bundle
  }

  async revokeCurrentDevice(sessionToken = this.getStoredSession()?.sessionToken): Promise<RevokeCurrentDeviceResult> {
    if (!sessionToken) {
      this.clearStoredSession()
      return { revoked: true }
    }

    try {
      const response = await this.request('/api/identity/session', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionToken}` }
      })
      return await this.readApiResponse<RevokeCurrentDeviceResult>(response, 'Failed to revoke identity session')
    } finally {
      this.clearStoredSession()
    }
  }

  getStoredSession(): SessionBundle | null {
    try {
      const stored = this.storage?.getItem(this.storageKey)
      if (!stored) return null
      return JSON.parse(stored) as SessionBundle
    } catch {
      return null
    }
  }

  storeSession(bundle: SessionBundle): void {
    this.storage?.setItem(this.storageKey, JSON.stringify(bundle))
  }

  clearStoredSession(): void {
    this.storage?.removeItem(this.storageKey)
  }

  getCurrentAppId(): string {
    return resolveAppIdFromHostname(this.getHostname())
  }

  private async createDeviceSession(): Promise<SessionBundle> {
    const response = await this.request('/api/identity/device', {
      method: 'POST',
      body: JSON.stringify({
        appId: this.getCurrentAppId(),
        displayName: this.getDefaultDeviceDisplayName(),
        fingerprint: this.getDeviceFingerprint()
      })
    })

    const bundle = await this.readApiResponse<SessionBundle>(response, 'Failed to create device identity')
    this.storeSession(bundle)
    return bundle
  }

  private getDefaultRedirectUrl(): string {
    const origin = this.getLocationOrigin()
    return origin ? `${origin}/auth/callback` : '/auth/callback'
  }

  private getDefaultDeviceDisplayName(): string {
    const appId = this.getCurrentAppId()
    const platform = this.getUserAgent().includes('Mobile') ? 'mobile device' : 'device'
    return `${appId} ${platform}`
  }

  private getDeviceFingerprint(): Record<string, string> {
    const storageKey = 'tiko_identity_device_fingerprint'
    const existing = this.storage?.getItem(storageKey)
    const deviceKey = existing || this.getRandomId()

    if (!existing) {
      this.storage?.setItem(storageKey, deviceKey)
    }

    return {
      deviceKey,
      userAgent: this.getUserAgent(),
      platform: globalThis.navigator?.platform || '',
      language: globalThis.navigator?.language || '',
      timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || '' : ''
    }
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    const headers = new Headers(init.headers || {})

    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json')
    }

    return this.fetcher(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: 'include'
    })
  }

  private async readApiResponse<T>(response: Response, fallback: string): Promise<T> {
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, fallback))
    }

    const body = (await response.json()) as ApiBody<T>

    if (!body.ok) {
      const errorBody = body as Extract<ApiBody<T>, { ok: false }>
      throw new Error(errorBody.error?.message || fallback)
    }

    return body.data
  }
}

export function resolveAppIdFromHostname(hostname: string): string {
  const normalizedHostname = hostname.toLowerCase()

  if (normalizedHostname === 'localhost' || normalizedHostname === '127.0.0.1') {
    return 'local'
  }

  const labels = normalizedHostname.split('.').filter(Boolean)

  if (labels.length >= 4 && labels[0] === 'dev' && labels.at(-2) === 'tikoapps' && labels.at(-1) === 'org') {
    return normalizeHostedAppId(labels[1])
  }

  if (labels.length >= 3 && labels.at(-2) === 'tikoapps' && labels.at(-1) === 'org') {
    return normalizeHostedAppId(labels[0])
  }

  return normalizeHostedAppId(labels[0] || 'tiko')
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json()

    if (typeof data?.error === 'string') return data.error
    if (typeof data?.message === 'string') return data.message
    if (typeof data?.error?.message === 'string') return data.error.message
  } catch {
    return fallback
  }

  return fallback
}

function isExpired(bundle: SessionBundle, nowMs: number): boolean {
  return new Date(bundle.session.expiresAt).getTime() <= nowMs
}

function normalizeHostedAppId(appId: string): string {
  return HOST_APP_ID_ALIASES[appId] || appId || 'tiko'
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function getBrowserStorage(): StorageLike | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

function defaultRandomId(): string {
  if (globalThis.crypto && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
