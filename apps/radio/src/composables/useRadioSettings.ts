/**
 * Composable for managing radio app settings and sleep timer
 * Delegates to the radio store for state management
 */

import { storeToRefs } from 'pinia'
import { useRadioStore } from '../stores/radio'

/**
 * Radio settings management composable
 *
 * Provides a convenient interface to the radio store for
 * settings persistence and sleep timer functionality.
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
  const store = useRadioStore()

  // Extract refs from store
  const { settings, loading, error, sleepTimer, isInitialized, sleepTimerRemaining } =
    storeToRefs(store)

  // Delegate methods to store
  const {
    updateSettings,
    loadState: loadSettings,
    resetSettings,
    setSleepTimer,
    cancelSleepTimer,
    checkSleepTimer,
    toggleShuffle,
    toggleRepeat,
  } = store

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
    toggleRepeat,
  }
}
