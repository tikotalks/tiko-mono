/**
 * Parent Mode Service Tests
 * 
 * @module services/__tests__/parent-mode.service.test
 * @description
 * Comprehensive test suite for the parent mode service.
 * Tests PIN management, session control, and settings configuration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LocalStorageParentModeService } from '../parent-mode.service'
import type { ParentModeService, ParentModeSettings, ParentModeData } from '../parent-mode.service'

// Mock crypto.subtle.digest for PIN hashing
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn().mockImplementation(async (algorithm: string, data: ArrayBuffer) => {
        // Return different hash based on input
        const decoder = new TextDecoder()
        const text = decoder.decode(data)
        // Create a simple hash based on the text
        const hash = new Uint8Array(32)
        for (let i = 0; i < text.length; i++) {
          hash[i % 32] ^= text.charCodeAt(i)
        }
        return hash.buffer
      })
    }
  },
  writable: true
})

describe('ParentModeService', () => {
  let parentModeService: ParentModeService
  let mockLocalStorage: Record<string, string>

  const defaultSettings: ParentModeSettings = {
    sessionTimeoutMinutes: 30,
    showVisualIndicator: true,
    autoLockOnAppSwitch: true,
    requirePinForSettings: true
  }

  const mockUserId = 'user-123'
  const mockPin = '1234'

  beforeEach(() => {
    parentModeService = new LocalStorageParentModeService()
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
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('enable', () => {
    it('should enable parent mode with valid PIN', async () => {
      const result = await parentModeService.enable(mockUserId, mockPin, defaultSettings)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.parent_mode_enabled).toBe(true)
      expect(result.data?.user_id).toBe(mockUserId)
      expect(result.data?.parent_mode_settings).toEqual(defaultSettings)
      expect(mockLocalStorage['tiko_parent_mode_data']).toBeDefined()
    })

    it('should reject invalid PIN format', async () => {
      const invalidPins = ['123', '12345', 'abcd', '12 34', '']

      for (const invalidPin of invalidPins) {
        const result = await parentModeService.enable(mockUserId, invalidPin, defaultSettings)
        expect(result.success).toBe(false)
        expect(result.error).toBe('PIN must be exactly 4 digits')
      }
    })

    it('should hash PIN before storing', async () => {
      const result = await parentModeService.enable(mockUserId, mockPin, defaultSettings)
      
      const storedData = JSON.parse(mockLocalStorage['tiko_parent_mode_data'])
      expect(storedData.parent_pin_hash).toBeDefined()
      expect(storedData.parent_pin_hash).not.toBe(mockPin) // Should be hashed
      expect(storedData.parent_pin_hash.length).toBe(64) // SHA-256 hex string
    })
  })

  describe('disable', () => {
    it('should disable parent mode successfully', async () => {
      // First enable
      await parentModeService.enable(mockUserId, mockPin, defaultSettings)
      
      // Then disable
      const result = await parentModeService.disable(mockUserId)

      expect(result.success).toBe(true)
      expect(mockLocalStorage['tiko_parent_mode_data']).toBeUndefined()
    })

    it('should handle disabling when not enabled', async () => {
      const result = await parentModeService.disable(mockUserId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Parent mode not found')
    })
  })

  describe('getData', () => {
    it('should return parent mode data when enabled', async () => {
      await parentModeService.enable(mockUserId, mockPin, defaultSettings)

      const data = await parentModeService.getData(mockUserId)

      expect(data).toBeDefined()
      expect(data?.user_id).toBe(mockUserId)
      expect(data?.parent_mode_enabled).toBe(true)
      expect(data?.parent_mode_settings).toEqual(defaultSettings)
    })

    it('should return null when not enabled', async () => {
      const data = await parentModeService.getData(mockUserId)
      expect(data).toBeNull()
    })

    it('should return null for different user ID', async () => {
      await parentModeService.enable(mockUserId, mockPin, defaultSettings)

      const data = await parentModeService.getData('different-user')
      expect(data).toBeNull()
    })

    it('should clear data if belongs to different user', async () => {
      // Set data for one user
      const data: ParentModeData = {
        user_id: 'other-user',
        parent_pin_hash: 'hash',
        parent_mode_enabled: true,
        parent_mode_settings: defaultSettings
      }
      mockLocalStorage['tiko_parent_mode_data'] = JSON.stringify(data)

      // Try to get data for different user
      const result = await parentModeService.getData(mockUserId)

      expect(result).toBeNull()
      expect(mockLocalStorage['tiko_parent_mode_data']).toBeUndefined()
    })
  })

  describe('verifyPin', () => {
    beforeEach(async () => {
      await parentModeService.enable(mockUserId, mockPin, defaultSettings)
    })

    it('should verify correct PIN', async () => {
      const result = await parentModeService.verifyPin(mockUserId, mockPin)

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject incorrect PIN', async () => {
      const result = await parentModeService.verifyPin(mockUserId, '0000')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Incorrect PIN')
    })

    it('should fail if parent mode not enabled', async () => {
      const result = await parentModeService.verifyPin('non-existent-user', mockPin)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Parent mode not enabled')
    })
  })

  describe('changePin', () => {
    beforeEach(async () => {
      await parentModeService.enable(mockUserId, mockPin, defaultSettings)
    })

    it('should change PIN with valid old PIN', async () => {
      const newPin = '5678'
      const result = await parentModeService.changePin(mockUserId, mockPin, newPin)

      expect(result.success).toBe(true)
      expect(result.data?.parent_pin_hash).toBeDefined()

      // Verify new PIN works
      const verifyResult = await parentModeService.verifyPin(mockUserId, newPin)
      expect(verifyResult.success).toBe(true)

      // Verify old PIN doesn't work
      const oldPinResult = await parentModeService.verifyPin(mockUserId, mockPin)
      expect(oldPinResult.success).toBe(false)
    })

    it('should reject change with incorrect old PIN', async () => {
      const result = await parentModeService.changePin(mockUserId, '0000', '5678')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Incorrect PIN')
    })

    it('should validate new PIN format', async () => {
      const result = await parentModeService.changePin(mockUserId, mockPin, 'abc')

      expect(result.success).toBe(false)
      expect(result.error).toBe('New PIN must be exactly 4 digits')
    })
  })

  describe('updateSettings', () => {
    beforeEach(async () => {
      await parentModeService.enable(mockUserId, mockPin, defaultSettings)
    })

    it('should update settings partially', async () => {
      const updates = {
        sessionTimeoutMinutes: 60,
        showVisualIndicator: false
      }

      const result = await parentModeService.updateSettings(mockUserId, updates)

      expect(result.success).toBe(true)
      expect(result.data?.parent_mode_settings.sessionTimeoutMinutes).toBe(60)
      expect(result.data?.parent_mode_settings.showVisualIndicator).toBe(false)
      expect(result.data?.parent_mode_settings.autoLockOnAppSwitch).toBe(true) // Unchanged
    })

    it('should fail if parent mode not enabled', async () => {
      const result = await parentModeService.updateSettings('non-existent-user', {
        sessionTimeoutMinutes: 60
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Parent mode not enabled')
    })
  })

  describe('hashPin', () => {
    it('should produce consistent hash for same PIN', async () => {
      const hash1 = await parentModeService.hashPin(mockPin)
      const hash2 = await parentModeService.hashPin(mockPin)

      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different PINs', async () => {
      const hash1 = await parentModeService.hashPin('1234')
      const hash2 = await parentModeService.hashPin('5678')

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPinHash', () => {
    it('should verify matching PIN and hash', async () => {
      const hash = await parentModeService.hashPin(mockPin)
      const result = await parentModeService.verifyPinHash(mockPin, hash)

      expect(result).toBe(true)
    })

    it('should reject non-matching PIN and hash', async () => {
      const hash = await parentModeService.hashPin(mockPin)
      const result = await parentModeService.verifyPinHash('0000', hash)

      expect(result).toBe(false)
    })
  })
})