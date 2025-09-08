import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAppStore, useAuthStore } from '@tiko/core'
import type { RadioSettings, SleepTimer } from '../types/radio.types'

export const useRadioStore = defineStore('radio', () => {
  const appStore = useAppStore()
  const authStore = useAuthStore()

  // Default settings
  const defaultSettings: RadioSettings = {
    autoplayNext: true,
    showTitles: true,
    defaultVolume: 0.8,
    sleepTimerMinutes: 30,
    shuffleMode: false,
    repeatMode: 'none',
  }

  // State
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Sleep timer state
  const sleepTimer = ref<SleepTimer>({
    enabled: false,
    minutes: 30,
    startTime: null,
    endTime: null,
  })

  // Computed settings - merge defaults with stored settings
  const settings = computed<RadioSettings>(() => {
    const storedSettings = appStore.getAppSettings('radio')
    return { ...defaultSettings, ...storedSettings }
  })

  // Computed
  const isInitialized = computed(() => settings.value !== null)

  const sleepTimerRemaining = computed(() => {
    if (!sleepTimer.value.enabled || !sleepTimer.value.endTime) {
      return 0
    }

    const now = Date.now()
    const remaining = sleepTimer.value.endTime - now
    return Math.max(0, Math.floor(remaining / 1000 / 60))
  })

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
      await appStore.updateAppSettings('radio', newSettings)
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
   * Load state from storage
   */
  const loadState = async (): Promise<void> => {
    if (!authStore.user) {
      console.warn('No authenticated user, using default settings')
      return
    }

    loading.value = true
    error.value = null

    try {
      await appStore.loadAppSettings('radio')
    } catch (err) {
      console.error('Failed to load radio settings:', err)
      error.value = 'Failed to load settings'
    } finally {
      loading.value = false
    }
  }

  /**
   * Save current state
   */
  const saveState = async (): Promise<void> => {
    await updateSettings({})
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
        endTime: null,
      }
      return
    }

    const now = Date.now()
    sleepTimer.value = {
      enabled: true,
      minutes,
      startTime: now,
      endTime: now + minutes * 60 * 1000,
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
      endTime: null,
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
    updateSettings,
    loadState,
    saveState,
    resetSettings,
    setSleepTimer,
    cancelSleepTimer,
    checkSleepTimer,
    toggleShuffle,
    toggleRepeat,
  }
})
