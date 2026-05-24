import { BrowserIdentityClient, createBrowserIdentityClient, resolveAppIdFromHostname, type SessionBundle } from '@tiko/identity/client'

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
  identity?: SessionBundle
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
  refreshSession(refreshToken?: string): Promise<AuthResult>
  updateUser(updates: Partial<AuthUser>): Promise<AuthResult>
  updateUserMetadata(metadata: Record<string, any>): Promise<AuthResult>
  getUserRole(): Promise<'user' | 'editor' | 'admin' | null>
  hasRole(requiredRole: 'editor' | 'admin'): Promise<boolean>
  getCurrentUser(): Promise<AuthResult>
  cleanupDataUrlAvatar(): Promise<AuthResult>
}

const DEFAULT_AUTH_BASE_URL = 'https://id.tiko.mt'
const AUTH_SESSION_STORAGE_KEY = 'tiko_auth_session'
const PENDING_EMAIL_KEY = 'tiko_pending_auth_email'
const PENDING_NAME_KEY = 'tiko_pending_auth_name'

export function resolveAuthBaseUrl(): string {
  return DEFAULT_AUTH_BASE_URL
}

export { resolveAppIdFromHostname }

export class CentralAuthService implements AuthService {
  private readonly identityClient: BrowserIdentityClient

  constructor(authBaseUrl = resolveAuthBaseUrl(), getHostname = () => window.location.hostname) {
    this.identityClient = createBrowserIdentityClient({
      baseUrl: authBaseUrl,
      getHostname,
      storage: getLocalStorage(),
      getLocationOrigin: () => window.location.origin,
      getUserAgent: () => navigator.userAgent
    })
  }

  async signInWithEmail(): Promise<AuthResult> {
    return { success: false, error: 'Email/password login is disabled. Use email setup and magic-link verification instead.' }
  }

  async signUpWithEmail(email: string, _password: string, fullName?: string): Promise<AuthResult> {
    return this.signInWithMagicLink(email, fullName)
  }

  async signInWithMagicLink(email: string, fullName?: string): Promise<AuthResult> {
    try {
      this.storePendingAuthState(email, fullName)
      const bundle = await this.identityClient.getOrCreateSession()
      await this.identityClient.startEmailVerification({
        email,
        name: fullName,
        redirectUrl: this.getAuthRedirectUrl()
      }, bundle.sessionToken)
      const session = this.storeIdentitySession(bundle)
      return { success: true, session, user: session.user }
    } catch {
      return { success: false, error: 'Network error occurred' }
    }
  }

  getGoogleSignInUrl(callbackUrl = this.getAuthRedirectUrl()): string {
    const url = new URL(`${resolveAuthBaseUrl()}/oauth/google`)
    url.searchParams.set('callbackURL', callbackUrl)
    return url.toString()
  }

  async signInWithGoogle(): Promise<AuthResult> {
    return { success: false, error: 'OAuth login is disabled. Use device-first identity and magic-link recovery instead.' }
  }

  async verifyOtp(_email: string, token: string): Promise<AuthResult> {
    return this.verifyMagicLinkToken(token)
  }

  async resendOtp(email: string): Promise<AuthResult> {
    return this.signInWithMagicLink(email, this.getPendingFullName())
  }

  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const storedSession = this.getStoredSession()
      await this.identityClient.revokeCurrentDevice(storedSession?.access_token)
      this.clearSessionMirror()
      this.clearPendingAuthState()
      return { success: true }
    } catch {
      this.clearSessionMirror()
      this.clearPendingAuthState()
      return { success: false, error: 'Sign out failed' }
    }
  }

  async getSession(): Promise<AuthSession | null> {
    const storedSession = this.getStoredSession()

    if (!storedSession?.access_token) {
      return null
    }

    try {
      const bundle = await this.identityClient.refreshSession(storedSession.access_token)
      return this.storeIdentitySession(bundle)
    } catch {
      return storedSession
    }
  }

  async ensureSession(): Promise<AuthSession> {
    const currentSession = await this.getSession()
    if (currentSession) return currentSession
    return this.createDeviceSession()
  }

  async createDeviceSession(): Promise<AuthSession> {
    const bundle = await this.identityClient.getOrCreateSession()
    return this.storeIdentitySession(bundle)
  }

  async handleMagicLinkCallback(): Promise<AuthResult> {
    const token = readMagicLinkTokenFromLocation()

    if (!token) {
      return { success: false, error: 'No magic-link token found' }
    }

    return this.verifyMagicLinkToken(token)
  }

  async refreshSession(_refreshToken?: string): Promise<AuthResult> {
    try {
      const currentSession = this.getStoredSession()
      const bundle = await this.identityClient.refreshSession(currentSession?.access_token)
      const session = this.storeIdentitySession(bundle)
      return { success: true, session, user: session.user }
    } catch {
      return { success: false, error: 'No active session found' }
    }
  }

  async updateUser(updates: Partial<AuthUser>): Promise<AuthResult> {
    const metadata: Record<string, any> = { ...updates.user_metadata }
    const displayName = updates.full_name || updates.user_metadata?.name

    return this.updateProfile(displayName, updates.avatar_url, metadata)
  }

  async updateUserMetadata(metadata: Record<string, any>): Promise<AuthResult> {
    return this.updateProfile(metadata.name, metadata.avatar_url, metadata)
  }

  async getUserRole(): Promise<'user' | 'editor' | 'admin' | null> {
    try {
      const session = await this.getSession()
      const role = session?.user.app_metadata?.role
      return role === 'admin' || role === 'editor' || role === 'user' ? role : null
    } catch {
      return null
    }
  }

  async hasRole(requiredRole: 'editor' | 'admin'): Promise<boolean> {
    const role = await this.getUserRole()
    if (!role) return false
    if (role === 'admin') return true
    return role === requiredRole
  }

  async getCurrentUser(): Promise<AuthResult> {
    const session = await this.getSession()
    return session ? { success: true, user: session.user, session } : { success: false, error: 'Not authenticated' }
  }

  async cleanupDataUrlAvatar(): Promise<AuthResult> {
    const session = await this.getSession()

    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!session.user.avatar_url?.startsWith('data:') && !session.user.user_metadata?.avatar_url?.startsWith('data:')) {
      return { success: true, user: session.user, session }
    }

    return this.updateUserMetadata({ avatar_url: '' })
  }

  mapIdentityBundle(bundle: SessionBundle): AuthSession {
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
        email_verified: Boolean(bundle.user.primaryEmail),
        phone_verified: false,
        app_metadata: { role: 'user' },
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

  private async verifyMagicLinkToken(token: string): Promise<AuthResult> {
    try {
      const bundle = await this.identityClient.verifyMagicLink(token)
      const session = this.storeIdentitySession(bundle)
      this.clearPendingAuthState()
      stripMagicLinkTokenFromLocation()
      return { success: true, session, user: session.user }
    } catch {
      return { success: false, error: 'Network error occurred' }
    }
  }

  private async updateProfile(displayName?: string | null, avatarUrl?: string | null, metadata: Record<string, any> = {}): Promise<AuthResult> {
    try {
      const currentSession = await this.ensureSession()
      const result = await this.identityClient.updateProfile({ displayName, avatarUrl, metadata }, currentSession.access_token)
      const session = result.session ? this.storeIdentitySession(result.session) : await this.getSession()
      return session ? { success: true, user: session.user, session } : { success: false, error: 'Not authenticated' }
    } catch {
      return { success: false, error: 'Network error occurred' }
    }
  }

  private getStoredSession(): AuthSession | null {
    try {
      const stored = localStorage.getItem(AUTH_SESSION_STORAGE_KEY)
      if (!stored) return null

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

  private storeIdentitySession(bundle: SessionBundle): AuthSession {
    const session = this.mapIdentityBundle(bundle)
    this.storeSession(session)
    return session
  }

  private storeSession(session: AuthSession): void {
    const cleanSession = {
      ...session,
      user: {
        ...session.user,
        avatar_url: session.user.avatar_url?.startsWith('data:') ? '' : session.user.avatar_url,
        user_metadata: session.user.user_metadata?.avatar_url?.startsWith('data:')
          ? { ...session.user.user_metadata, avatar_url: '' }
          : session.user.user_metadata
      }
    }

    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(cleanSession))
  }

  private clearSessionMirror(): void {
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
    localStorage.removeItem('tiko_auth_session_legacy')
    this.identityClient.clearStoredSession()
  }

  private storePendingAuthState(email: string, fullName?: string): void {
    localStorage.setItem(PENDING_EMAIL_KEY, email)
    if (fullName) localStorage.setItem(PENDING_NAME_KEY, fullName)
    else localStorage.removeItem(PENDING_NAME_KEY)
  }

  private getPendingFullName(): string | undefined {
    return localStorage.getItem(PENDING_NAME_KEY) || undefined
  }

  private clearPendingAuthState(): void {
    localStorage.removeItem(PENDING_EMAIL_KEY)
    localStorage.removeItem(PENDING_NAME_KEY)
  }

  private getAuthRedirectUrl(): string {
    return `${window.location.origin}/auth/callback`
  }
}

function readMagicLinkTokenFromLocation(): string | null {
  const searchToken = new URLSearchParams(window.location.search).get('token')
  if (searchToken) return searchToken

  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
  return new URLSearchParams(hash).get('token')
}

function stripMagicLinkTokenFromLocation(): void {
  if (!window.history?.replaceState) return
  const url = new URL(window.location.href)
  url.searchParams.delete('token')

  if (url.hash) {
    const hash = new URLSearchParams(url.hash.slice(1))
    hash.delete('token')
    url.hash = hash.toString() ? `#${hash.toString()}` : ''
  }

  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`)
}

function getLocalStorage(): Storage | undefined {
  try {
    return localStorage
  } catch {
    return undefined
  }
}

export { CentralAuthService as ManualAuthService }
export const authService: AuthService = new CentralAuthService()
