/**
 * User Settings Composable
 * 
 * Provides reactive access to user-specific settings for apps
 */
import { ref, Ref, computed } from 'vue'
import { userSettingsService } from '../services/user-settings.service'
import { authService } from '../services'
import type { UserSettings } from '../services/user-settings.service'

export interface UseUserSettingsReturn {
  settings: Ref<Record<string, any>>
  loading: Ref<boolean>
  error: Ref<string | null>
  loadSettings: () => Promise<void>
  saveSettings: (newSettings: Record<string, any>) => Promise<void>
  updateSettings: (partialSettings: Partial<Record<string, any>>) => Promise<void>
  getSetting: <T = any>(key: string, defaultValue?: T) => T
  setSetting: (key: string, value: any) => Promise<void>
}

export function useUserSettings(appName: string): UseUserSettingsReturn {
  const settings = ref<Record<string, any>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Load settings for the current user and app
   */
  const loadSettings = async () => {
    loading.value = true
    error.value = null

    try {
      const session = await authService.getSession()
      if (!session?.user?.id) {
        console.warn('[useUserSettings] No authenticated user, using default settings')
        return
      }

      const userSettings = await userSettingsService.getSettings(session.user.id, appName)
      if (userSettings) {
        settings.value = userSettings.settings
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load settings'
      console.error('[useUserSettings] Error loading settings:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Save complete settings (overwrites existing)
   */
  const saveSettings = async (newSettings: Record<string, any>) => {
    loading.value = true
    error.value = null

    try {
      const session = await authService.getSession()
      if (!session?.user?.id) {
        throw new Error('No authenticated user')
      }

      const result = await userSettingsService.saveSettings(session.user.id, appName, newSettings)
      if (result.success && result.data) {
        settings.value = result.data.settings
      } else {
        throw new Error(result.error || 'Failed to save settings')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save settings'
      console.error('[useUserSettings] Error saving settings:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update settings partially (merges with existing)
   */
  const updateSettings = async (partialSettings: Partial<Record<string, any>>) => {
    loading.value = true
    error.value = null

    try {
      const session = await authService.getSession()
      if (!session?.user?.id) {
        throw new Error('No authenticated user')
      }

      const result = await userSettingsService.updateSettings(session.user.id, appName, partialSettings)
      if (result.success && result.data) {
        settings.value = result.data.settings
      } else {
        throw new Error(result.error || 'Failed to update settings')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update settings'
      console.error('[useUserSettings] Error updating settings:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get a specific setting value with optional default
   */
  const getSetting = <T = any>(key: string, defaultValue?: T): T => {
    return settings.value[key] ?? defaultValue
  }

  /**
   * Set a specific setting value
   */
  const setSetting = async (key: string, value: any) => {
    await updateSettings({ [key]: value })
  }

  return {
    settings,
    loading,
    error,
    loadSettings,
    saveSettings,
    updateSettings,
    getSetting,
    setSetting
  }
}