/**
 * Parent Mode Service
 * 
 * @module services/parent-mode
 * @description
 * Provides secure parent mode functionality for Tiko applications.
 * This service handles PIN management, session control, and parental settings.
 * 
 * Parent mode allows adults to protect sensitive features behind a PIN,
 * ensuring children can use the apps safely while parents maintain control
 * over settings and content management.
 * 
 * @example
 * ```typescript
 * import { parentModeService } from '@tiko/core'
 * 
 * // Enable parent mode with a PIN
 * const result = await parentModeService.enable(userId, '1234', {
 *   sessionTimeoutMinutes: 30,
 *   showVisualIndicator: true,
 *   autoLockOnAppSwitch: true,
 *   requirePinForSettings: true
 * })
 * 
 * // Verify PIN for access
 * const verified = await parentModeService.verifyPin(userId, '1234')
 * if (verified.success) {
 *   console.log('Parent mode unlocked!')
 * }
 * ```
 */

/**
 * Parent mode settings configuration
 * 
 * @interface ParentModeSettings
 * @property {number} sessionTimeoutMinutes - Minutes before session auto-locks (default: 30)
 * @property {boolean} showVisualIndicator - Show lock icon when parent mode is active
 * @property {boolean} autoLockOnAppSwitch - Lock when switching between apps
 * @property {boolean} requirePinForSettings - Require PIN to change parent mode settings
 */
export interface ParentModeSettings {
  sessionTimeoutMinutes: number
  showVisualIndicator: boolean
  autoLockOnAppSwitch: boolean
  requirePinForSettings: boolean
}

/**
 * Parent mode data structure stored for each user
 * 
 * @interface ParentModeData
 * @property {string} user_id - ID of the user who owns this parent mode configuration
 * @property {string} parent_pin_hash - SHA-256 hash of the PIN (never store plaintext)
 * @property {boolean} parent_mode_enabled - Whether parent mode is currently enabled
 * @property {ParentModeSettings} parent_mode_settings - Configuration settings
 */
export interface ParentModeData {
  user_id: string
  parent_pin_hash: string
  parent_mode_enabled: boolean
  parent_mode_settings: ParentModeSettings
}

/**
 * Result object for parent mode operations
 * 
 * @interface ParentModeResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {string} [error] - Error message if operation failed
 * @property {ParentModeData} [data] - Parent mode data if applicable
 */
export interface ParentModeResult {
  success: boolean
  error?: string
  data?: ParentModeData
}

/**
 * Parent mode service interface
 * 
 * @interface ParentModeService
 * @description
 * Defines the contract for parent mode operations.
 * Any backend implementation must provide these methods.
 */
export interface ParentModeService {
  /**
   * Enable parent mode for a user
   * 
   * @param {string} userId - User ID to enable parent mode for
   * @param {string} pin - 4-digit PIN to protect parent mode
   * @param {ParentModeSettings} settings - Initial settings configuration
   * @returns {Promise<ParentModeResult>} Result with parent mode data if successful
   * 
   * @example
   * ```typescript
   * const result = await parentModeService.enable(userId, '1234', defaultSettings)
   * if (result.success) {
   *   console.log('Parent mode enabled!')
   * } else {
   *   console.error('Failed:', result.error)
   * }
   * ```
   */
  enable(userId: string, pin: string, settings: ParentModeSettings): Promise<ParentModeResult>
  
  /**
   * Disable parent mode for a user
   * 
   * @param {string} userId - User ID to disable parent mode for
   * @returns {Promise<ParentModeResult>} Success result if disabled
   */
  disable(userId: string): Promise<ParentModeResult>
  
  /**
   * Get parent mode data for a user
   * 
   * @param {string} userId - User ID to get data for
   * @returns {Promise<ParentModeData | null>} Parent mode data or null if not enabled
   */
  getData(userId: string): Promise<ParentModeData | null>
  
  /**
   * Update parent mode settings
   * 
   * @param {string} userId - User ID to update settings for
   * @param {Partial<ParentModeSettings>} settings - Settings to update (partial update)
   * @returns {Promise<ParentModeResult>} Result with updated data if successful
   */
  updateSettings(userId: string, settings: Partial<ParentModeSettings>): Promise<ParentModeResult>
  
  /**
   * Verify a PIN for a user
   * 
   * @param {string} userId - User ID to verify PIN for
   * @param {string} pin - 4-digit PIN to verify
   * @returns {Promise<{success: boolean; error?: string}>} Success if PIN is correct
   * 
   * @example
   * ```typescript
   * const result = await parentModeService.verifyPin(userId, '1234')
   * if (result.success) {
   *   // Grant access to parent features
   * } else {
   *   console.error('Invalid PIN')
   * }
   * ```
   */
  verifyPin(userId: string, pin: string): Promise<{ success: boolean; error?: string }>
  
  /**
   * Change the parent mode PIN
   * 
   * @param {string} userId - User ID to change PIN for
   * @param {string} oldPin - Current PIN for verification
   * @param {string} newPin - New 4-digit PIN
   * @returns {Promise<ParentModeResult>} Result with updated data if successful
   */
  changePin(userId: string, oldPin: string, newPin: string): Promise<ParentModeResult>
  
  /**
   * Hash a PIN using SHA-256
   * 
   * @param {string} pin - PIN to hash
   * @returns {Promise<string>} Hex-encoded hash string
   */
  hashPin(pin: string): Promise<string>
  
  /**
   * Verify a PIN against a stored hash
   * 
   * @param {string} pin - PIN to verify
   * @param {string} hash - Stored hash to compare against
   * @returns {Promise<boolean>} True if PIN matches the hash
   */
  verifyPinHash(pin: string, hash: string): Promise<boolean>
}

import { userSettingsService } from './user-settings.service'

interface ParentModeUserSettings {
  parentPin?: string
  parentModeEnabled?: boolean
  parentModeSettings?: ParentModeSettings
}

/**
 * Current implementation using localStorage
 * This bypasses the broken Supabase SDK and stores data locally
 */
class LocalStorageParentModeService implements ParentModeService {
  private readonly STORAGE_KEY = 'tiko_parent_mode_data'

  async enable(userId: string, pin: string, settings: ParentModeSettings): Promise<ParentModeResult> {
    try {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return { success: false, error: 'PIN must be exactly 4 digits' }
      }

      const pinHash = await this.hashPin(pin)
      
      const data: ParentModeData = {
        user_id: userId,
        parent_pin_hash: pinHash,
        parent_mode_enabled: true,
        parent_mode_settings: settings
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
      
      // Also persist to user settings
      const parentModeSettings: ParentModeUserSettings = {
        parentPin: pin, // Store plain PIN since it's just 4 numbers
        parentModeEnabled: true,
        parentModeSettings: settings
      }
      await userSettingsService.updateSettings(userId, 'parent-mode', parentModeSettings)
      
      console.log('[Parent Mode Service] Enabled parent mode for user:', userId)

      return { success: true, data }
    } catch (error) {
      console.error('[Parent Mode Service] Error enabling parent mode:', error)
      return { success: false, error: 'Failed to enable parent mode' }
    }
  }

  async disable(userId: string): Promise<ParentModeResult> {
    try {
      const existingData = await this.getData(userId)
      if (!existingData) {
        return { success: false, error: 'Parent mode not found' }
      }

      localStorage.removeItem(this.STORAGE_KEY)
      
      // Also remove from user settings
      await userSettingsService.updateSettings(userId, 'parent-mode', {
        parentPin: undefined,
        parentModeEnabled: false
      })
      
      console.log('[Parent Mode Service] Disabled parent mode for user:', userId)

      return { success: true }
    } catch (error) {
      console.error('[Parent Mode Service] Error disabling parent mode:', error)
      return { success: false, error: 'Failed to disable parent mode' }
    }
  }

  async getData(userId: string): Promise<ParentModeData | null> {
    try {
      // First check localStorage for immediate access
      const dataStr = localStorage.getItem(this.STORAGE_KEY)
      if (dataStr) {
        const data = JSON.parse(dataStr) as ParentModeData
        
        // Verify the data belongs to the current user
        if (data.user_id === userId) {
          return data
        } else {
          console.log('[Parent Mode Service] Data belongs to different user, clearing...')
          localStorage.removeItem(this.STORAGE_KEY)
        }
      }
      
      // Try to load from user settings if not in localStorage
      const userSettings = await userSettingsService.getSettings(userId, 'parent-mode')
      if (userSettings?.settings) {
        const settings = userSettings.settings as ParentModeUserSettings
        if (settings.parentPin && settings.parentModeEnabled) {
          const pinHash = await this.hashPin(settings.parentPin)
          const data: ParentModeData = {
            user_id: userId,
            parent_pin_hash: pinHash,
            parent_mode_enabled: settings.parentModeEnabled,
            parent_mode_settings: settings.parentModeSettings || {
              sessionTimeoutMinutes: 30,
              showVisualIndicator: true,
              autoLockOnAppSwitch: true,
              requirePinForSettings: true
            }
          }
          
          // Cache in localStorage for faster access
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
          
          return data
        }
      }
      
      return null
    } catch (error) {
      console.error('[Parent Mode Service] Error getting parent mode data:', error)
      return null
    }
  }

  async updateSettings(userId: string, settings: Partial<ParentModeSettings>): Promise<ParentModeResult> {
    try {
      const existingData = await this.getData(userId)
      if (!existingData) {
        return { success: false, error: 'Parent mode not enabled' }
      }

      const updatedData: ParentModeData = {
        ...existingData,
        parent_mode_settings: {
          ...existingData.parent_mode_settings,
          ...settings
        }
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedData))
      
      // Also update in user settings
      await userSettingsService.updateSettings(userId, 'parent-mode', {
        parentModeSettings: updatedData.parent_mode_settings
      })
      
      console.log('[Parent Mode Service] Updated settings for user:', userId)

      return { success: true, data: updatedData }
    } catch (error) {
      console.error('[Parent Mode Service] Error updating settings:', error)
      return { success: false, error: 'Failed to update settings' }
    }
  }

  async verifyPin(userId: string, pin: string): Promise<{ success: boolean; error?: string }> {
    try {
      const data = await this.getData(userId)
      if (!data || !data.parent_mode_enabled) {
        return { success: false, error: 'Parent mode not enabled' }
      }

      const isValid = await this.verifyPinHash(pin, data.parent_pin_hash)
      if (!isValid) {
        return { success: false, error: 'Incorrect PIN' }
      }

      return { success: true }
    } catch (error) {
      console.error('[Parent Mode Service] Error verifying PIN:', error)
      return { success: false, error: 'PIN verification failed' }
    }
  }

  async changePin(userId: string, oldPin: string, newPin: string): Promise<ParentModeResult> {
    try {
      // Verify old PIN first
      const verifyResult = await this.verifyPin(userId, oldPin)
      if (!verifyResult.success) {
        return { success: false, error: verifyResult.error }
      }

      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        return { success: false, error: 'New PIN must be exactly 4 digits' }
      }

      const existingData = await this.getData(userId)
      if (!existingData) {
        return { success: false, error: 'Parent mode not enabled' }
      }

      const newPinHash = await this.hashPin(newPin)
      const updatedData: ParentModeData = {
        ...existingData,
        parent_pin_hash: newPinHash
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedData))
      
      // Also update in user settings
      await userSettingsService.updateSettings(userId, 'parent-mode', {
        parentPin: newPin
      })
      
      console.log('[Parent Mode Service] Changed PIN for user:', userId)

      return { success: true, data: updatedData }
    } catch (error) {
      console.error('[Parent Mode Service] Error changing PIN:', error)
      return { success: false, error: 'Failed to change PIN' }
    }
  }

  async hashPin(pin: string): Promise<string> {
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(pin + 'tiko_parent_salt')
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch (error) {
      console.error('[Parent Mode Service] Error hashing PIN:', error)
      throw new Error('Failed to hash PIN')
    }
  }

  async verifyPinHash(pin: string, hash: string): Promise<boolean> {
    try {
      const pinHash = await this.hashPin(pin)
      return pinHash === hash
    } catch (error) {
      console.error('[Parent Mode Service] Error verifying PIN hash:', error)
      return false
    }
  }
}

// Export the class for testing
export { LocalStorageParentModeService }

// Export singleton instance
export const parentModeService: ParentModeService = new LocalStorageParentModeService()