import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const authServiceMock = vi.hoisted(() => ({
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  signInWithMagicLink: vi.fn(),
  verifyOtp: vi.fn(),
  resendOtp: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  updateUserMetadata: vi.fn(),
  getUserRole: vi.fn(),
  handleMagicLinkCallback: vi.fn(),
  cleanupDataUrlAvatar: vi.fn(),
  getCurrentUser: vi.fn()
}))

const authSyncServiceMock = vi.hoisted(() => ({
  syncSession: vi.fn(),
  clearSession: vi.fn(),
  hasValidSession: vi.fn()
}))

vi.mock('../services', () => ({
  authService: authServiceMock
}))

vi.mock('../services/auth-sync.service', () => ({
  authSyncService: authSyncServiceMock
}))

import { useAuthStore } from './auth'

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  email_verified: true,
  phone_verified: false,
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z'
}

const mockSession = {
  access_token: 'tiko-access-token',
  refresh_token: 'tiko-refresh-token',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser
}

describe('AuthStore legacy backend removal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.stubEnv('VITE_AUTH_BASE_URL', 'https://legacy-backend.invalid')

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      },
      configurable: true
    })
  })

  it('syncs successful email sign-in sessions without legacy backend APIs', async () => {
    authServiceMock.signInWithEmail.mockResolvedValue({
      success: true,
      user: mockUser,
      session: mockSession
    })
    authServiceMock.getUserRole.mockResolvedValue('user')

    const store = useAuthStore()

    await store.signInWithEmail('test@example.com', 'unused-password')

    expect(store.session).toEqual(mockSession)
    expect(authSyncServiceMock.syncSession).toHaveBeenCalledWith(mockSession)
  })

  it('clears app auth state during logout without legacy backend APIs', async () => {
    authServiceMock.signOut.mockResolvedValue({ success: true })

    const store = useAuthStore()

    await store.logout()

    expect(authServiceMock.signOut).toHaveBeenCalledOnce()
    expect(authSyncServiceMock.clearSession).toHaveBeenCalledOnce()
  })
})
