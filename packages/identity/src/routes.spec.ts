import { describe, expect, it, vi } from 'vitest'
import { handleIdentityRequest } from './routes'
import type { IdentityEnv } from './types'

function env(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return {
    IDENTITY_ALLOWED_ORIGINS: 'https://tiko.mt,https://*.tikoapps.org,https://development.tiko-*.pages.dev,http://localhost:3000',
    IDENTITY_DB: {
      prepare: vi.fn(() => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(),
        all: vi.fn(),
        run: vi.fn()
      }))
    },
    ...overrides
  } as IdentityEnv
}

describe('identity CORS', () => {
  it('allows configured wildcard dev app origins', async () => {
    const response = await handleIdentityRequest(
      new Request('https://id.tiko.mt/api/identity/session', {
        method: 'OPTIONS',
        headers: { origin: 'https://dev.yesno.tikoapps.org' }
      }),
      env()
    )

    expect(response.headers.get('access-control-allow-origin')).toBe('https://dev.yesno.tikoapps.org')
    expect(response.headers.get('access-control-allow-credentials')).toBe('true')
  })

  it('allows configured Pages development preview origins', async () => {
    const response = await handleIdentityRequest(
      new Request('https://id.tiko.mt/api/identity/session', {
        method: 'OPTIONS',
        headers: { origin: 'https://development.tiko-marketing.pages.dev' }
      }),
      env()
    )

    expect(response.headers.get('access-control-allow-origin')).toBe('https://development.tiko-marketing.pages.dev')
    expect(response.headers.get('access-control-allow-credentials')).toBe('true')
  })

  it('does not reflect origins outside configured wildcard domains', async () => {
    const response = await handleIdentityRequest(
      new Request('https://id.tiko.mt/api/identity/session', {
        method: 'OPTIONS',
        headers: { origin: 'https://evil.example' }
      }),
      env()
    )

    expect(response.headers.get('access-control-allow-origin')).toBe('https://tiko.mt')
  })
})
