import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { authService } = vi.hoisted(() => ({
  authService: {
    signInWithMagicLink: vi.fn(),
    getSession: vi.fn(),
    signOut: vi.fn()
  }
}))

vi.mock('../services/auth.service', () => ({
  authService
}))

const stored: Record<string, string> = {}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  for (const key of Object.keys(stored)) delete stored[key]

  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => stored[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      stored[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete stored[key]
    })
  })
})

describe('useAuthStoreNew', () => {
  it('stores pending email after requesting an identity magic link', async () => {
    authService.signInWithMagicLink.mockResolvedValue({ success: true })
    const { useAuthStoreNew } = await import('./auth-new')
    const store = useAuthStoreNew()

    await store.sendMagicLink('caregiver@example.com')

    expect(authService.signInWithMagicLink).toHaveBeenCalledWith('caregiver@example.com')
    expect(stored.tiko_pending_auth_email).toBe('caregiver@example.com')
  })

  it('hydrates auth state from the identity-backed auth service session', async () => {
    const session = {
      access_token: 'verified-session-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'Bearer',
      user: {
        id: 'user_2',
        email: 'verified@example.com',
        created_at: 'now',
        updated_at: 'now'
      }
    }
    authService.getSession.mockResolvedValue(session)
    const { useAuthStoreNew } = await import('./auth-new')
    const store = useAuthStoreNew()

    const result = await store.checkSession()

    expect(authService.getSession).toHaveBeenCalled()
    expect(result).toBe(true)
    expect(store.session).toEqual(session)
    expect(store.user).toEqual(session.user)
    expect(store.isAuthenticated).toBe(true)
  })
})
