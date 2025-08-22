/**
 * Supabase User Settings Service Implementation
 *
 * @module services/user-settings-supabase
 * @description
 * User settings service that stores data in Supabase database.
 * This implementation makes direct API calls to bypass the broken SDK.
 *
 * @example
 * ```typescript
 * // To use this instead of localStorage implementation:
 * import { SupabaseUserSettingsService } from './user-settings-supabase.service'
 * export const userSettingsService = new SupabaseUserSettingsService()
 * ```
 */

import type { UserSettingsService, UserSettings, UserSettingsResult } from './user-settings.service'

/**
 * Supabase implementation of user settings service
 * Uses direct API calls to bypass the broken Supabase SDK
 */
export class SupabaseUserSettingsService implements UserSettingsService {
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

  async getSettings(userId: string, appName: string): Promise<UserSettings | null> {
    try {
      const response = await this.makeRequest(
        `/user_settings?user_id=eq.${userId}&app_name=eq.${appName}`
      )

      if (!response.ok) {
        console.error(`[User Settings Service] Failed to get settings for ${appName}:`, await response.text())

        // Fall back to localStorage
        const storageKey = `tiko_user_settings_${userId}_${appName}`
        const localData = localStorage.getItem(storageKey)
        if (localData) {
          return JSON.parse(localData)
        }
        return null
      }

      const results = await response.json()
      if (results.length === 0) {
        return null
      }

      const data = results[0] as UserSettings
      console.log(`[User Settings Service] Retrieved settings for ${appName}:`, data)

      // Cache in localStorage
      const storageKey = `tiko_user_settings_${userId}_${appName}`
      localStorage.setItem(storageKey, JSON.stringify(data))

      return data
    } catch (error) {
      console.error(`[User Settings Service] Error getting settings for ${appName}:`, error)

      // Fall back to localStorage
      const storageKey = `tiko_user_settings_${userId}_${appName}`
      const localData = localStorage.getItem(storageKey)
      if (localData) {
        try {
          return JSON.parse(localData)
        } catch {}
      }

      return null
    }
  }

  async saveSettings(userId: string, appName: string, settings: Record<string, any>): Promise<UserSettingsResult> {
    try {
      const now = new Date().toISOString()

      // First try to update existing
      const existingResponse = await this.makeRequest(
        `/user_settings?user_id=eq.${userId}&app_name=eq.${appName}`,
        'PATCH',
        {
          settings,
          updated_at: now
        }
      )

      let data: UserSettings

      if (existingResponse.status === 404 || (await existingResponse.json()).length === 0) {
        // Create new record
        const createResponse = await this.makeRequest('/user_settings', 'POST', {
          user_id: userId,
          app_name: appName,
          settings,
          created_at: now,
          updated_at: now
        })

        if (!createResponse.ok) {
          console.error(`[User Settings Service] Failed to create settings for ${appName}:`, await createResponse.text())
          return { success: false, error: 'Failed to save settings' }
        }

        const created = await createResponse.json()
        data = created[0] || created
      } else if (existingResponse.ok) {
        const updated = await existingResponse.json()
        data = updated[0] || updated
      } else {
        console.error(`[User Settings Service] Failed to save settings for ${appName}:`, await existingResponse.text())
        return { success: false, error: 'Failed to save settings' }
      }

      // Cache in localStorage
      const storageKey = `tiko_user_settings_${userId}_${appName}`
      localStorage.setItem(storageKey, JSON.stringify(data))

      console.log(`[User Settings Service] Saved settings for ${appName}:`, data)
      return { success: true, data }
    } catch (error) {
      console.error(`[User Settings Service] Error saving settings for ${appName}:`, error)

      // Fall back to localStorage only
      const now = new Date().toISOString()
      const data: UserSettings = {
        id: `${userId}_${appName}`,
        user_id: userId,
        app_name: appName,
        settings,
        created_at: now,
        updated_at: now
      }

      const storageKey = `tiko_user_settings_${userId}_${appName}`
      localStorage.setItem(storageKey, JSON.stringify(data))

      return { success: true, data }
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
      const response = await this.makeRequest(
        `/user_settings?user_id=eq.${userId}&app_name=eq.${appName}`,
        'DELETE'
      )

      if (!response.ok) {
        console.error(`[User Settings Service] Failed to delete settings for ${appName}:`, await response.text())
        return { success: false, error: 'Failed to delete settings' }
      }

      // Remove from localStorage
      const storageKey = `tiko_user_settings_${userId}_${appName}`
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
      const response = await this.makeRequest(
        `/user_settings?user_id=eq.${userId}`
      )

      if (!response.ok) {
        console.error(`[User Settings Service] Failed to get all settings for user:`, await response.text())

        // Fall back to localStorage
        return this.getAllFromLocalStorage(userId)
      }

      const results = await response.json() as UserSettings[]
      console.log(`[User Settings Service] Retrieved all settings for user ${userId}:`, results)

      // Cache each in localStorage
      results.forEach(settings => {
        const storageKey = `tiko_user_settings_${userId}_${settings.app_name}`
        localStorage.setItem(storageKey, JSON.stringify(settings))
      })

      return results
    } catch (error) {
      console.error(`[User Settings Service] Error getting all settings for user ${userId}:`, error)
      return this.getAllFromLocalStorage(userId)
    }
  }

  async deleteAllUserSettings(userId: string): Promise<UserSettingsResult> {
    try {
      const response = await this.makeRequest(
        `/user_settings?user_id=eq.${userId}`,
        'DELETE'
      )

      if (!response.ok) {
        console.error(`[User Settings Service] Failed to delete all settings:`, await response.text())
        return { success: false, error: 'Failed to delete all settings' }
      }

      // Clear all from localStorage
      const prefix = `tiko_user_settings_${userId}_`
      const keysToRemove: string[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))

      console.log(`[User Settings Service] Deleted all settings for user ${userId}`)
      return { success: true }
    } catch (error) {
      console.error(`[User Settings Service] Error deleting all settings for user ${userId}:`, error)
      return { success: false, error: 'Failed to delete all settings' }
    }
  }

  /**
   * Helper to get all settings from localStorage
   */
  private getAllFromLocalStorage(userId: string): UserSettings[] {
    const prefix = `tiko_user_settings_${userId}_`
    const settingsArray: UserSettings[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
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
    }

    return settingsArray
  }
}
