/**
 * Authentication Service Tests
 * 
 * @module services/__tests__/auth.service.test
 * @description
 * Comprehensive test suite for the authentication service.
 * Tests all authentication flows including sign in, sign up, magic links, and session management.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ManualAuthService } from '../auth.service'
import type { AuthService, AuthResult, AuthSession, AuthUser } from '../auth.service'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock crypto.subtle.digest for JWT decoding
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn()
    }
  },
  writable: true
})

describe('AuthService', () => {
  let authService: AuthService
  let mockLocalStorage: Record<string, string>

  beforeEach(() => {
    authService = new ManualAuthService()
    mockLocalStorage = {}
    
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn((key) => mockLocalStorage[key] || null),
      setItem: vi.fn((key, value) => { mockLocalStorage[key] = value }),
      removeItem: vi.fn((key) => { delete mockLocalStorage[key] }),
      clear: vi.fn(() => { mockLocalStorage = {} }),
      length: 0,
      key: vi.fn()
    } as any

    // Reset fetch mock
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('signInWithEmail', () => {
    it('should sign in successfully with valid credentials', async () => {
      const mockResponse = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          email_verified: true
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await authService.signInWithEmail('test@example.com', 'password123')

      expect(result.success).toBe(true)
      expect(result.session).toBeDefined()
      expect(result.user?.email).toBe('test@example.com')
      expect(mockLocalStorage['tiko_auth_session']).toBeDefined()
    })

    it('should handle invalid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error_description: 'Invalid login credentials'
        })
      })

      const result = await authService.signInWithEmail('test@example.com', 'wrong-password')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid login credentials')
      expect(result.session).toBeUndefined()
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await authService.signInWithEmail('test@example.com', 'password123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error occurred')
    })
  })

  describe('signUpWithEmail', () => {
    it('should sign up successfully', async () => {
      const mockResponse = {
        user: {
          id: 'user-123',
          email: 'new@example.com',
          email_verified: false
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await authService.signUpWithEmail('new@example.com', 'password123', 'John Doe')

      expect(result.success).toBe(true)
      expect(result.user?.email).toBe('new@example.com')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/signup'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'new@example.com',
            password: 'password123',
            data: { full_name: 'John Doe' }
          })
        })
      )
    })

    it('should handle duplicate email error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          msg: 'User already registered'
        })
      })

      const result = await authService.signUpWithEmail('existing@example.com', 'password123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('User already registered')
    })
  })

  describe('signInWithMagicLink', () => {
    it('should send magic link successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      })

      const result = await authService.signInWithMagicLink('test@example.com')

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/otp'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            create_user: true,
            data: undefined
          })
        })
      )
    })

    it('should include full name for new users', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      })

      await authService.signInWithMagicLink('test@example.com', 'Jane Doe')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            email: 'test@example.com',
            create_user: true,
            data: { full_name: 'Jane Doe' }
          })
        })
      )
    })
  })

  describe('verifyOtp', () => {
    it('should verify OTP successfully', async () => {
      const mockResponse = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        user: {
          id: 'user-123',
          email: 'test@example.com'
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await authService.verifyOtp('test@example.com', '123456')

      expect(result.success).toBe(true)
      expect(result.session).toBeDefined()
      expect(mockLocalStorage['tiko_auth_session']).toBeDefined()
    })

    it('should handle invalid OTP', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error_description: 'Invalid OTP'
        })
      })

      const result = await authService.verifyOtp('test@example.com', '000000')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid OTP')
    })
  })

  describe('getSession', () => {
    it('should return stored session if valid', async () => {
      const mockSession: AuthSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          email_verified: true,
          phone_verified: false,
          app_metadata: {},
          user_metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }

      mockLocalStorage['tiko_auth_session'] = JSON.stringify(mockSession)

      const session = await authService.getSession()

      expect(session).toEqual(mockSession)
    })

    it('should return null if no session stored', async () => {
      const session = await authService.getSession()
      expect(session).toBeNull()
    })

    it('should refresh expired session if refresh token available', async () => {
      const expiredSession: AuthSession = {
        access_token: 'old-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) - 100, // Expired
        expires_in: 3600,
        token_type: 'bearer',
        user: {} as AuthUser
      }

      mockLocalStorage['tiko_auth_session'] = JSON.stringify(expiredSession)

      const newSession = {
        access_token: 'new-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        user: { id: 'user-123', email: 'test@example.com' }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newSession
      })

      const session = await authService.getSession()

      expect(session?.access_token).toBe('new-token')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('refresh_token'),
        expect.any(Object)
      )
    })

    it('should return null if refresh fails', async () => {
      const expiredSession: AuthSession = {
        access_token: 'old-token',
        refresh_token: 'invalid-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) - 100,
        expires_in: 3600,
        token_type: 'bearer',
        user: {} as AuthUser
      }

      mockLocalStorage['tiko_auth_session'] = JSON.stringify(expiredSession)

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid refresh token' })
      })

      const session = await authService.getSession()

      expect(session).toBeNull()
      expect(mockLocalStorage['tiko_auth_session']).toBeUndefined()
    })
  })

  describe('signOut', () => {
    it('should clear all auth data', async () => {
      mockLocalStorage['tiko_auth_session'] = 'session-data'
      mockLocalStorage['supabase.auth.token'] = 'token-data'
      mockLocalStorage['tiko_pending_auth_email'] = 'email@example.com'

      const result = await authService.signOut()

      expect(result.success).toBe(true)
      expect(mockLocalStorage['tiko_auth_session']).toBeUndefined()
      expect(mockLocalStorage['supabase.auth.token']).toBeUndefined()
      expect(mockLocalStorage['tiko_pending_auth_email']).toBeUndefined()
    })
  })

  describe('updateUser', () => {
    it('should update user profile successfully', async () => {
      const mockSession: AuthSession = {
        access_token: 'mock-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: {} as AuthUser
      }

      mockLocalStorage['tiko_auth_session'] = JSON.stringify(mockSession)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            full_name: 'Updated Name'
          }
        })
      })

      const result = await authService.updateUser({ full_name: 'Updated Name' })

      expect(result.success).toBe(true)
      expect(result.user?.full_name).toBe('Updated Name')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/user'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      )
    })

    it('should fail if not authenticated', async () => {
      const result = await authService.updateUser({ full_name: 'New Name' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Not authenticated')
    })
  })

  describe('updateUserMetadata', () => {
    it('should update user metadata successfully', async () => {
      const mockSession: AuthSession = {
        access_token: 'mock-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: {} as AuthUser
      }

      mockLocalStorage['tiko_auth_session'] = JSON.stringify(mockSession)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: 'user-123',
            user_metadata: { theme: 'dark', language: 'en' }
          }
        })
      })

      const result = await authService.updateUserMetadata({ theme: 'dark', language: 'en' })

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ data: { theme: 'dark', language: 'en' } })
        })
      )
    })
  })
})