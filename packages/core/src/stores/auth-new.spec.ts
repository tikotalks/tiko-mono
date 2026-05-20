import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStoreNew } from './auth-new'

const { authAPI } = vi.hoisted(() => ({
  authAPI: {
    sendMagicLink: vi.fn(),
    verifyMagicLink: vi.fn(),
    getStoredSession: vi.fn(),
    getUser: vi.fn(),
    clearSession: vi.fn()
  }
}))

vi.mock('../lib/auth-api', () => ({
  authAPI
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
    authAPI.sendMagicLink.mockResolvedValue(undefined)
    const store = useAuthStoreNew()

    await store.sendMagicLink('caregiver@example.com')

    expect(authAPI.sendMagicLink).toHaveBeenCalledWith('caregiver@example.com')
    expect(stored.tiko_pending_auth_email).toBe('caregiver@example.com')
  })

  it('verifies identity magic-link callback tokens and updates auth state', async () => {
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
    authAPI.verifyMagicLink.mockResolvedValue(session)
    const store = useAuthStoreNew()

    const result = await store.verifyMagicLink('magic-token')

    expect(authAPI.verifyMagicLink).toHaveBeenCalledWith('magic-token')
    expect(result).toBe(true)
    expect(store.session).toEqual(session)
    expect(store.user).toEqual(session.user)
    expect(store.isAuthenticated).toBe(true)
    expect(stored.tiko_pending_auth_email).toBeUndefined()
  })
})
