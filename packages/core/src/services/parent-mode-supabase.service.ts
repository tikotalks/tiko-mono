/**
 * Supabase Parent Mode Service Implementation
 *
 * @module services/parent-mode-supabase
 * @description
 * Parent mode service that stores data in Supabase database.
 * This implementation makes direct API calls to bypass the broken SDK.
 *
 * @example
 * ```typescript
 * // To use this instead of localStorage implementation:
 * import { SupabaseParentModeService } from './parent-mode-supabase.service'
 * export const parentModeService = new SupabaseParentModeService()
 * ```
 */

import type { ParentModeService, ParentModeSettings, ParentModeData, ParentModeResult } from './parent-mode.service'

/**
 * Supabase implementation of parent mode service
 * Uses direct API calls to bypass the broken Supabase SDK
 */
export class SupabaseParentModeService implements ParentModeService {
  private readonly API_URL: string
  private readonly apiKey: string

  constructor() {
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL environment variable is required')
    }
    this.API_URL = `${supabaseUrl}/rest/v1`

    // Use public key for browser compatibility
    this.apiKey = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY
    if (!this.apiKey) {
      throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY environment variable is required')
    }
  }

  /**
   * Get current auth token for API calls
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const sessionStr = localStorage.getItem('tiko_auth_session')
      if (!sessionStr) return null

      const session = JSON.parse(sessionStr)
      return session.access_token
    } catch {
      return null
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<Response> {
    const token = await this.getAuthToken()

    const headers: HeadersInit = {
      'apikey': this.apiKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const options: RequestInit = {
      method,
      headers
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    return fetch(`${this.API_URL}${endpoint}`, options)
  }

  async enable(userId: string, pin: string, settings: ParentModeSettings): Promise<ParentModeResult> {
    try {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return { success: false, error: 'PIN must be exactly 4 digits' }
      }

      const pinHash = await this.hashPin(pin)

      const response = await this.makeRequest('/user_profiles', 'POST', {
        user_id: userId,
        parent_pin_hash: pinHash,
        parent_mode_enabled: true,
        parent_mode_settings: settings
      })

      if (!response.ok) {
        // Try upsert instead
        const upsertResponse = await this.makeRequest(
          `/user_profiles?user_id=eq.${userId}`,
          'PATCH',
          {
            parent_pin_hash: pinHash,
            parent_mode_enabled: true,
            parent_mode_settings: settings
          }
        )

        if (!upsertResponse.ok) {
          console.error('[Parent Mode Service] Failed to enable:', await upsertResponse.text())
          return { success: false, error: 'Failed to save parent mode settings' }
        }
      }

      const data: ParentModeData = {
        user_id: userId,
        parent_pin_hash: pinHash,
        parent_mode_enabled: true,
        parent_mode_settings: settings
      }

      // Also store in localStorage as backup
      localStorage.setItem('tiko_parent_mode_data', JSON.stringify(data))

      console.log('[Parent Mode Service] Enabled parent mode for user:', userId)
      return { success: true, data }
    } catch (error) {
      console.error('[Parent Mode Service] Error enabling parent mode:', error)
      return { success: false, error: 'Failed to enable parent mode' }
    }
  }

  async disable(userId: string): Promise<ParentModeResult> {
    try {
      const response = await this.makeRequest(
        `/user_profiles?user_id=eq.${userId}`,
        'PATCH',
        {
          parent_pin_hash: null,
          parent_mode_enabled: false
        }
      )

      if (!response.ok) {
        console.error('[Parent Mode Service] Failed to disable:', await response.text())
        return { success: false, error: 'Failed to disable parent mode' }
      }

      // Clear localStorage backup
      localStorage.removeItem('tiko_parent_mode_data')

      console.log('[Parent Mode Service] Disabled parent mode for user:', userId)
      return { success: true }
    } catch (error) {
      console.error('[Parent Mode Service] Error disabling parent mode:', error)
      return { success: false, error: 'Failed to disable parent mode' }
    }
  }

  async getData(userId: string): Promise<ParentModeData | null> {
    try {
      const response = await this.makeRequest(
        `/user_profiles?user_id=eq.${userId}&select=parent_pin_hash,parent_mode_enabled,parent_mode_settings`
      )

      if (!response.ok) {
        console.error('[Parent Mode Service] Failed to get data:', await response.text())

        // Fall back to localStorage
        const localData = localStorage.getItem('tiko_parent_mode_data')
        if (localData) {
          const parsed = JSON.parse(localData)
          if (parsed.user_id === userId) {
            return parsed
          }
        }
        return null
      }

      const results = await response.json()
      if (results.length === 0) {
        return null
      }

      const row = results[0]
      const data: ParentModeData = {
        user_id: userId,
        parent_pin_hash: row.parent_pin_hash,
        parent_mode_enabled: row.parent_mode_enabled || false,
        parent_mode_settings: row.parent_mode_settings || {
          sessionTimeoutMinutes: 30,
          showVisualIndicator: true,
          autoLockOnAppSwitch: true,
          requirePinForSettings: true
        }
      }

      return data
    } catch (error) {
      console.error('[Parent Mode Service] Error getting data:', error)

      // Fall back to localStorage
      const localData = localStorage.getItem('tiko_parent_mode_data')
      if (localData) {
        try {
          const parsed = JSON.parse(localData)
          if (parsed.user_id === userId) {
            return parsed
          }
        } catch {}
      }

      return null
    }
  }

  async updateSettings(userId: string, settings: Partial<ParentModeSettings>): Promise<ParentModeResult> {
    try {
      const existingData = await this.getData(userId)
      if (!existingData) {
        return { success: false, error: 'Parent mode not enabled' }
      }

      const updatedSettings = {
        ...existingData.parent_mode_settings,
        ...settings
      }

      const response = await this.makeRequest(
        `/user_profiles?user_id=eq.${userId}`,
        'PATCH',
        {
          parent_mode_settings: updatedSettings
        }
      )

      if (!response.ok) {
        console.error('[Parent Mode Service] Failed to update settings:', await response.text())
        return { success: false, error: 'Failed to update settings' }
      }

      const updatedData: ParentModeData = {
        ...existingData,
        parent_mode_settings: updatedSettings
      }

      // Update localStorage backup
      localStorage.setItem('tiko_parent_mode_data', JSON.stringify(updatedData))

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
      const verifyResult = await this.verifyPin(userId, oldPin)
      if (!verifyResult.success) {
        return { success: false, error: verifyResult.error }
      }

      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        return { success: false, error: 'New PIN must be exactly 4 digits' }
      }

      const newPinHash = await this.hashPin(newPin)

      const response = await this.makeRequest(
        `/user_profiles?user_id=eq.${userId}`,
        'PATCH',
        {
          parent_pin_hash: newPinHash
        }
      )

      if (!response.ok) {
        console.error('[Parent Mode Service] Failed to change PIN:', await response.text())
        return { success: false, error: 'Failed to change PIN' }
      }

      const existingData = await this.getData(userId)
      if (existingData) {
        const updatedData: ParentModeData = {
          ...existingData,
          parent_pin_hash: newPinHash
        }

        // Update localStorage backup
        localStorage.setItem('tiko_parent_mode_data', JSON.stringify(updatedData))

        console.log('[Parent Mode Service] Changed PIN for user:', userId)
        return { success: true, data: updatedData }
      }

      return { success: true }
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
