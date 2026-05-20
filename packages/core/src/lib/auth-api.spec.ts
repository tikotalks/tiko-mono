import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthAPI } from './auth-api'

const stored: Record<string, string> = {}

beforeEach(() => {
  vi.restoreAllMocks()
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

describe('AuthAPI identity endpoint client', () => {
  it('bootstraps a device session before requesting magic links from the Tiko identity API', async () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 3600
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        ok: true,
        data: {
          user: { id: 'user_1', primaryEmail: null, createdAt: 'now', updatedAt: 'now', lastSeenAt: null },
          device: { id: 'device_1' },
          session: { id: 'session_1', userId: 'user_1', deviceId: 'device_1', expiresAt: new Date(expiresAt * 1000).toISOString() },
          sessionToken: 'session-token'
        }
      }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, data: { queued: true } }), { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)

    const api = new AuthAPI({ baseUrl: 'https://id.tiko.mt', appId: 'cards' })

    await api.sendMagicLink('caregiver@example.com')

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'https://id.tiko.mt/api/identity/device', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ appId: 'cards' })
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://id.tiko.mt/api/identity/email', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        Authorization: 'Bearer session-token'
      }),
      body: JSON.stringify({ email: 'caregiver@example.com' })
    }))
    expect(stored.tiko_auth_session).toContain('session-token')
    for (const call of fetchMock.mock.calls) {
      expect(call[0]).not.toContain('supabase')
    }
  })

  it('verifies identity magic-link tokens and stores the returned session bundle', async () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 3600
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      ok: true,
      data: {
        user: { id: 'user_2', primaryEmail: 'verified@example.com', createdAt: 'now', updatedAt: 'now', lastSeenAt: null },
        device: { id: 'device_2' },
        session: { id: 'session_2', userId: 'user_2', deviceId: 'device_2', expiresAt: new Date(expiresAt * 1000).toISOString() },
        sessionToken: 'verified-session-token'
      }
    }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const api = new AuthAPI({ baseUrl: 'https://id.tiko.mt' })
    const session = await api.verifyMagicLink('magic-token')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://id.tiko.mt/api/identity/verify-magic-link?token=magic-token',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' })
      })
    )
    expect(session).toMatchObject({
      access_token: 'verified-session-token',
      user: { id: 'user_2', email: 'verified@example.com' }
    })
    expect(JSON.parse(stored.tiko_auth_session).access_token).toBe('verified-session-token')
  })

  it('validates stored sessions against the Tiko identity API with bearer auth', async () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 3600
    stored.tiko_auth_session = JSON.stringify({
      access_token: 'session-token',
      expires_at: expiresAt,
      user: { id: 'user_1', email: 'caregiver@example.com' }
    })
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      ok: true,
      data: {
        user: { id: 'user_1', primaryEmail: 'caregiver@example.com', createdAt: 'now', updatedAt: 'now', lastSeenAt: null },
        device: { id: 'device_1' },
        session: { id: 'session_1', userId: 'user_1', deviceId: 'device_1', expiresAt: new Date(expiresAt * 1000).toISOString() }
      }
    }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const api = new AuthAPI({ baseUrl: 'https://id.tiko.mt' })
    const user = await api.getUser('session-token')

    expect(user).toMatchObject({ id: 'user_1', email: 'caregiver@example.com' })
    expect(fetchMock).toHaveBeenCalledWith('https://id.tiko.mt/api/identity/session', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer session-token' })
    }))
  })
})
