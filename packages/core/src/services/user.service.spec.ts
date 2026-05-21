import { beforeEach, describe, expect, it, vi } from 'vitest'

const storage: Record<string, string> = {}

beforeEach(() => {
  for (const key of Object.keys(storage)) delete storage[key]
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => storage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { storage[key] = value }),
    removeItem: vi.fn((key: string) => { delete storage[key] })
  })
})

describe('IdentityUserService', () => {
  it('derives the current user profile from the Tiko identity session', async () => {
    storage.tiko_auth_session = JSON.stringify({
      access_token: 'identity-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'Bearer',
      user: {
        id: 'user-1',
        email: 'sil@tiko.com',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
        user_metadata: { name: 'Sil' },
        app_metadata: {}
      }
    })

    vi.resetModules()
    const { userService } = await import('./user.service')

    await expect(userService.isCurrentUserAdmin()).resolves.toBe(true)
    await expect(userService.getAllUsers()).resolves.toMatchObject([
      {
        id: 'user-1',
        email: 'sil@tiko.com',
        name: 'Sil',
        role: 'admin',
        is_active: true
      }
    ])
  })

  it('returns empty admin lists without requiring legacy backend configuration', async () => {
    vi.resetModules()
    const { userService } = await import('./user.service')

    await expect(userService.getAllUsers()).resolves.toEqual([])
    await expect(userService.getUserStats()).resolves.toEqual({
      totalUsers: 0,
      activeUsers: 0,
      adminUsers: 0,
      newUsersToday: 0,
      newUsersThisMonth: 0
    })
  })
})
