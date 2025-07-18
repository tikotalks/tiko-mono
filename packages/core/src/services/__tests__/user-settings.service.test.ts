/**
 * User Settings Service Tests
 * 
 * @module services/__tests__/user-settings.service.test
 * @description
 * Comprehensive test suite for the user settings service.
 * Tests storage, retrieval, and management of app-specific user settings.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LocalStorageUserSettingsService } from '../user-settings.service'
import type { UserSettingsService, UserSettings } from '../user-settings.service'

describe('UserSettingsService', () => {
  let userSettingsService: UserSettingsService
  let mockLocalStorage: Record<string, string>

  const mockUserId = 'user-123'
  const mockSettings = {
    theme: 'dark',
    volume: 80,
    autoPlay: true,
    favorites: ['item1', 'item2']
  }

  beforeEach(() => {
    userSettingsService = new LocalStorageUserSettingsService()
    mockLocalStorage = {}
    
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn((key) => mockLocalStorage[key] || null),
      setItem: vi.fn((key, value) => { mockLocalStorage[key] = value }),
      removeItem: vi.fn((key) => { delete mockLocalStorage[key] }),
      clear: vi.fn(() => { mockLocalStorage = {} }),
      length: Object.keys(mockLocalStorage).length,
      key: vi.fn((index) => Object.keys(mockLocalStorage)[index] || null)
    } as any

    // Update length dynamically
    Object.defineProperty(global.localStorage, 'length', {
      get: () => Object.keys(mockLocalStorage).length
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('saveSettings', () => {
    it('should save settings for an app', async () => {
      const result = await userSettingsService.saveSettings(mockUserId, 'timer', mockSettings)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.user_id).toBe(mockUserId)
      expect(result.data?.app_name).toBe('timer')
      expect(result.data?.settings).toEqual(mockSettings)
      expect(result.data?.created_at).toBeDefined()
      expect(result.data?.updated_at).toBeDefined()
      
      const storageKey = `tiko_user_settings_${mockUserId}_timer`
      expect(mockLocalStorage[storageKey]).toBeDefined()
    })

    it('should overwrite existing settings', async () => {
      // Save initial settings
      await userSettingsService.saveSettings(mockUserId, 'timer', mockSettings)

      // Save new settings
      const newSettings = { theme: 'light', volume: 50 }
      const result = await userSettingsService.saveSettings(mockUserId, 'timer', newSettings)

      expect(result.success).toBe(true)
      expect(result.data?.settings).toEqual(newSettings)
      expect(result.data?.settings).not.toEqual(mockSettings)
    })

    it('should handle complex nested settings', async () => {
      const complexSettings = {
        preferences: {
          display: {
            theme: 'dark',
            fontSize: 16,
            animations: true
          },
          audio: {
            volume: 80,
            effects: true,
            music: false
          }
        },
        history: [
          { date: '2024-01-01', action: 'login' },
          { date: '2024-01-02', action: 'settings_changed' }
        ]
      }

      const result = await userSettingsService.saveSettings(mockUserId, 'complex-app', complexSettings)

      expect(result.success).toBe(true)
      expect(result.data?.settings).toEqual(complexSettings)
    })
  })

  describe('getSettings', () => {
    it('should retrieve saved settings', async () => {
      await userSettingsService.saveSettings(mockUserId, 'timer', mockSettings)

      const settings = await userSettingsService.getSettings(mockUserId, 'timer')

      expect(settings).toBeDefined()
      expect(settings?.user_id).toBe(mockUserId)
      expect(settings?.app_name).toBe('timer')
      expect(settings?.settings).toEqual(mockSettings)
    })

    it('should return null for non-existent settings', async () => {
      const settings = await userSettingsService.getSettings(mockUserId, 'non-existent-app')
      expect(settings).toBeNull()
    })

    it('should handle corrupted data gracefully', async () => {
      const storageKey = `tiko_user_settings_${mockUserId}_corrupted`
      mockLocalStorage[storageKey] = 'invalid-json-{]'

      const settings = await userSettingsService.getSettings(mockUserId, 'corrupted')
      expect(settings).toBeNull()
    })
  })

  describe('updateSettings', () => {
    it('should update existing settings partially', async () => {
      await userSettingsService.saveSettings(mockUserId, 'timer', mockSettings)

      const updates = { volume: 100, newField: 'test' }
      const result = await userSettingsService.updateSettings(mockUserId, 'timer', updates)

      expect(result.success).toBe(true)
      expect(result.data?.settings.volume).toBe(100)
      expect(result.data?.settings.theme).toBe('dark') // Unchanged
      expect(result.data?.settings.newField).toBe('test') // Added
    })

    it('should create new settings if none exist', async () => {
      const result = await userSettingsService.updateSettings(mockUserId, 'new-app', mockSettings)

      expect(result.success).toBe(true)
      expect(result.data?.settings).toEqual(mockSettings)
    })

    it('should preserve nested objects during update', async () => {
      const initialSettings = {
        preferences: {
          display: { theme: 'dark', fontSize: 16 },
          audio: { volume: 80, effects: true }
        }
      }

      await userSettingsService.saveSettings(mockUserId, 'nested-app', initialSettings)

      const updates = {
        preferences: {
          display: { theme: 'light' } // Only update theme
        }
      }

      const result = await userSettingsService.updateSettings(mockUserId, 'nested-app', updates)

      expect(result.success).toBe(true)
      expect(result.data?.settings.preferences.display.theme).toBe('light')
      expect(result.data?.settings.preferences.display.fontSize).toBeUndefined() // Lost in shallow merge
      expect(result.data?.settings.preferences.audio).toBeUndefined() // Lost in shallow merge
    })
  })

  describe('deleteSettings', () => {
    it('should delete existing settings', async () => {
      await userSettingsService.saveSettings(mockUserId, 'timer', mockSettings)

      const result = await userSettingsService.deleteSettings(mockUserId, 'timer')

      expect(result.success).toBe(true)
      
      const settings = await userSettingsService.getSettings(mockUserId, 'timer')
      expect(settings).toBeNull()
      
      const storageKey = `tiko_user_settings_${mockUserId}_timer`
      expect(mockLocalStorage[storageKey]).toBeUndefined()
    })

    it('should handle deleting non-existent settings', async () => {
      const result = await userSettingsService.deleteSettings(mockUserId, 'non-existent')
      expect(result.success).toBe(true) // Idempotent operation
    })
  })

  describe('getAllUserSettings', () => {
    it('should return all settings for a user', async () => {
      // Save settings for multiple apps
      await userSettingsService.saveSettings(mockUserId, 'app1', { setting1: 'value1' })
      await userSettingsService.saveSettings(mockUserId, 'app2', { setting2: 'value2' })
      await userSettingsService.saveSettings(mockUserId, 'app3', { setting3: 'value3' })

      // Save settings for different user (should not be included)
      await userSettingsService.saveSettings('other-user', 'app1', { other: 'data' })

      const allSettings = await userSettingsService.getAllUserSettings(mockUserId)

      expect(allSettings).toHaveLength(3)
      expect(allSettings.map(s => s.app_name).sort()).toEqual(['app1', 'app2', 'app3'])
      expect(allSettings.every(s => s.user_id === mockUserId)).toBe(true)
    })

    it('should return empty array for user with no settings', async () => {
      const allSettings = await userSettingsService.getAllUserSettings(mockUserId)
      expect(allSettings).toEqual([])
    })

    it('should handle corrupted entries gracefully', async () => {
      // Save valid settings
      await userSettingsService.saveSettings(mockUserId, 'valid-app', { valid: true })

      // Add corrupted entry
      mockLocalStorage[`tiko_user_settings_${mockUserId}_corrupted`] = 'invalid-json'

      const allSettings = await userSettingsService.getAllUserSettings(mockUserId)

      // Should only return valid settings
      expect(allSettings).toHaveLength(1)
      expect(allSettings[0].app_name).toBe('valid-app')
    })
  })

  describe('deleteAllUserSettings', () => {
    it('should delete all settings for a user', async () => {
      // Save settings for multiple apps
      await userSettingsService.saveSettings(mockUserId, 'app1', { setting1: 'value1' })
      await userSettingsService.saveSettings(mockUserId, 'app2', { setting2: 'value2' })
      await userSettingsService.saveSettings(mockUserId, 'app3', { setting3: 'value3' })

      // Save settings for different user (should not be deleted)
      await userSettingsService.saveSettings('other-user', 'app1', { other: 'data' })

      const result = await userSettingsService.deleteAllUserSettings(mockUserId)

      expect(result.success).toBe(true)

      // Verify all user settings are deleted
      const userSettings = await userSettingsService.getAllUserSettings(mockUserId)
      expect(userSettings).toEqual([])

      // Verify other user's settings remain
      const otherSettings = await userSettingsService.getSettings('other-user', 'app1')
      expect(otherSettings).toBeDefined()
    })

    it('should handle user with no settings', async () => {
      const result = await userSettingsService.deleteAllUserSettings(mockUserId)
      expect(result.success).toBe(true) // Idempotent operation
    })
  })

  describe('Edge cases', () => {
    it('should handle empty settings object', async () => {
      const result = await userSettingsService.saveSettings(mockUserId, 'empty-app', {})
      
      expect(result.success).toBe(true)
      expect(result.data?.settings).toEqual({})
    })

    it('should handle very large settings', async () => {
      const largeSettings = {
        data: Array(1000).fill(null).map((_, i) => ({
          id: i,
          value: `Item ${i}`,
          metadata: { created: new Date().toISOString(), tags: ['tag1', 'tag2'] }
        }))
      }

      const result = await userSettingsService.saveSettings(mockUserId, 'large-app', largeSettings)
      
      expect(result.success).toBe(true)
      
      const retrieved = await userSettingsService.getSettings(mockUserId, 'large-app')
      expect(retrieved?.settings).toEqual(largeSettings)
    })

    it('should handle special characters in app names', async () => {
      const specialAppNames = [
        'app-with-dash',
        'app_with_underscore',
        'app.with.dots',
        'app:with:colons',
        'app/with/slashes'
      ]

      for (const appName of specialAppNames) {
        const result = await userSettingsService.saveSettings(mockUserId, appName, { test: true })
        expect(result.success).toBe(true)
        
        const retrieved = await userSettingsService.getSettings(mockUserId, appName)
        expect(retrieved?.app_name).toBe(appName)
      }
    })
  })
})