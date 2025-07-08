/**
 * Composable for managing radio app settings and sleep timer
 * Handles user preferences, sleep timer, and app configuration
 */

import { ref, computed } from 'vue'
import { useAuthStore, supabase } from '@tiko/core'
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
  const sleepTimer = ref<SleepTimer>({
    isActive: false,
    remainingMinutes: 0,
    endTime: null
  })

  // Sleep timer interval
  let sleepTimerInterval: NodeJS.Timeout | null = null

  // Computed
  const isLoaded = computed(() => !loading.value && !error.value)

  /**
   * Load settings from Supabase
   */
  const loadSettings = async (): Promise<void> => {
    console.log('Loading radio settings for user:', authStore.user?.id)
    
    if (!authStore.user) {
      error.value = 'User not authenticated'
      console.error('No authenticated user found')
      return
    }

    loading.value = true
    error.value = null

    try {
      console.log('Attempting to fetch radio settings from Supabase...')
      const { data, error: fetchError } = await supabase
        .from('radio_settings')
        .select('*')
        .eq('user_id', authStore.user.id)
        .single()
      
      console.log('Supabase response:', { data, error: fetchError })

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No settings found, create default
          await createDefaultSettings()
        } else {
          throw fetchError
        }
      } else {
        settings.value = transformFromRow(data)
      }
    } catch (err) {
      console.error('Failed to load radio settings:', err)
      error.value = 'Failed to load settings'
      // Use default settings on error
      settings.value = { ...defaultSettings }
    } finally {
      loading.value = false
    }
  }

  /**
   * Update settings in Supabase
   */
  const updateSettings = async (newSettings: Partial<RadioSettings>): Promise<boolean> => {
    if (!authStore.user) {
      error.value = 'User not authenticated'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const payload = transformToPayload({ ...settings.value, ...newSettings })

      const { error: updateError } = await supabase
        .from('radio_settings')
        .update(payload)
        .eq('user_id', authStore.user.id)

      if (updateError) {
        throw updateError
      }

      // Update local state
      settings.value = { ...settings.value, ...newSettings }
      
      return true
    } catch (err) {
      console.error('Failed to update radio settings:', err)
      error.value = 'Failed to save settings'
      return false
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
      const payload = { 
        user_id: authStore.user.id,
        ...transformToPayload(defaultSettings) 
      }
      
      console.log('Creating default settings with payload:', payload)

      const { error: insertError } = await supabase
        .from('radio_settings')
        .insert([payload])

      if (insertError) {
        throw insertError
      }

      settings.value = { ...defaultSettings }
    } catch (err) {
      console.error('Failed to create default settings:', err)
      // Don't throw, just use defaults locally
      settings.value = { ...defaultSettings }
    }
  }

  /**
   * Reset settings to defaults
   */
  const resetToDefaults = async (): Promise<boolean> => {
    return await updateSettings(defaultSettings)
  }

  /**
   * Toggle shuffle mode
   */
  const toggleShuffle = async (): Promise<void> => {
    await updateSettings({ shuffleMode: !settings.value.shuffleMode })
  }

  /**
   * Toggle repeat mode (none -> one -> all -> none)
   */
  const toggleRepeat = async (): Promise<void> => {
    let nextMode: RadioSettings['repeatMode']
    
    switch (settings.value.repeatMode) {
      case 'none':
        nextMode = 'one'
        break
      case 'one':
        nextMode = 'all'
        break
      case 'all':
        nextMode = 'none'
        break
      default:
        nextMode = 'none'
    }

    await updateSettings({ repeatMode: nextMode })
  }

  /**
   * Set sleep timer
   */
  const setSleepTimer = (minutes: number): void => {
    if (minutes <= 0) {
      cancelSleepTimer()
      return
    }

    const endTime = new Date()
    endTime.setMinutes(endTime.getMinutes() + minutes)

    sleepTimer.value = {
      isActive: true,
      remainingMinutes: minutes,
      endTime
    }

    // Start countdown
    startSleepTimerCountdown()
  }

  /**
   * Cancel sleep timer
   */
  const cancelSleepTimer = (): void => {
    sleepTimer.value = {
      isActive: false,
      remainingMinutes: 0,
      endTime: null
    }

    if (sleepTimerInterval) {
      clearInterval(sleepTimerInterval)
      sleepTimerInterval = null
    }
  }

  /**
   * Start sleep timer countdown
   */
  const startSleepTimerCountdown = (): void => {
    if (sleepTimerInterval) {
      clearInterval(sleepTimerInterval)
    }

    sleepTimerInterval = setInterval(() => {
      if (!sleepTimer.value.isActive || !sleepTimer.value.endTime) {
        return
      }

      const now = new Date()
      const remaining = sleepTimer.value.endTime.getTime() - now.getTime()

      if (remaining <= 0) {
        // Timer expired
        cancelSleepTimer()
        // Emit sleep timer expired event or pause playback
        document.dispatchEvent(new CustomEvent('radio:sleep-timer-expired'))
      } else {
        sleepTimer.value.remainingMinutes = Math.ceil(remaining / (1000 * 60))
      }
    }, 1000)
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

  /**
   * Update volume setting
   */
  const updateVolume = async (volume: number): Promise<void> => {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    await updateSettings({ defaultVolume: clampedVolume })
  }

  /**
   * Quick toggle for autoplay
   */
  const toggleAutoplay = async (): Promise<void> => {
    await updateSettings({ autoplayNext: !settings.value.autoplayNext })
  }

  /**
   * Quick toggle for show titles
   */
  const toggleShowTitles = async (): Promise<void> => {
    await updateSettings({ showTitles: !settings.value.showTitles })
  }

  /**
   * Set sleep timer to preset values
   */
  const setPresetSleepTimer = (preset: 15 | 30 | 60 | 90): void => {
    setSleepTimer(preset)
  }

  // Cleanup on unmount
  const cleanup = (): void => {
    if (sleepTimerInterval) {
      clearInterval(sleepTimerInterval)
      sleepTimerInterval = null
    }
  }

  return {
    // State
    settings,
    loading,
    error,
    sleepTimer,
    
    // Computed
    isLoaded,
    
    // Actions
    loadSettings,
    updateSettings,
    resetToDefaults,
    toggleShuffle,
    toggleRepeat,
    updateVolume,
    toggleAutoplay,
    toggleShowTitles,
    
    // Sleep timer
    setSleepTimer,
    cancelSleepTimer,
    setPresetSleepTimer,
    
    // Cleanup
    cleanup
  }
}