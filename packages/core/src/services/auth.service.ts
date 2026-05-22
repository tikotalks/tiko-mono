/**
 * Authentication Service
 *
 * Centralized auth client for the Cloudflare auth worker. The worker owns the
 * real session via shared cookies; localStorage is only a cache for faster app
 * boot and compatibility with existing store code.
 */

export interface AuthUser {
  id: string
  email: string
  phone?: string
  full_name?: string
  avatar_url?: string
  email_verified: boolean
  phone_verified: boolean
  app_metadata: Record<string, any>
  user_metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_at: number
  expires_in: number
  token_type: string
  user: AuthUser
  identity?: IdentitySessionBundle
}

export interface AuthResult {
  success: boolean
  session?: AuthSession
  user?: AuthUser
  error?: string
}

export interface AuthService {
  signInWithEmail(email: string, password: string): Promise<AuthResult>
  signUpWithEmail(email: string, password: string, fullName?: string): Promise<AuthResult>
  signInWithMagicLink(email: string, fullName?: string): Promise<AuthResult>
  signInWithGoogle(callbackUrl?: string): Promise<AuthResult>
  getGoogleSignInUrl(callbackUrl?: string): string
  verifyOtp(email: string, token: string): Promise<AuthResult>
  resendOtp(email: string): Promise<AuthResult>
  signOut(): Promise<{ success: boolean; error?: string }>
  getSession(): Promise<AuthSession | null>
  ensureSession(): Promise<AuthSession>
  handleMagicLinkCallback(): Promise<AuthResult>
  refreshSession(refreshToken: string): Promise<AuthResult>
  updateUser(updates: Partial<AuthUser>): Promise<AuthResult>
  updateUserMetadata(metadata: Record<string, any>): Promise<AuthResult>
  getUserRole(): Promise<'user' | 'editor' | 'admin' | null>
  hasRole(requiredRole: 'editor' | 'admin'): Promise<boolean>
  getCurrentUser(): Promise<AuthResult>
  cleanupDataUrlAvatar(): Promise<AuthResult>
}

interface WorkerSessionPayload {
  authenticated: boolean
  user: AuthUser | null
  session: {
    id: string
    token: string
    expiresAt: string
  } | null
}

interface WorkerUserResponse {
  success: boolean
  user?: AuthUser
  error?: string
}

interface IdentityUser {
  id: string
  primaryEmail: string | null
  displayName: string | null
  createdAt: string
  updatedAt: string
  lastSeenAt: string | null
}

interface IdentityDevice {
  id: string
  userId: string
  appId: string
  deviceKeyHash: string | null
  fingerprintHash: string
  displayName: string | null
  trusted: boolean
  createdAt: string
  updatedAt: string
  lastSeenAt: string | null
}

interface IdentitySession {
  id: string
  userId: string
  deviceId: string
  state: string
  createdAt: string
  updatedAt: string
  expiresAt: string
  revokedAt: string | null
  lastSeenAt: string | null
}

interface IdentitySessionBundle {
  user: IdentityUser
  device: IdentityDevice
  session: IdentitySession
  sessionToken: string
}

interface IdentityApiSuccess<T> {
  ok: true
  data: T
}

interface IdentityApiError {
  ok: false
  error?: {
    code?: string
    message?: string
  }
}

type IdentityApiBody<T> = IdentityApiSuccess<T> | IdentityApiError

const DEFAULT_AUTH_BASE_URL = 'https://id.tiko.mt'
const AUTH_SESSION_STORAGE_KEY = 'tiko_auth_session'
const PENDING_EMAIL_KEY = 'tiko_pending_auth_email'
const PENDING_NAME_KEY = 'tiko_pending_auth_name'
const HOST_APP_ID_ALIASES: Record<string, string> = {
  yesno: 'yes-no'
}

export function resolveAuthBaseUrl(): string {
  const env = import.meta.env
  const envBaseUrl = env?.VITE_IDENTITY_BASE_URL || env?.VITE_AUTH_BASE_URL

  return stripTrailingSlash(envBaseUrl || DEFAULT_AUTH_BASE_URL)
}

export class CentralAuthService implements AuthService {
  private readonly authBaseUrl: string
  private readonly getHostname: () => string

  constructor(authBaseUrl = resolveAuthBaseUrl(), getHostname = () => window.location.hostname) {
    this.authBaseUrl = stripTrailingSlash(authBaseUrl)
    this.getHostname = getHostname
  }

  async signInWithEmail(): Promise<AuthResult> {
    return {
      success: false,
      error: 'Email/password login is disabled. Use the email verification code flow instead.'
    }
  }

  async signUpWithEmail(email: string, _password: string, fullName?: string): Promise<AuthResult> {
    const result = await this.signInWithMagicLink(email, fullName)

    if (!result.success) {
      return result
    }

    return { success: true }
  }

  async signInWithMagicLink(email: string, fullName?: string): Promise<AuthResult> {
    try {
      this.storePendingAuthState(email, fullName)
      const session = await this.ensureSession()

      const response = await this.fetchResponse('/api/identity/email', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email,
          name: fullName,
          redirectUrl: this.getAuthRedirectUrl()
        })
      })

      if (!response.ok) {
        return {
          success: false,
          error: await this.readErrorMessage(response, 'Failed to send magic link')
        }
      }

      return { success: true, session, user: session.user }
    } catch (error) {
      return { success: false, error: 'Network error occurred' }
    }
  }

  getGoogleSignInUrl(callbackUrl = this.getAuthRedirectUrl()): string {
    const url = new URL(`${this.authBaseUrl}/oauth/google`)
    url.searchParams.set('callbackURL', callbackUrl)
    return url.toString()
  }

  async signInWithGoogle(callbackUrl = this.getAuthRedirectUrl()): Promise<AuthResult> {
    try {
      window.location.assign(this.getGoogleSignInUrl(callbackUrl))
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start Google sign-in'
      }
    }
  }

  async verifyOtp(email: string, token: string): Promise<AuthResult> {
    try {
      const response = await this.fetchResponse('/email-otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          email,
          code: token,
          name: this.getPendingFullName()
        })
      })

      if (!response.ok) {
        return {
          success: false,
          error: await this.readErrorMessage(response, 'Verification failed')
        }
      }

      const session = await this.getSession()

      if (!session) {
        return {
          success: false,
          error: 'Verification succeeded but no session was established'
        }
      }

      this.clearPendingAuthState()

      return {
        success: true,
        session,
        user: session.user
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      }
    }
  }

  async resendOtp(email: string): Promise<AuthResult> {
    return this.signInWithMagicLink(email, this.getPendingFullName())
  }

  async signOut(): Promise<{ success: boolean; error?: string }> {
    const storedSession = this.getStoredSession()

    try {
      if (storedSession?.access_token) {
        await this.fetchResponse('/api/identity/session', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${storedSession.access_token}`
          }
        })
      }
    } catch (error) {
      this.clearSessionMirror()
      this.clearPendingAuthState()

      return {
        success: false,
        error: 'Sign out failed'
      }
    }

    this.clearSessionMirror()
    this.clearPendingAuthState()

    return { success: true }
  }

  async getSession(): Promise<AuthSession | null> {
    const storedSession = this.getStoredSession()

    if (!storedSession?.access_token) {
      return null
    }

    try {
      const response = await this.fetchResponse('/api/identity/session', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${storedSession.access_token}`
        }
      })

      if (!response.ok) {
        this.clearSessionMirror()
        return null
      }

      const payload = (await response.json()) as IdentityApiBody<IdentitySessionBundle>

      if (!payload.ok) {
        this.clearSessionMirror()
        return null
      }

      const session = this.mapIdentityBundle(payload.data)
      this.storeSession(session)

      return session
    } catch (error) {
      return storedSession
    }
  }

  async ensureSession(): Promise<AuthSession> {
    const currentSession = await this.getSession()

    if (currentSession) {
      return currentSession
    }

    return this.createDeviceSession()
  }

  async createDeviceSession(): Promise<AuthSession> {
    const response = await this.fetchResponse('/api/identity/device', {
      method: 'POST',
      body: JSON.stringify({
        appId: this.getCurrentAppId(),
        displayName: this.getDefaultDeviceDisplayName(),
        fingerprint: this.getDeviceFingerprint()
      })
    })

    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response, 'Failed to create device identity'))
    }

    const payload = (await response.json()) as IdentityApiBody<IdentitySessionBundle>

    if (!payload.ok) {
      throw new Error(!payload.ok ? (payload as IdentityApiError).error?.message || 'Failed to create device identity' : 'Failed to create device identity')
    }

    const session = this.mapIdentityBundle(payload.data)
    this.storeSession(session)

    return session
  }

  async handleMagicLinkCallback(): Promise<AuthResult> {
    const token = new URLSearchParams(window.location.search).get('token')

    if (!token) {
      return {
        success: false,
        error: 'No magic-link token found'
      }
    }

    try {
      const response = await this.fetchResponse(`/api/identity/verify-magic-link?token=${encodeURIComponent(token)}`, {
        method: 'GET'
      })

      if (!response.ok) {
        return {
          success: false,
          error: await this.readErrorMessage(response, 'Magic link verification failed')
        }
      }

      const payload = (await response.json()) as IdentityApiBody<IdentitySessionBundle>

      if (!payload.ok) {
        return {
          success: false,
          error: (payload as IdentityApiError).error?.message || 'Magic link verification failed'
        }
      }

      const session = this.mapIdentityBundle(payload.data)
      this.storeSession(session)
      this.clearPendingAuthState()

      return {
        success: true,
        session,
        user: session.user
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred'
      }
    }
  }

  async refreshSession(_refreshToken: string): Promise<AuthResult> {
    const session = await this.getSession()

    if (!session) {
      return {
        success: false,
        error: 'No active session found'
      }
    }

    return {
      success: true,
      session,
      user: session.user
    }
  }

  async updateUser(updates: Partial<AuthUser>): Promise<AuthResult> {
    const metadata: Record<string, any> = {}

    if (typeof updates.full_name === 'string') {
      metadata.name = updates.full_name
    }

    if (typeof updates.avatar_url === 'string') {
      metadata.avatar_url = updates.avatar_url
    }

    if (Object.keys(metadata).length === 0) {
      const session = await this.getSession()

      return session
        ? { success: true, user: session.user, session }
        : { success: false, error: 'Not authenticated' }
    }

    return this.updateUserMetadata(metadata)
  }

  async updateUserMetadata(metadata: Record<string, any>): Promise<AuthResult> {
    try {
      const response = await this.fetchResponse('/user/metadata', {
        method: 'PATCH',
        body: JSON.stringify(metadata)
      })

      if (!response.ok) {
        return {
          success: false,
          error: await this.readErrorMessage(response, 'Update failed')
        }
      }

      const data = (await response.json()) as WorkerUserResponse
      const currentSession = this.getStoredSession()
      const nextSession =
        currentSession && data.user
          ? {
              ...currentSession,
              user: data.user
            }
          : currentSession

      if (nextSession) {
        this.storeSession(nextSession)
      }

      return {
        success: true,
        user: data.user,
        session: nextSession || undefined
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred'
      }
    }
  }

  async getUserRole(): Promise<'user' | 'editor' | 'admin' | null> {
    const session = await this.getSession()
    const role = session?.user.app_metadata?.role

    if (role === 'admin' || role === 'editor' || role === 'user') {
      return role
    }

    return null
  }

  async hasRole(requiredRole: 'editor' | 'admin'): Promise<boolean> {
    const role = await this.getUserRole()

    if (!role) {
      return false
    }

    if (role === 'admin') {
      return true
    }

    return role === requiredRole
  }

  async getCurrentUser(): Promise<AuthResult> {
    try {
      const response = await this.fetchResponse('/user', {
        method: 'GET'
      })

      if (!response.ok) {
        return {
          success: false,
          error: await this.readErrorMessage(response, 'Failed to get user')
        }
      }

      const data = (await response.json()) as WorkerUserResponse
      const currentSession = await this.getSession()
      const nextSession =
        currentSession && data.user
          ? {
              ...currentSession,
              user: data.user
            }
          : currentSession

      if (nextSession) {
        this.storeSession(nextSession)
      }

      return {
        success: true,
        user: data.user,
        session: nextSession || undefined
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred'
      }
    }
  }

  async cleanupDataUrlAvatar(): Promise<AuthResult> {
    const session = await this.getSession()

    if (!session) {
      return {
        success: false,
        error: 'Not authenticated'
      }
    }

    if (!session.user.avatar_url?.startsWith('data:') && !session.user.user_metadata?.avatar_url?.startsWith('data:')) {
      return {
        success: true,
        user: session.user,
        session
      }
    }

    return this.updateUserMetadata({
      avatar_url: ''
    })
  }

  private async fetchResponse(path: string, init: RequestInit): Promise<Response> {
    const headers = new Headers(init.headers || {})

    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json')
    }

    return fetch(`${this.authBaseUrl}${path}`, {
      ...init,
      headers,
      credentials: 'include'
    })
  }

  private async readErrorMessage(response: Response, fallback: string): Promise<string> {
    try {
      const data = await response.json()

      if (typeof data?.error === 'string') {
        return data.error
      }

      if (typeof data?.message === 'string') {
        return data.message
      }
    } catch {
      return fallback
    }

    return fallback
  }

  private mapWorkerSession(payload: WorkerSessionPayload): AuthSession {
    if (!payload.user || !payload.session) {
      throw new Error('Worker session payload is incomplete')
    }

    const expiresAt = Math.floor(new Date(payload.session.expiresAt).getTime() / 1000)

    return {
      access_token: payload.session.token,
      refresh_token: '',
      expires_at: expiresAt,
      expires_in: Math.max(0, expiresAt - Math.floor(Date.now() / 1000)),
      token_type: 'bearer',
      user: payload.user
    }
  }

  mapIdentityBundle(bundle: IdentitySessionBundle): AuthSession {
    const expiresAt = Math.floor(new Date(bundle.session.expiresAt).getTime() / 1000)
    const displayName = bundle.user.displayName || bundle.device.displayName || bundle.user.primaryEmail || 'Tiko user'

    return {
      access_token: bundle.sessionToken,
      refresh_token: '',
      expires_at: expiresAt,
      expires_in: Math.max(0, expiresAt - Math.floor(Date.now() / 1000)),
      token_type: 'bearer',
      identity: bundle,
      user: {
        id: bundle.user.id,
        email: bundle.user.primaryEmail || '',
        full_name: displayName,
        avatar_url: '',
        email_verified: !!bundle.user.primaryEmail,
        phone_verified: false,
        app_metadata: {
          role: 'user'
        },
        user_metadata: {
          name: displayName,
          deviceId: bundle.device.id,
          deviceDisplayName: bundle.device.displayName,
          identityUserId: bundle.user.id
        },
        created_at: bundle.user.createdAt,
        updated_at: bundle.user.updatedAt
      }
    }
  }

  private getStoredSession(): AuthSession | null {
    try {
      const stored = localStorage.getItem(AUTH_SESSION_STORAGE_KEY)

      if (!stored) {
        return null
      }

      const session = JSON.parse(stored) as AuthSession

      if (!session.expires_at || session.expires_at <= Math.floor(Date.now() / 1000)) {
        this.clearSessionMirror()
        return null
      }

      return session
    } catch {
      return null
    }
  }

  private storePendingAuthState(email: string, fullName?: string): void {
    localStorage.setItem(PENDING_EMAIL_KEY, email)

    if (fullName) {
      localStorage.setItem(PENDING_NAME_KEY, fullName)
    } else {
      localStorage.removeItem(PENDING_NAME_KEY)
    }
  }

  private getPendingFullName(): string | undefined {
    const fullName = localStorage.getItem(PENDING_NAME_KEY)

    return fullName || undefined
  }

  private clearPendingAuthState(): void {
    localStorage.removeItem(PENDING_EMAIL_KEY)
    localStorage.removeItem(PENDING_NAME_KEY)
  }

  private getAuthRedirectUrl(): string {
    const siteUrl = import.meta.env?.VITE_SITE_URL || window.location.origin

    return `${siteUrl}/auth/callback`
  }

  private getDefaultDeviceDisplayName(): string {
    const appId = this.getCurrentAppId()
    const platform = navigator.userAgent.includes('Mobile') ? 'mobile device' : 'device'

    return `${appId} ${platform}`
  }

  private getDeviceFingerprint(): string {
    const storageKey = 'tiko_identity_device_fingerprint'
    const existing = localStorage.getItem(storageKey)

    if (existing) {
      return existing
    }

    const fingerprint = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

    localStorage.setItem(storageKey, fingerprint)
    return fingerprint
  }

  private getCurrentAppId(): string {
    return resolveAppIdFromHostname(this.getHostname())
  }

  private storeSession(session: AuthSession): void {
    const cleanSession = {
      ...session,
      user: {
        ...session.user,
        avatar_url: session.user.avatar_url?.startsWith('data:') ? '' : session.user.avatar_url,
        user_metadata: session.user.user_metadata?.avatar_url?.startsWith('data:')
          ? {
              ...session.user.user_metadata,
              avatar_url: ''
            }
          : session.user.user_metadata
      }
    }

    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(cleanSession))
  }

  private clearSessionMirror(): void {
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
    localStorage.removeItem('tiko_auth_session_legacy')
  }
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
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

function normalizeHostedAppId(appId: string): string {
  return HOST_APP_ID_ALIASES[appId] || appId || 'tiko'
}

export { CentralAuthService as ManualAuthService }

export const authService: AuthService = new CentralAuthService()
