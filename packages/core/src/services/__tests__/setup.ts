/**
 * Test Setup Utilities
 * 
 * @module services/__tests__/setup
 * @description
 * Common setup utilities for service tests.
 * Provides helpers for mocking global objects and resetting state.
 */

import { vi, beforeEach, afterEach } from 'vitest'

/**
 * Mock localStorage for tests
 */
export function setupLocalStorageMock() {
  const mockStorage: Record<string, string> = {}
  
  const localStorageMock = {
    getItem: vi.fn((key: string) => mockStorage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key]
    }),
    clear: vi.fn(() => {
      Object.keys(mockStorage).forEach(key => delete mockStorage[key])
    }),
    get length() {
      return Object.keys(mockStorage).length
    },
    key: vi.fn((index: number) => {
      return Object.keys(mockStorage)[index] || null
    })
  }

  global.localStorage = localStorageMock as any
  
  return {
    storage: mockStorage,
    mock: localStorageMock
  }
}

/**
 * Mock fetch for tests
 */
export function setupFetchMock() {
  const mockFetch = vi.fn()
  global.fetch = mockFetch
  
  return mockFetch
}

/**
 * Mock crypto.subtle for tests
 */
export function setupCryptoMock() {
  global.crypto = {
    subtle: {
      digest: vi.fn().mockImplementation(async (algorithm: string, data: ArrayBuffer) => {
        // Return a predictable hash for testing
        const bytes = new Uint8Array(32)
        for (let i = 0; i < 32; i++) {
          bytes[i] = i
        }
        return bytes.buffer
      })
    }
  } as any
}

/**
 * Setup all common mocks
 */
export function setupServiceTestEnvironment() {
  const localStorage = setupLocalStorageMock()
  const fetch = setupFetchMock()
  setupCryptoMock()
  
  // Clean up after each test
  afterEach(() => {
    vi.clearAllMocks()
    localStorage.mock.clear()
  })
  
  return {
    localStorage,
    fetch
  }
}

/**
 * Create a mock response for fetch
 */
export function createMockResponse(data: any, options: Partial<Response> = {}) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => data,
    text: async () => JSON.stringify(data),
    ...options
  } as Response
}

/**
 * Create a mock error response for fetch
 */
export function createMockErrorResponse(error: any, status = 400) {
  return {
    ok: false,
    status,
    statusText: 'Error',
    json: async () => error,
    text: async () => JSON.stringify(error)
  } as Response
}

/**
 * Wait for all promises to resolve
 */
export async function flushPromises() {
  await new Promise(resolve => setImmediate(resolve))
}

/**
 * Create a mock user for testing
 */
export function createTestUser(overrides: any = {}) {
  return {
    id: 'test-user-123',
    email: 'test@example.com',
    email_verified: true,
    phone_verified: false,
    app_metadata: {},
    user_metadata: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  }
}

/**
 * Create a mock session for testing
 */
export function createTestSession(overrides: any = {}) {
  return {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: 'bearer',
    user: createTestUser(),
    ...overrides
  }
}