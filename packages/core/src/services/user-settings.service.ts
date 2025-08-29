/**
 * User Settings Service
 *
 * @module services/user-settings
 * @description
 * Manages user-specific settings for each Tiko application.
 * This service provides a consistent API for storing and retrieving
 * app-specific user preferences and configurations.
 *
 * Each app can store its own settings object, allowing for flexible
 * configuration without affecting other apps. Settings are
 * by user ID and app name.
 *
 * @example
 * ```typescript
 * import { userSettingsService } from '@tiko/core'
 *
 * // Save settings for the timer app
 * await userSettingsService.saveSettings(userId, 'timer', {
 *   defaultDuration: 300,
 *   soundEnabled: true,
 *   theme: 'dark'
 * })
 *
 * // Get settings
 * const settings = await userSettingsService.getSettings(userId, 'timer')
 * console.log('Timer duration:', settings?.settings.defaultDuration)
 *
 * // Update specific settings
 * await userSettingsService.updateSettings(userId, 'timer', {
 *   soundEnabled: false
 * })
 * ```
 */

/**
 * User settings data structure
 *
 * @interface UserSettings
 * @property {string} [id] - Unique identifier for this settings record
 * @property {string} user_id - ID of the user who owns these settings
 * @property {string} app_name - Name of the app these settings belong to
 * @property {Record<string, any>} settings - The actual settings object (app-specific)
 * @property {string} [created_at] - ISO timestamp of when settings were created
 * @property {string} [updated_at] - ISO timestamp of last update
 *
 * @example
 * ```typescript
 * const timerSettings: UserSettings = {
 *   id: 'user123_timer',
 *   user_id: 'user123',
 *   app_name: 'timer',
 *   settings: {
 *     defaultDuration: 300,
 *     soundEnabled: true,
 *     theme: 'dark'
 *   },
 *   created_at: '2024-01-01T00:00:00Z',
 *   updated_at: '2024-01-02T00:00:00Z'
 * }
 * ```
 */
export interface UserSettings {
  id?: string
  user_id: string
  app_name: string
  settings: Record<string, any>
  created_at?: string
  updated_at?: string
}

/**
 * Result object for user settings operations
 *
 * @interface UserSettingsResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {string} [error] - Error message if operation failed
 * @property {UserSettings} [data] - Settings data if applicable
 */
export interface UserSettingsResult {
  success: boolean
  error?: string
  data?: UserSettings
}

/**
 * User settings service interface
 *
 * @interface UserSettingsService
 * @description
 * Defines the contract for user settings operations.
 * Any backend implementation must provide these methods.
 */
export interface UserSettingsService {
  /**
   * Get settings for a specific app and user
   *
   * @param {string} userId - User ID to get settings for
   * @param {string} appName - App name to get settings for
   * @returns {Promise<UserSettings | null>} Settings object or null if not found
   *
   * @example
   * ```typescript
   * const settings = await userSettingsService.getSettings('user123', 'timer')
   * if (settings) {
   *   console.log('Timer settings:', settings.settings)
   * }
   * ```
   */
  getSettings(userId: string, appName: string): Promise<UserSettings | null>

  /**
   * Save settings for a specific app and user (overwrites existing)
   *
   * @param {string} userId - User ID to save settings for
   * @param {string} appName - App name to save settings for
   * @param {Record<string, any>} settings - Complete settings object to save
   * @returns {Promise<UserSettingsResult>} Result with saved settings data
   *
   * @example
   * ```typescript
   * const result = await userSettingsService.saveSettings('user123', 'radio', {
   *   volume: 80,
   *   favorites: ['station1', 'station2'],
   *   autoPlay: true
   * })
   * ```
   */
  saveSettings(userId: string, appName: string, settings: Record<string, any>): Promise<UserSettingsResult>

  /**
   * Update settings for a specific app and user (partial update)
   *
   * @param {string} userId - User ID to update settings for
   * @param {string} appName - App name to update settings for
   * @param {Partial<Record<string, any>>} settings - Partial settings to merge
   * @returns {Promise<UserSettingsResult>} Result with updated settings data
   *
   * @example
   * ```typescript
   * // Only update the volume, keep other settings unchanged
   * await userSettingsService.updateSettings('user123', 'radio', {
   *   volume: 90
   * })
   * ```
   */
  updateSettings(userId: string, appName: string, settings: Partial<Record<string, any>>): Promise<UserSettingsResult>

  /**
   * Delete settings for a specific app and user
   *
   * @param {string} userId - User ID to delete settings for
   * @param {string} appName - App name to delete settings for
   * @returns {Promise<UserSettingsResult>} Success result if deleted
   */
  deleteSettings(userId: string, appName: string): Promise<UserSettingsResult>

  /**
   * Get all settings for a user across all apps
   *
   * @param {string} userId - User ID to get all settings for
   * @returns {Promise<UserSettings[]>} Array of all settings for the user
   *
   * @example
   * ```typescript
   * const allSettings = await userSettingsService.getAllUserSettings('user123')
   * allSettings.forEach(settings => {
   *   console.log(`${settings.app_name} settings:`, settings.settings)
   * })
   * ```
   */
  getAllUserSettings(userId: string): Promise<UserSettings[]>

  /**
   * Delete all settings for a user across all apps
   *
   * @param {string} userId - User ID to delete all settings for
   * @returns {Promise<UserSettingsResult>} Success result if all deleted
   *
   * @warning This will remove all app settings for the user!
   */
  deleteAllUserSettings(userId: string): Promise<UserSettingsResult>
}

/**
 * Current implementation using localStorage
 * This bypasses the broken Supabase SDK and stores data locally
 */
class LocalStorageUserSettingsService implements UserSettingsService {
  private readonly STORAGE_PREFIX = 'tiko_user_settings_'

  private getStorageKey(userId: string, appName: string): string {
    return `${this.STORAGE_PREFIX}${userId}_${appName}`
  }

  private getAllStorageKeys(userId: string): string[] {
    const keys: string[] = []
    const prefix = `${this.STORAGE_PREFIX}${userId}_`

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        keys.push(key)
      }
    }

    return keys
  }

  async getSettings(userId: string, appName: string): Promise<UserSettings | null> {
    try {
      const storageKey = this.getStorageKey(userId, appName)
      const dataStr = localStorage.getItem(storageKey)

      if (!dataStr) return null

      const data = JSON.parse(dataStr) as UserSettings
      console.log(`[User Settings Service] Retrieved settings for ${appName}:`, data)

      return data
    } catch (error) {
      console.error(`[User Settings Service] Error getting settings for ${appName}:`, error)
      return null
    }
  }

  async saveSettings(userId: string, appName: string, settings: Record<string, any>): Promise<UserSettingsResult> {
    try {
      const now = new Date().toISOString()
      const data: UserSettings = {
        id: `${userId}_${appName}`,
        user_id: userId,
        app_name: appName,
        settings,
        created_at: now,
        updated_at: now
      }

      const storageKey = this.getStorageKey(userId, appName)
      localStorage.setItem(storageKey, JSON.stringify(data))

      console.log(`[User Settings Service] Saved settings for ${appName}:`, data)

      return { success: true, data }
    } catch (error) {
      console.error(`[User Settings Service] Error saving settings for ${appName}:`, error)
      return { success: false, error: 'Failed to save settings' }
    }
  }

  async updateSettings(userId: string, appName: string, settings: Partial<Record<string, any>>): Promise<UserSettingsResult> {
    try {
      const existingData = await this.getSettings(userId, appName)

      const updatedSettings = existingData ? {
        ...existingData.settings,
        ...settings
      } : settings

      return this.saveSettings(userId, appName, updatedSettings)
    } catch (error) {
      console.error(`[User Settings Service] Error updating settings for ${appName}:`, error)
      return { success: false, error: 'Failed to update settings' }
    }
  }

  async deleteSettings(userId: string, appName: string): Promise<UserSettingsResult> {
    try {
      const storageKey = this.getStorageKey(userId, appName)
      localStorage.removeItem(storageKey)

      console.log(`[User Settings Service] Deleted settings for ${appName}`)

      return { success: true }
    } catch (error) {
      console.error(`[User Settings Service] Error deleting settings for ${appName}:`, error)
      return { success: false, error: 'Failed to delete settings' }
    }
  }

  async getAllUserSettings(userId: string): Promise<UserSettings[]> {
    try {
      const keys = this.getAllStorageKeys(userId)
      const settingsArray: UserSettings[] = []

      for (const key of keys) {
        const dataStr = localStorage.getItem(key)
        if (dataStr) {
          try {
            const data = JSON.parse(dataStr) as UserSettings
            settingsArray.push(data)
          } catch (parseError) {
            console.error(`[User Settings Service] Error parsing settings from ${key}:`, parseError)
          }
        }
      }

      console.log(`[User Settings Service] Retrieved all settings for user ${userId}:`, settingsArray)

      return settingsArray
    } catch (error) {
      console.error(`[User Settings Service] Error getting all settings for user ${userId}:`, error)
      return []
    }
  }

  async deleteAllUserSettings(userId: string): Promise<UserSettingsResult> {
    try {
      const keys = this.getAllStorageKeys(userId)

      for (const key of keys) {
        localStorage.removeItem(key)
      }

      console.log(`[User Settings Service] Deleted all settings for user ${userId}`)

      return { success: true }
    } catch (error) {
      console.error(`[User Settings Service] Error deleting all settings for user ${userId}:`, error)
      return { success: false, error: 'Failed to delete all settings' }
    }
  }
}

// Export the class for testing
export { LocalStorageUserSettingsService }

// Export singleton instance
export const userSettingsService: UserSettingsService = new LocalStorageUserSettingsService()
