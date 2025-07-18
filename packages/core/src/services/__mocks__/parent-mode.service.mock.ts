/**
 * Mock Parent Mode Service
 * 
 * @module services/__mocks__/parent-mode.service.mock
 * @description
 * Mock implementation of ParentModeService for testing.
 * Provides controllable responses and spy functions.
 * 
 * @example
 * ```typescript
 * import { createMockParentModeService } from '@tiko/core/services/__mocks__/parent-mode.service.mock'
 * 
 * const mockParentMode = createMockParentModeService({
 *   isEnabled: true,
 *   pin: '1234'
 * })
 * 
 * // Test PIN verification
 * const result = await mockParentMode.verifyPin('user123', '1234')
 * expect(result.success).toBe(true)
 * ```
 */

import { vi } from 'vitest'
import type { ParentModeService, ParentModeSettings, ParentModeData, ParentModeResult } from '../parent-mode.service'

/**
 * Default parent mode settings for testing
 */
export const mockParentModeSettings: ParentModeSettings = {
  sessionTimeoutMinutes: 30,
  showVisualIndicator: true,
  autoLockOnAppSwitch: true,
  requirePinForSettings: true
}

/**
 * Default parent mode data for testing
 */
export const mockParentModeData: ParentModeData = {
  user_id: 'mock-user-123',
  parent_pin_hash: 'mock-hash-1234',
  parent_mode_enabled: true,
  parent_mode_settings: mockParentModeSettings
}

/**
 * Configuration for mock parent mode service
 */
export interface MockParentModeConfig {
  isEnabled?: boolean
  pin?: string
  settings?: ParentModeSettings
  shouldFailOperations?: boolean
}

/**
 * Create a mock ParentModeService instance
 * 
 * @param config - Configuration for the mock
 * @returns Mock ParentModeService with spy functions
 */
export function createMockParentModeService(config: MockParentModeConfig = {}): ParentModeService & {
  __resetMocks: () => void
  __setEnabled: (enabled: boolean) => void
  __setPin: (pin: string) => void
} {
  const {
    isEnabled = false,
    pin = '1234',
    settings = mockParentModeSettings,
    shouldFailOperations = false
  } = config

  let currentEnabled = isEnabled
  let currentPin = pin
  let currentSettings = { ...settings }
  let storedData: ParentModeData | null = isEnabled ? {
    ...mockParentModeData,
    parent_mode_settings: currentSettings
  } : null

  const mockService = {
    enable: vi.fn().mockImplementation(async (userId: string, newPin: string, newSettings: ParentModeSettings) => {
      if (shouldFailOperations) {
        return { success: false, error: 'Mock error' }
      }

      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        return { success: false, error: 'PIN must be exactly 4 digits' }
      }

      currentEnabled = true
      currentPin = newPin
      currentSettings = { ...newSettings }
      storedData = {
        user_id: userId,
        parent_pin_hash: await mockService.hashPin(newPin),
        parent_mode_enabled: true,
        parent_mode_settings: newSettings
      }

      return { success: true, data: storedData }
    }),

    disable: vi.fn().mockImplementation(async (userId: string) => {
      if (shouldFailOperations) {
        return { success: false, error: 'Mock error' }
      }

      if (!currentEnabled) {
        return { success: false, error: 'Parent mode not found' }
      }

      currentEnabled = false
      storedData = null
      return { success: true }
    }),

    getData: vi.fn().mockImplementation(async (userId: string) => {
      if (!currentEnabled || !storedData) return null
      if (storedData.user_id !== userId) return null
      return storedData
    }),

    updateSettings: vi.fn().mockImplementation(async (userId: string, updates: Partial<ParentModeSettings>) => {
      if (shouldFailOperations) {
        return { success: false, error: 'Mock error' }
      }

      if (!currentEnabled || !storedData) {
        return { success: false, error: 'Parent mode not enabled' }
      }

      currentSettings = { ...currentSettings, ...updates }
      storedData = {
        ...storedData,
        parent_mode_settings: currentSettings
      }

      return { success: true, data: storedData }
    }),

    verifyPin: vi.fn().mockImplementation(async (userId: string, inputPin: string) => {
      if (!currentEnabled) {
        return { success: false, error: 'Parent mode not enabled' }
      }

      const isValid = inputPin === currentPin
      return isValid ? { success: true } : { success: false, error: 'Incorrect PIN' }
    }),

    changePin: vi.fn().mockImplementation(async (userId: string, oldPin: string, newPin: string) => {
      if (shouldFailOperations) {
        return { success: false, error: 'Mock error' }
      }

      if (oldPin !== currentPin) {
        return { success: false, error: 'Incorrect PIN' }
      }

      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        return { success: false, error: 'New PIN must be exactly 4 digits' }
      }

      currentPin = newPin
      if (storedData) {
        storedData = {
          ...storedData,
          parent_pin_hash: await mockService.hashPin(newPin)
        }
      }

      return { success: true, data: storedData }
    }),

    hashPin: vi.fn().mockImplementation(async (pin: string) => {
      // Simple mock hash - just prefix with 'hash-'
      return `hash-${pin}`
    }),

    verifyPinHash: vi.fn().mockImplementation(async (pin: string, hash: string) => {
      return hash === `hash-${pin}`
    }),

    // Helper methods for testing
    __resetMocks: () => {
      Object.values(mockService).forEach(fn => {
        if (typeof fn === 'function' && fn.mockReset) {
          fn.mockReset()
        }
      })
      currentEnabled = isEnabled
      currentPin = pin
      currentSettings = { ...settings }
    },

    __setEnabled: (enabled: boolean) => {
      currentEnabled = enabled
      storedData = enabled ? {
        ...mockParentModeData,
        parent_mode_settings: currentSettings
      } : null
    },

    __setPin: (newPin: string) => {
      currentPin = newPin
    }
  }

  return mockService as any
}

/**
 * Create a disabled mock parent mode service
 */
export function createDisabledMockParentModeService(): ParentModeService {
  return createMockParentModeService({ isEnabled: false })
}

/**
 * Create an enabled mock parent mode service with default PIN
 */
export function createEnabledMockParentModeService(pin = '1234'): ParentModeService {
  return createMockParentModeService({ isEnabled: true, pin })
}

/**
 * Create a failing mock parent mode service
 */
export function createFailingMockParentModeService(): ParentModeService {
  return createMockParentModeService({ shouldFailOperations: true })
}