/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ManualAuthService } from '../auth.service'
import type { AuthSession, AuthUser } from '../auth.service'

const mockFetch = vi.fn()

describe('AuthService', () => {
  let authService: ManualAuthService
  let storage: Record<string, string>

  beforeEach(() => {
    authService = new ManualAuthService('https://id.tiko.mt')
    storage = {}
    vi.stubGlobal('fetch', mockFetch)

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => storage[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          storage[key] = value
        }),
        removeItem: vi.fn((key: string) => {
          delete storage[key]
        })
      },
      writable: true
    })

    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('creates a device identity before requesting an account magic link', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ ok: true, data: createIdentityBundle() }, 201))
      .mockResolvedValueOnce(jsonResponse({ ok: true, data: { magicLinkId: 'link-123', queued: true } }, 202))

    const result = await authService.signInWithMagicLink('test@example.com', 'Jane Doe')

    expect(result.success).toBe(true)
    expect(result.session?.access_token).toBe('identity-session-token')
    expect(storage['tiko_pending_auth_email']).toBe('test@example.com')
    expect(storage['tiko_pending_auth_name']).toBe('Jane Doe')
    expect(storage['tiko_auth_session']).toContain('identity-session-token')
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'https://id.tiko.mt/api/identity/device',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include'
      })
    )
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://id.tiko.mt/api/identity/email',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.any(Headers)
      })
    )
  })

  it('verifies a magic-link callback and stores the returned identity session', async () => {
    history.replaceState({}, '', '/auth/callback?token=magic-token')
    storage['tiko_pending_auth_name'] = 'Jane Doe'

    mockFetch.mockResolvedValueOnce(
      jsonResponse({ ok: true, data: createIdentityBundle({ primaryEmail: 'test@example.com' }) })
    )

    const result = await authService.handleMagicLinkCallback()

    expect(result.success).toBe(true)
    expect(result.session?.access_token).toBe('identity-session-token')
    expect(result.user?.email).toBe('test@example.com')
    expect(storage['tiko_pending_auth_email']).toBeUndefined()
    expect(storage['tiko_pending_auth_name']).toBeUndefined()
    expect(storage['tiko_auth_session']).toContain('identity-session-token')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://id.tiko.mt/api/identity/verify-magic-link?token=magic-token',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('builds the shared Google sign-in URL on the identity domain', async () => {
    const url = authService.getGoogleSignInUrl('https://tiko.tikoapps.org/auth/callback')

    expect(url).toBe(
      'https://id.tiko.mt/oauth/google?callbackURL=https%3A%2F%2Ftiko.tikoapps.org%2Fauth%2Fcallback'
    )
  })

  it('returns null when no identity session is cached', async () => {
    const session = await authService.getSession()

    expect(session).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('falls back to the cached session when the identity API is unavailable', async () => {
    const cachedSession = createSession()
    storage['tiko_auth_session'] = JSON.stringify(cachedSession)
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))

    const session = await authService.getSession()

    expect(session).toEqual(cachedSession)
  })

  it('updates cached user metadata after a profile metadata write', async () => {
    const cachedSession = createSession()
    storage['tiko_auth_session'] = JSON.stringify(cachedSession)

    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        user: createUser({
          user_metadata: {
            settings: {
              theme: 'dark'
            }
          }
        })
      })
    )

    const result = await authService.updateUserMetadata({
      settings: {
        theme: 'dark'
      }
    })

    expect(result.success).toBe(true)
    expect(result.user?.user_metadata.settings.theme).toBe('dark')
    expect(storage['tiko_auth_session']).toContain('"theme":"dark"')
  })

  it('clears the mirrored session on sign out', async () => {
    storage['tiko_auth_session'] = JSON.stringify(createSession())
    storage['tiko_auth_session_legacy'] = JSON.stringify(createSession())

    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true, data: { revoked: true } }))

    const result = await authService.signOut()

    expect(result.success).toBe(true)
    expect(storage['tiko_auth_session']).toBeUndefined()
    expect(storage['tiko_auth_session_legacy']).toBeUndefined()
  })
})

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

function createIdentityBundle(overrides: { primaryEmail?: string | null } = {}) {
  return {
    user: {
      id: 'user-123',
      primaryEmail: overrides.primaryEmail ?? null,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      lastSeenAt: '2025-01-01T00:00:00.000Z'
    },
    device: {
      id: 'device-123',
      userId: 'user-123',
      appId: 'local',
      deviceKeyHash: null,
      fingerprintHash: 'fingerprint-hash',
      displayName: 'Kitchen iPad',
      trusted: true,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      lastSeenAt: '2025-01-01T00:00:00.000Z'
    },
    session: {
      id: 'session-123',
      userId: 'user-123',
      deviceId: 'device-123',
      state: 'active',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      expiresAt: '2030-01-01T00:00:00.000Z',
      revokedAt: null,
      lastSeenAt: '2025-01-01T00:00:00.000Z'
    },
    sessionToken: 'identity-session-token'
  }
}

function createUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    avatar_url: '',
    email_verified: true,
    phone_verified: false,
    app_metadata: {
      role: 'user'
    },
    user_metadata: {},
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    ...overrides
  }
}

function createSession(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    access_token: 'session-token',
    refresh_token: '',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: 'bearer',
    user: createUser(),
    ...overrides
  }
}
