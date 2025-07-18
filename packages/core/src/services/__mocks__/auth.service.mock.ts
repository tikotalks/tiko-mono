/**
 * Mock Authentication Service
 * 
 * @module services/__mocks__/auth.service.mock
 * @description
 * Mock implementation of AuthService for testing.
 * Provides controllable responses and spy functions.
 * 
 * @example
 * ```typescript
 * import { createMockAuthService } from '@tiko/core/services/__mocks__/auth.service.mock'
 * 
 * const mockAuth = createMockAuthService({
 *   signInWithEmail: { success: true, user: mockUser }
 * })
 * 
 * // Use in tests
 * expect(mockAuth.signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password')
 * ```
 */

import { vi } from 'vitest'
import type { AuthService, AuthResult, AuthSession, AuthUser } from '../auth.service'

/**
 * Default mock user for testing
 */
export const mockAuthUser: AuthUser = {
  id: 'mock-user-123',
  email: 'test@example.com',
  phone: '+1234567890',
  full_name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  email_verified: true,
  phone_verified: false,
  app_metadata: { provider: 'email' },
  user_metadata: { theme: 'dark', language: 'en' },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

/**
 * Default mock session for testing
 */
export const mockAuthSession: AuthSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  expires_in: 3600,
  token_type: 'bearer',
  user: mockAuthUser
}

/**
 * Configuration for mock responses
 */
export interface MockAuthConfig {
  signInWithEmail?: AuthResult | Error
  signUpWithEmail?: AuthResult | Error
  signInWithMagicLink?: AuthResult | Error
  verifyOtp?: AuthResult | Error
  resendOtp?: AuthResult | Error
  signOut?: { success: boolean; error?: string } | Error
  getSession?: AuthSession | null | Error
  refreshSession?: AuthResult | Error
  updateUser?: AuthResult | Error
  updateUserMetadata?: AuthResult | Error
}

/**
 * Create a mock AuthService instance
 * 
 * @param config - Configuration for mock responses
 * @returns Mock AuthService with spy functions
 */
export function createMockAuthService(config: MockAuthConfig = {}): AuthService & {
  __resetMocks: () => void
  __setMockResponse: (method: keyof MockAuthConfig, response: any) => void
} {
  const defaultResponses: MockAuthConfig = {
    signInWithEmail: { success: true, session: mockAuthSession, user: mockAuthUser },
    signUpWithEmail: { success: true, user: mockAuthUser },
    signInWithMagicLink: { success: true },
    verifyOtp: { success: true, session: mockAuthSession, user: mockAuthUser },
    resendOtp: { success: true },
    signOut: { success: true },
    getSession: mockAuthSession,
    refreshSession: { success: true, session: mockAuthSession, user: mockAuthUser },
    updateUser: { success: true, user: mockAuthUser },
    updateUserMetadata: { success: true, user: mockAuthUser }
  }

  const responses = { ...defaultResponses, ...config }

  const mockService = {
    signInWithEmail: vi.fn().mockImplementation(async () => {
      const response = responses.signInWithEmail
      if (response instanceof Error) throw response
      return response
    }),

    signUpWithEmail: vi.fn().mockImplementation(async () => {
      const response = responses.signUpWithEmail
      if (response instanceof Error) throw response
      return response
    }),

    signInWithMagicLink: vi.fn().mockImplementation(async () => {
      const response = responses.signInWithMagicLink
      if (response instanceof Error) throw response
      return response
    }),

    verifyOtp: vi.fn().mockImplementation(async () => {
      const response = responses.verifyOtp
      if (response instanceof Error) throw response
      return response
    }),

    resendOtp: vi.fn().mockImplementation(async () => {
      const response = responses.resendOtp
      if (response instanceof Error) throw response
      return response
    }),

    signOut: vi.fn().mockImplementation(async () => {
      const response = responses.signOut
      if (response instanceof Error) throw response
      return response
    }),

    getSession: vi.fn().mockImplementation(async () => {
      const response = responses.getSession
      if (response instanceof Error) throw response
      return response
    }),

    refreshSession: vi.fn().mockImplementation(async () => {
      const response = responses.refreshSession
      if (response instanceof Error) throw response
      return response
    }),

    updateUser: vi.fn().mockImplementation(async () => {
      const response = responses.updateUser
      if (response instanceof Error) throw response
      return response
    }),

    updateUserMetadata: vi.fn().mockImplementation(async () => {
      const response = responses.updateUserMetadata
      if (response instanceof Error) throw response
      return response
    }),

    // Helper methods for testing
    __resetMocks: () => {
      Object.values(mockService).forEach(fn => {
        if (typeof fn === 'function' && fn.mockReset) {
          fn.mockReset()
        }
      })
    },

    __setMockResponse: (method: keyof MockAuthConfig, response: any) => {
      responses[method] = response
    }
  }

  return mockService as any
}

/**
 * Create a failing mock AuthService
 * All methods will return errors
 */
export function createFailingMockAuthService(errorMessage = 'Mock error'): AuthService {
  return createMockAuthService({
    signInWithEmail: { success: false, error: errorMessage },
    signUpWithEmail: { success: false, error: errorMessage },
    signInWithMagicLink: { success: false, error: errorMessage },
    verifyOtp: { success: false, error: errorMessage },
    resendOtp: { success: false, error: errorMessage },
    signOut: { success: false, error: errorMessage },
    getSession: null,
    refreshSession: { success: false, error: errorMessage },
    updateUser: { success: false, error: errorMessage },
    updateUserMetadata: { success: false, error: errorMessage }
  })
}

/**
 * Create an unauthenticated mock AuthService
 * getSession returns null, other methods fail with "Not authenticated"
 */
export function createUnauthenticatedMockAuthService(): AuthService {
  return createMockAuthService({
    signInWithEmail: { success: true, session: mockAuthSession, user: mockAuthUser },
    signUpWithEmail: { success: true, user: mockAuthUser },
    signInWithMagicLink: { success: true },
    verifyOtp: { success: true, session: mockAuthSession, user: mockAuthUser },
    getSession: null,
    refreshSession: { success: false, error: 'Not authenticated' },
    updateUser: { success: false, error: 'Not authenticated' },
    updateUserMetadata: { success: false, error: 'Not authenticated' }
  })
}