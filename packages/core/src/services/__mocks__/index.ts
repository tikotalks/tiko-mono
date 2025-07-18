/**
 * Service Mocks Index
 * 
 * @module services/__mocks__
 * @description
 * Provides mock implementations of all services for testing.
 * Import these mocks in your test files to avoid hitting real APIs.
 * 
 * @example
 * ```typescript
 * // In your test file
 * import { 
 *   createMockAuthService,
 *   createMockParentModeService,
 *   createMockUserSettingsService 
 * } from '@tiko/core/services/__mocks__'
 * 
 * // Or use vi.mock to automatically mock
 * vi.mock('@tiko/core', async () => {
 *   const actual = await vi.importActual('@tiko/core')
 *   const mocks = await import('@tiko/core/services/__mocks__')
 *   
 *   return {
 *     ...actual,
 *     authService: mocks.createMockAuthService(),
 *     parentModeService: mocks.createMockParentModeService(),
 *     userSettingsService: mocks.createMockUserSettingsService()
 *   }
 * })
 * ```
 */

// Auth service mocks
export * from './auth.service.mock'

// Parent mode service mocks
export * from './parent-mode.service.mock'

// User settings service mocks
export * from './user-settings.service.mock'

// Convenience function to create all mocks at once
import { createMockAuthService } from './auth.service.mock'
import { createMockParentModeService } from './parent-mode.service.mock'
import { createMockUserSettingsService } from './user-settings.service.mock'

/**
 * Create all mock services with default configuration
 */
export function createAllMockServices() {
  return {
    authService: createMockAuthService(),
    parentModeService: createMockParentModeService(),
    userSettingsService: createMockUserSettingsService()
  }
}

/**
 * Create all mock services in authenticated state
 */
export function createAuthenticatedMockServices(userId = 'mock-user-123') {
  return {
    authService: createMockAuthService(),
    parentModeService: createMockParentModeService({ isEnabled: true }),
    userSettingsService: createMockUserSettingsService({
      [userId]: {
        'app': { theme: 'dark' }
      }
    })
  }
}

/**
 * Create all mock services in unauthenticated state
 */
export function createUnauthenticatedMockServices() {
  return {
    authService: createMockAuthService({ getSession: null }),
    parentModeService: createMockParentModeService({ isEnabled: false }),
    userSettingsService: createMockUserSettingsService()
  }
}