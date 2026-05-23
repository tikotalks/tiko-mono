import { beforeEach, describe, expect, it, vi } from 'vitest'

const storage: Record<string, string> = {}

beforeEach(() => {
  for (const key of Object.keys(storage)) delete storage[key]
  vi.unstubAllGlobals()
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => storage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { storage[key] = value }),
    removeItem: vi.fn((key: string) => { delete storage[key] })
  })
})

describe('IdentityUserService', () => {
  it('derives the current user profile from the Tiko identity session without granting admin fallback', async () => {
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

    await expect(userService.getAllUsers()).resolves.toMatchObject([
      {
        id: 'user-1',
        email: 'sil@tiko.com',
        name: 'Sil',
        role: 'user',
        is_active: true
      }
    ])
  })

  it('only reports admin when the auth API confirms the admin role', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      user: { app_metadata: { role: 'admin' } }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    vi.resetModules()
    const { userService } = await import('./user.service')

    await expect(userService.isCurrentUserAdmin()).resolves.toBe(true)
  })

  it('fails closed when the auth API rejects or cannot be reached even if a local session exists', async () => {
    storage.tiko_auth_session = JSON.stringify({
      user: {
        id: 'user-1',
        email: 'sil@tiko.com',
        app_metadata: { role: 'admin' }
      }
    })
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: false }), { status: 503 })))

    vi.resetModules()
    const { userService } = await import('./user.service')

    await expect(userService.isCurrentUserAdmin()).resolves.toBe(false)

    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down') }))
    await expect(userService.isCurrentUserAdmin()).resolves.toBe(false)
  })

  it('returns empty admin lists without requiring Supabase configuration', async () => {
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
