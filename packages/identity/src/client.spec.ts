import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BrowserIdentityClient, resolveAppIdFromHostname } from './client'
import type { SessionBundle } from './types'

const mockFetch = vi.fn()
const stored: Record<string, string> = {}

const anonymousBundle = makeBundle({ primaryEmail: null, displayName: null, sessionToken: 'anonymous-token' })
const verifiedBundle = makeBundle({ primaryEmail: 'caregiver@example.com', displayName: 'Caregiver', sessionToken: 'verified-token' })

function createClient(now = Date.parse('2026-01-01T00:00:00.000Z')) {
  return new BrowserIdentityClient({
    baseUrl: 'https://id.tiko.mt',
    fetch: mockFetch as unknown as typeof fetch,
    storage: {
      getItem: vi.fn((key: string) => stored[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        stored[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete stored[key]
      })
    },
    getHostname: () => 'dev.yesno.tikoapps.org',
    getLocationOrigin: () => 'https://dev.yesno.tikoapps.org',
    getUserAgent: () => 'Mozilla/5.0 Mobile',
    getRandomId: () => 'device-fingerprint',
    now: () => now
  })
}

describe('BrowserIdentityClient', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    for (const key of Object.keys(stored)) delete stored[key]
  })

  it('creates and stores a device user/session without requiring email or password', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true, data: anonymousBundle }, 201))
    const client = createClient()

    const session = await client.getOrCreateSession()

    expect(mockFetch).toHaveBeenCalledWith(
      'https://id.tiko.mt/api/identity/device',
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    )
    expect(JSON.parse(mockFetch.mock.calls[0][1].body as string)).toMatchObject({
      appId: 'yes-no',
      displayName: 'yes-no mobile device',
      fingerprint: { deviceKey: 'device-fingerprint' }
    })
    expect(session.user.primaryEmail).toBeNull()
    expect(session.sessionToken).toBe('anonymous-token')
    expect(JSON.parse(stored.tiko_identity_session).sessionToken).toBe('anonymous-token')
  })

  it('starts optional email setup with the current device bearer session', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ ok: true, data: anonymousBundle }, 201))
      .mockResolvedValueOnce(jsonResponse({ ok: true, data: { magicLinkId: 'ml_1', expiresAt: '2030-01-01T00:00:00.000Z', queued: true } }, 202))
    const client = createClient()

    const result = await client.startEmailVerification({ email: 'caregiver@example.com', name: 'Caregiver' })

    expect(result.magicLinkId).toBe('ml_1')
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://id.tiko.mt/api/identity/email',
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    )
    const headers = mockFetch.mock.calls[1][1].headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer anonymous-token')
    expect(JSON.parse(mockFetch.mock.calls[1][1].body as string)).toMatchObject({
      email: 'caregiver@example.com',
      name: 'Caregiver',
      redirectUrl: 'https://dev.yesno.tikoapps.org/auth/callback'
    })
  })

  it('creates a fresh device session instead of reusing an expired stored session', async () => {
    stored.tiko_identity_session = JSON.stringify(makeBundle({ primaryEmail: null, displayName: null, sessionToken: 'expired-token', expiresAt: '2020-01-01T00:00:00.000Z' }))
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true, data: anonymousBundle }, 201))
    const client = createClient()

    const session = await client.getOrCreateSession()

    expect(session.sessionToken).toBe('anonymous-token')
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch.mock.calls[0][0]).toBe('https://id.tiko.mt/api/identity/device')
  })

  it('falls back to the cached active session when a refresh hits a network failure', async () => {
    stored.tiko_identity_session = JSON.stringify(anonymousBundle)
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const client = createClient()

    const session = await client.getOrCreateSession()

    expect(session.sessionToken).toBe('anonymous-token')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://id.tiko.mt/api/identity/session',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('verifies magic links and stores the returned recoverable session', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true, data: verifiedBundle }))
    const client = createClient()

    const session = await client.verifyMagicLink('magic-token')

    expect(session.user.primaryEmail).toBe('caregiver@example.com')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://id.tiko.mt/api/identity/verify-magic-link?token=magic-token',
      expect.objectContaining({ method: 'GET' })
    )
    expect(JSON.parse(stored.tiko_identity_session).sessionToken).toBe('verified-token')
  })

  it('derives app ids from dev and production custom app domains', () => {
    expect(resolveAppIdFromHostname('dev.yesno.tikoapps.org')).toBe('yes-no')
    expect(resolveAppIdFromHostname('yesno.tikoapps.org')).toBe('yes-no')
    expect(resolveAppIdFromHostname('radio.tikoapps.org')).toBe('radio')
    expect(resolveAppIdFromHostname('localhost')).toBe('local')
  })
})

function makeBundle(overrides: { primaryEmail: string | null; displayName: string | null; sessionToken: string; expiresAt?: string }): SessionBundle {
  return {
    user: {
      id: 'user-123',
      primaryEmail: overrides.primaryEmail,
      displayName: overrides.displayName,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
      lastSeenAt: '2025-01-03T00:00:00.000Z'
    },
    device: {
      id: 'device-123',
      userId: 'user-123',
      appId: 'yes-no',
      deviceKeyHash: null,
      fingerprintHash: 'fingerprint-hash',
      displayName: 'Kitchen iPad',
      trusted: true,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
      lastSeenAt: '2025-01-03T00:00:00.000Z'
    },
    session: {
      id: 'session-123',
      userId: 'user-123',
      deviceId: 'device-123',
      state: 'active',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
      expiresAt: overrides.expiresAt || '2030-01-01T00:00:00.000Z',
      revokedAt: null,
      lastSeenAt: '2025-01-03T00:00:00.000Z'
    },
    sessionToken: overrides.sessionToken
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
