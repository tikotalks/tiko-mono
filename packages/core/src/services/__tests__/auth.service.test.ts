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
    authService = new ManualAuthService('https://auth.tikoapps.org')
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

  it('sends an OTP request through the central auth worker', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    )

    const result = await authService.signInWithMagicLink('test@example.com', 'Jane Doe')

    expect(result).toEqual({ success: true })
    expect(storage['tiko_pending_auth_email']).toBe('test@example.com')
    expect(storage['tiko_pending_auth_name']).toBe('Jane Doe')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://auth.tikoapps.org/email-otp/send',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include'
      })
    )
  })

  it('verifies an OTP and resolves the shared session', async () => {
    storage['tiko_pending_auth_name'] = 'Jane Doe'

    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            authenticated: true,
            user: createUser({
              full_name: 'Jane Doe'
            }),
            session: {
              id: 'session-123',
              token: 'session-token',
              expiresAt: '2030-01-01T00:00:00.000Z'
            }
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      )

    const result = await authService.verifyOtp('test@example.com', '123456')

    expect(result.success).toBe(true)
    expect(result.session?.access_token).toBe('session-token')
    expect(result.user?.full_name).toBe('Jane Doe')
    expect(storage['tiko_pending_auth_email']).toBeUndefined()
    expect(storage['tiko_pending_auth_name']).toBeUndefined()
    expect(storage['tiko_auth_session']).toContain('session-token')
    expect(storage['supabase.auth.token']).toBeUndefined()
  })

  it('builds the shared Google sign-in URL on the auth domain', async () => {
    const url = authService.getGoogleSignInUrl('https://tiko.tikoapps.org/auth/callback')

    expect(url).toBe(
      'https://auth.tikoapps.org/oauth/google?callbackURL=https%3A%2F%2Ftiko.tikoapps.org%2Fauth%2Fcallback'
    )
  })

  it('returns null when the central auth worker reports no session', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          authenticated: false,
          user: null,
          session: null
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    )

    const session = await authService.getSession()

    expect(session).toBeNull()
  })

  it('falls back to the cached session when the auth worker is unavailable', async () => {
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
      new Response(
        JSON.stringify({
          success: true,
          user: createUser({
            user_metadata: {
              settings: {
                theme: 'dark'
              }
            }
          })
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
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

  it('clears only the Tiko session on sign out and leaves legacy Supabase storage unmanaged', async () => {
    storage['tiko_auth_session'] = JSON.stringify(createSession())
    storage['supabase.auth.token'] = JSON.stringify(createSession())

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    )

    const result = await authService.signOut()

    expect(result.success).toBe(true)
    expect(storage['tiko_auth_session']).toBeUndefined()
    expect(storage['supabase.auth.token']).toContain('session-token')
  })
})

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
