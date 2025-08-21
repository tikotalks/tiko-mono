/**
 * Composable for managing radio app settings and sleep timer
 * Handles user preferences, sleep timer, and app configuration
 */

import { ref, computed } from 'vue'
import { useAuthStore, userSettingsService } from '@tiko/core'
import type { 
  RadioSettings, 
  RadioSettingsPayload, 
  RadioSettingsRow,
  SleepTimer 
} from '../types/radio.types'

/**
 * Radio settings management composable
 * 
 * Provides settings persistence, sleep timer functionality,
 * and user preference management for the radio app.
 * 
 * @returns Radio settings interface with configuration methods
 * 
 * @example
 * const settings = useRadioSettings()
 * 
 * // Load user settings
 * await settings.loadSettings()
 * 
 * // Update settings
 * await settings.updateSettings({
 *   autoplayNext: true,
 *   defaultVolume: 0.8
 * })
 * 
 * // Set sleep timer
 * settings.setSleepTimer(30) // 30 minutes
 */
export function useRadioSettings() {
  const authStore = useAuthStore()

  // Default settings
  const defaultSettings: RadioSettings = {
    autoplayNext: true,
    showTitles: true,
    defaultVolume: 0.8,
    sleepTimerMinutes: 30,
    shuffleMode: false,
    repeatMode: 'none'
  }

  // State
  const settings = ref<RadioSettings>({ ...defaultSettings })
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Sleep timer state
  const sleepTimer = ref<SleepTimer>({
    enabled: false,
    minutes: 30,
    startTime: null,
    endTime: null
  })

  // Computed
  const isInitialized = computed(() => 
    settings.value !== null
  )

  const sleepTimerRemaining = computed(() => {
    if (!sleepTimer.value.enabled || !sleepTimer.value.endTime) {
      return 0
    }

    const now = Date.now()
    const remaining = sleepTimer.value.endTime - now
    return Math.max(0, Math.floor(remaining / 1000 / 60))
  })

  /**
   * Load settings from database or create defaults
   */
  const loadSettings = async (): Promise<void> => {
    if (!authStore.user) {
      console.warn('No authenticated user, using default settings')
      return
    }

    loading.value = true
    error.value = null

    try {
      // Get settings from userSettingsService
      const savedSettings = await userSettingsService.getSettings('radio')
      
      if (savedSettings && savedSettings.settings) {
        // Merge saved settings with defaults
        settings.value = { ...defaultSettings, ...savedSettings.settings } as RadioSettings
      } else {
        // Create default settings for new user
        await createDefaultSettings()
      }
    } catch (err) {
      console.error('Failed to load radio settings:', err)
      error.value = 'Failed to load settings'
      // Use defaults on error
      settings.value = { ...defaultSettings }
    } finally {
      loading.value = false
    }
  }

  /**
   * Create default settings for new user
   */
  const createDefaultSettings = async (): Promise<void> => {
    if (!authStore.user) return

    try {
      await userSettingsService.updateSettings('radio', defaultSettings)
      settings.value = { ...defaultSettings }
    } catch (err) {
      console.error('Failed to create default settings:', err)
      throw err
    }
  }

  /**
   * Update settings
   */
  const updateSettings = async (updates: Partial<RadioSettings>): Promise<boolean> => {
    if (!authStore.user) {
      error.value = 'User not authenticated'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const newSettings = { ...settings.value, ...updates }
      
      await userSettingsService.updateSettings('radio', newSettings)
      
      settings.value = newSettings
      return true
    } catch (err) {
      console.error('Failed to update settings:', err)
      error.value = 'Failed to update settings'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Reset settings to defaults
   */
  const resetSettings = async (): Promise<boolean> => {
    return await updateSettings(defaultSettings)
  }

  /**
   * Set sleep timer
   */
  const setSleepTimer = (minutes: number | null): void => {
    if (!minutes || minutes <= 0) {
      // Disable timer
      sleepTimer.value = {
        enabled: false,
        minutes: 30,
        startTime: null,
        endTime: null
      }
      return
    }

    const now = Date.now()
    sleepTimer.value = {
      enabled: true,
      minutes,
      startTime: now,
      endTime: now + (minutes * 60 * 1000)
    }
  }

  /**
   * Cancel sleep timer
   */
  const cancelSleepTimer = (): void => {
    sleepTimer.value = {
      enabled: false,
      minutes: sleepTimer.value.minutes,
      startTime: null,
      endTime: null
    }
  }

  /**
   * Check if sleep timer has expired
   */
  const checkSleepTimer = (): boolean => {
    if (!sleepTimer.value.enabled || !sleepTimer.value.endTime) {
      return false
    }

    return Date.now() >= sleepTimer.value.endTime
  }

  /**
   * Toggle shuffle mode
   */
  const toggleShuffle = async (): Promise<void> => {
    await updateSettings({ shuffleMode: !settings.value.shuffleMode })
  }

  /**
   * Toggle repeat mode between none -> one -> all -> none
   */
  const toggleRepeat = async (): Promise<void> => {
    const modes: RadioSettings['repeatMode'][] = ['none', 'one', 'all']
    const currentIndex = modes.indexOf(settings.value.repeatMode)
    const nextIndex = (currentIndex + 1) % modes.length
    await updateSettings({ repeatMode: modes[nextIndex] })
  }

  /**
   * Transform database row to RadioSettings
   */
  const transformFromRow = (row: RadioSettingsRow): RadioSettings => ({
    autoplayNext: row.autoplay_next,
    showTitles: row.show_titles,
    defaultVolume: row.default_volume,
    sleepTimerMinutes: row.sleep_timer_minutes,
    shuffleMode: row.shuffle_mode,
    repeatMode: row.repeat_mode as RadioSettings['repeatMode']
  })

  /**
   * Transform RadioSettings to database payload
   */
  const transformToPayload = (settings: RadioSettings): RadioSettingsPayload => ({
    autoplay_next: settings.autoplayNext,
    show_titles: settings.showTitles,
    default_volume: settings.defaultVolume,
    sleep_timer_minutes: settings.sleepTimerMinutes,
    shuffle_mode: settings.shuffleMode,
    repeat_mode: settings.repeatMode
  })

  return {
    // State
    settings,
    loading,
    error,
    sleepTimer,

    // Computed
    isInitialized,
    sleepTimerRemaining,

    // Actions
    loadSettings,
    updateSettings,
    resetSettings,
    setSleepTimer,
    cancelSleepTimer,
    checkSleepTimer,
    toggleShuffle,
    toggleRepeat
  }
}