/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authService } from './auth.service'

// Mock window.location
const mockLocation = {
  hash: '',
  pathname: '/',
  search: '',
  href: 'http://localhost:3000/'
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

// Mock window.history
const mockHistory = {
  replaceState: vi.fn()
}

Object.defineProperty(window, 'history', {
  value: mockHistory,
  writable: true
})

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

describe('AuthService - Magic Link Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.hash = ''
    mockLocation.pathname = '/'
    mockLocation.search = ''
  })

  describe('handleMagicLinkCallback', () => {
    it('should successfully process valid magic link tokens', async () => {
      // Create a mock JWT token
      const mockUser = {
        sub: 'user-123',
        email: 'test@example.com',
        email_verified: true,
        user_metadata: {
          full_name: 'Test User',
          settings: { theme: 'dark', language: 'en-GB' }
        }
      }
      
      // Create a base64 encoded JWT payload
      const mockJwtPayload = btoa(JSON.stringify(mockUser))
      const mockAccessToken = `header.${mockJwtPayload}.signature`
      const mockRefreshToken = 'mock-refresh-token'
      
      // Set up the URL hash with magic link tokens
      mockLocation.hash = `#access_token=${mockAccessToken}&refresh_token=${mockRefreshToken}&expires_in=3600&type=magiclink`

      // Call the method
      const result = await authService.handleMagicLinkCallback()

      // Verify the result
      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.id).toBe('user-123')
      expect(result.user?.email).toBe('test@example.com')
      expect(result.session).toBeDefined()
      expect(result.session?.access_token).toBe(mockAccessToken)
      expect(result.session?.refresh_token).toBe(mockRefreshToken)

      // Verify session was stored
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tiko_auth_session',
        expect.stringContaining(mockAccessToken)
      )

      // Verify URL hash was cleared
      expect(mockHistory.replaceState).toHaveBeenCalledWith(null, '', '/')
    })

    it('should fail when no tokens are present in URL', async () => {
      mockLocation.hash = ''

      const result = await authService.handleMagicLinkCallback()

      expect(result.success).toBe(false)
      expect(result.error).toBe('No tokens found in URL')
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })

    it('should fail when only access token is present', async () => {
      mockLocation.hash = '#access_token=mock-token'

      const result = await authService.handleMagicLinkCallback()

      expect(result.success).toBe(false)
      expect(result.error).toBe('No tokens found in URL')
    })

    it('should fail when only refresh token is present', async () => {
      mockLocation.hash = '#refresh_token=mock-token'

      const result = await authService.handleMagicLinkCallback()

      expect(result.success).toBe(false)
      expect(result.error).toBe('No tokens found in URL')
    })

    it('should handle invalid JWT token gracefully', async () => {
      mockLocation.hash = '#access_token=invalid-jwt&refresh_token=mock-refresh'

      const result = await authService.handleMagicLinkCallback()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to process magic link')
    })

    it('should extract user metadata correctly', async () => {
      const mockUser = {
        sub: 'user-456',
        email: 'another@example.com',
        user_metadata: {
          full_name: 'Another User',
          avatar_url: 'https://example.com/avatar.jpg',
          settings: { language: 'nl-NL' }
        }
      }
      
      const mockJwtPayload = btoa(JSON.stringify(mockUser))
      const mockAccessToken = `header.${mockJwtPayload}.signature`
      
      mockLocation.hash = `#access_token=${mockAccessToken}&refresh_token=refresh&expires_in=7200`

      const result = await authService.handleMagicLinkCallback()

      expect(result.success).toBe(true)
      expect(result.user?.full_name).toBe('Another User')
      expect(result.user?.avatar_url).toBe('https://example.com/avatar.jpg')
      expect(result.user?.user_metadata?.settings?.language).toBe('nl-NL')
    })

    it('should handle custom expires_in value', async () => {
      const mockUser = { sub: 'user-789', email: 'test@example.com' }
      const mockJwtPayload = btoa(JSON.stringify(mockUser))
      const mockAccessToken = `header.${mockJwtPayload}.signature`
      
      mockLocation.hash = `#access_token=${mockAccessToken}&refresh_token=refresh&expires_in=7200`

      const result = await authService.handleMagicLinkCallback()

      expect(result.success).toBe(true)
      expect(result.session?.expires_in).toBe(7200)
      expect(result.session?.expires_at).toBeGreaterThan(Date.now() / 1000)
    })

    it('should default to 3600 seconds when expires_in is not provided', async () => {
      const mockUser = { sub: 'user-999', email: 'test@example.com' }
      const mockJwtPayload = btoa(JSON.stringify(mockUser))
      const mockAccessToken = `header.${mockJwtPayload}.signature`
      
      mockLocation.hash = `#access_token=${mockAccessToken}&refresh_token=refresh`

      const result = await authService.handleMagicLinkCallback()

      expect(result.success).toBe(true)
      expect(result.session?.expires_in).toBe(3600)
    })

    it('should store session in both tiko and supabase formats', async () => {
      const mockUser = { sub: 'user-111', email: 'test@example.com' }
      const mockJwtPayload = btoa(JSON.stringify(mockUser))
      const mockAccessToken = `header.${mockJwtPayload}.signature`
      
      mockLocation.hash = `#access_token=${mockAccessToken}&refresh_token=refresh&expires_in=3600`

      await authService.handleMagicLinkCallback()

      // Should store in both formats for compatibility
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tiko_auth_session',
        expect.any(String)
      )
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'supabase.auth.token',
        expect.any(String)
      )
    })
  })
})