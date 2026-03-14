/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authService } from './auth.service'

const mockFetch = vi.fn()

describe('authService.handleMagicLinkCallback', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
  })

  it('returns the current worker-backed session when one exists', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          authenticated: true,
          user: {
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
            updated_at: '2025-01-01T00:00:00.000Z'
          },
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

    const result = await authService.handleMagicLinkCallback()

    expect(result.success).toBe(true)
    expect(result.session?.access_token).toBe('session-token')
  })

  it('returns a friendly error when no current session exists', async () => {
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

    const result = await authService.handleMagicLinkCallback()

    expect(result.success).toBe(false)
    expect(result.error).toBe('No authenticated session found')
  })
})
