/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionBundle } from '@tiko/identity'
import { CentralAuthService, resolveAppIdFromHostname } from './auth.service'

const mockFetch = vi.fn()

const identityBundle: SessionBundle = {
  user: {
    id: 'user-123',
    primaryEmail: 'test@example.com',
    displayName: 'Kitchen iPad',
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
    expiresAt: '2030-01-01T00:00:00.000Z',
    revokedAt: null,
    lastSeenAt: '2025-01-03T00:00:00.000Z'
  },
  sessionToken: 'identity-session-token'
}

describe('CentralAuthService device-first identity flow', () => {
  let service: CentralAuthService

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    localStorage.clear()
    history.replaceState({}, '', '/')
    service = new CentralAuthService('https://id.tiko.mt')
  })

  it('creates and stores a device session when no local session exists', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true, data: identityBundle }, 201))

    const session = await service.ensureSession()

    expect(mockFetch).toHaveBeenCalledWith(
      'https://id.tiko.mt/api/identity/device',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include'
      })
    )
    expect(session.access_token).toBe('identity-session-token')
    expect(session.user.id).toBe('user-123')
    expect(session.user.email).toBe('test@example.com')
    expect(session.user.full_name).toBe('Kitchen iPad')
    expect(session.user.user_metadata.name).toBe('Kitchen iPad')
    expect(JSON.parse(localStorage.getItem('tiko_auth_session') || '{}').access_token).toBe('identity-session-token')
  })

  it('derives per-app ids for dev custom domains instead of using the dev prefix', async () => {
    expect(resolveAppIdFromHostname('dev.yesno.tikoapps.org')).toBe('yes-no')
    expect(resolveAppIdFromHostname('dev.radio.tikoapps.org')).toBe('radio')
    expect(resolveAppIdFromHostname('yesno.tikoapps.org')).toBe('yes-no')
    expect(resolveAppIdFromHostname('localhost')).toBe('local')
  })

  it('sends the app slug, not the dev environment prefix, when bootstrapping identity on dev domains', async () => {
    service = new CentralAuthService('https://id.tiko.mt', () => 'dev.yesno.tikoapps.org')
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true, data: identityBundle }, 201))

    await service.ensureSession()

    expect(JSON.parse(mockFetch.mock.calls[0][1].body as string)).toMatchObject({
      appId: 'yes-no'
    })
  })

  it('validates a stored identity session with the bearer token', async () => {
    localStorage.setItem('tiko_auth_session', JSON.stringify(service.mapIdentityBundle(identityBundle)))
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true, data: identityBundle }))

    const session = await service.getSession()

    expect(mockFetch).toHaveBeenCalledWith(
      'https://id.tiko.mt/api/identity/session',
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Headers)
      })
    )
    const headers = mockFetch.mock.calls[0][1].headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer identity-session-token')
    expect(session?.access_token).toBe('identity-session-token')
  })

  it('sends account magic links through the identity email endpoint with the current bearer session', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ ok: true, data: identityBundle }, 201))
      .mockResolvedValueOnce(jsonResponse({ ok: true, data: { magicLinkId: 'link-123', expiresAt: '2030-01-01T00:00:00.000Z', queued: true } }, 202))

    const result = await service.signInWithMagicLink('switch@example.com')

    expect(result.success).toBe(true)
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://id.tiko.mt/api/identity/email',
      expect.objectContaining({ method: 'POST' })
    )
    const headers = mockFetch.mock.calls[1][1].headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer identity-session-token')
    expect(JSON.parse(mockFetch.mock.calls[1][1].body as string)).toMatchObject({
      email: 'switch@example.com',
      redirectUrl: `${window.location.origin}/auth/callback`
    })
  })

  it('consumes a magic-link token from the callback URL and stores the returned identity session', async () => {
    history.replaceState({}, '', '/auth/callback?token=magic-token')
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true, data: identityBundle }))

    const result = await service.handleMagicLinkCallback()

    expect(result.success).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://id.tiko.mt/api/identity/verify-magic-link?token=magic-token',
      expect.objectContaining({ method: 'GET' })
    )
    expect(result.session?.access_token).toBe('identity-session-token')
    expect(JSON.parse(localStorage.getItem('tiko_auth_session') || '{}').access_token).toBe('identity-session-token')
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
