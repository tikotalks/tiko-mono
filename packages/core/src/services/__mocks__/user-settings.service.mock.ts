/**
 * Mock User Settings Service
 * 
 * @module services/__mocks__/user-settings.service.mock
 * @description
 * Mock implementation of UserSettingsService for testing.
 * Provides in-memory storage and controllable responses.
 * 
 * @example
 * ```typescript
 * import { createMockUserSettingsService } from '@tiko/core/services/__mocks__/user-settings.service.mock'
 * 
 * const mockSettings = createMockUserSettingsService({
 *   'user123': {
 *     'timer': { defaultDuration: 300 },
 *     'radio': { volume: 80 }
 *   }
 * })
 * 
 * // Get settings
 * const settings = await mockSettings.getSettings('user123', 'timer')
 * expect(settings?.settings.defaultDuration).toBe(300)
 * ```
 */

import { vi } from 'vitest'
import type { UserSettingsService, UserSettings, UserSettingsResult } from '../user-settings.service'

/**
 * Mock user settings storage type
 * Structure: { [userId]: { [appName]: settings } }
 */
export type MockSettingsStorage = Record<string, Record<string, any>>

/**
 * Create mock user settings data
 */
export function createMockUserSettings(
  userId: string,
  appName: string,
  settings: Record<string, any>
): UserSettings {
  const now = new Date().toISOString()
  return {
    id: `${userId}_${appName}`,
    user_id: userId,
    app_name: appName,
    settings,
    created_at: now,
    updated_at: now
  }
}

/**
 * Create a mock UserSettingsService instance
 * 
 * @param initialData - Initial settings data
 * @param shouldFail - Whether operations should fail
 * @returns Mock UserSettingsService with spy functions
 */
export function createMockUserSettingsService(
  initialData: MockSettingsStorage = {},
  shouldFail = false
): UserSettingsService & {
  __resetMocks: () => void
  __getStorage: () => MockSettingsStorage
  __setStorage: (data: MockSettingsStorage) => void
  __setShouldFail: (fail: boolean) => void
} {
  let storage: MockSettingsStorage = JSON.parse(JSON.stringify(initialData))
  let failOperations = shouldFail

  const mockService = {
    getSettings: vi.fn().mockImplementation(async (userId: string, appName: string) => {
      if (failOperations) throw new Error('Mock error')
      
      const userSettings = storage[userId]?.[appName]
      if (!userSettings) return null

      return createMockUserSettings(userId, appName, userSettings)
    }),

    saveSettings: vi.fn().mockImplementation(async (userId: string, appName: string, settings: Record<string, any>) => {
      if (failOperations) {
        return { success: false, error: 'Mock error' }
      }

      if (!storage[userId]) {
        storage[userId] = {}
      }
      storage[userId][appName] = JSON.parse(JSON.stringify(settings))

      const data = createMockUserSettings(userId, appName, settings)
      return { success: true, data }
    }),

    updateSettings: vi.fn().mockImplementation(async (userId: string, appName: string, updates: Partial<Record<string, any>>) => {
      if (failOperations) {
        return { success: false, error: 'Mock error' }
      }

      const existing = storage[userId]?.[appName] || {}
      const merged = { ...existing, ...updates }
      
      if (!storage[userId]) {
        storage[userId] = {}
      }
      storage[userId][appName] = merged

      const data = createMockUserSettings(userId, appName, merged)
      return { success: true, data }
    }),

    deleteSettings: vi.fn().mockImplementation(async (userId: string, appName: string) => {
      if (failOperations) {
        return { success: false, error: 'Mock error' }
      }

      if (storage[userId]) {
        delete storage[userId][appName]
        if (Object.keys(storage[userId]).length === 0) {
          delete storage[userId]
        }
      }

      return { success: true }
    }),

    getAllUserSettings: vi.fn().mockImplementation(async (userId: string) => {
      if (failOperations) throw new Error('Mock error')

      const userStorage = storage[userId]
      if (!userStorage) return []

      return Object.entries(userStorage).map(([appName, settings]) =>
        createMockUserSettings(userId, appName, settings)
      )
    }),

    deleteAllUserSettings: vi.fn().mockImplementation(async (userId: string) => {
      if (failOperations) {
        return { success: false, error: 'Mock error' }
      }

      delete storage[userId]
      return { success: true }
    }),

    // Helper methods for testing
    __resetMocks: () => {
      Object.values(mockService).forEach(fn => {
        if (typeof fn === 'function' && fn.mockReset) {
          fn.mockReset()
        }
      })
      storage = JSON.parse(JSON.stringify(initialData))
      failOperations = shouldFail
    },

    __getStorage: () => storage,

    __setStorage: (data: MockSettingsStorage) => {
      storage = JSON.parse(JSON.stringify(data))
    },

    __setShouldFail: (fail: boolean) => {
      failOperations = fail
    }
  }

  return mockService as any
}

/**
 * Create an empty mock user settings service
 */
export function createEmptyMockUserSettingsService(): UserSettingsService {
  return createMockUserSettingsService({})
}

/**
 * Create a pre-populated mock user settings service
 */
export function createPopulatedMockUserSettingsService(): UserSettingsService {
  return createMockUserSettingsService({
    'user-123': {
      'timer': {
        defaultDuration: 300,
        soundEnabled: true,
        theme: 'dark'
      },
      'radio': {
        volume: 80,
        favorites: ['station1', 'station2'],
        autoPlay: true
      },
      'cards': {
        difficulty: 'medium',
        categories: ['animals', 'colors']
      }
    },
    'user-456': {
      'timer': {
        defaultDuration: 600,
        soundEnabled: false,
        theme: 'light'
      }
    }
  })
}

/**
 * Create a failing mock user settings service
 */
export function createFailingMockUserSettingsService(): UserSettingsService {
  return createMockUserSettingsService({}, true)
}