import { storeToRefs } from 'pinia'
import { useTimerStore } from '../stores/timer'

/**
 * Timer composable that delegates to the timer store
 * 
 * Provides a convenient interface to the timer store for
 * timer functionality and settings management.
 * 
 * @returns Timer interface with state and methods
 * 
 * @example
 * const timer = useTimer()
 * 
 * // Start the timer
 * timer.start()
 * 
 * // Update settings
 * await timer.updateSettings({ soundEnabled: false })
 */
export function useTimer() {
  const store = useTimerStore()
  
  // Extract refs from store
  const {
    currentTime,
    targetTime,
    mode,
    isRunning,
    hasExpired,
    settings,
    displayTime,
    progress,
    isExpired,
    timeLeft,
    formattedTime
  } = storeToRefs(store)

  // Delegate methods to store
  const {
    start,
    pause,
    reset,
    expire,
    setMode,
    toggleMode,
    setTime,
    updateSettings,
    loadState,
    saveState
  } = store

  return {
    // State
    currentTime,
    targetTime,
    mode,
    isRunning,
    hasExpired,
    isExpired,
    settings,
    timeLeft,

    // Computed
    displayTime,
    progress,
    formattedTime,

    // Actions
    start,
    pause,
    reset,
    expire,
    setMode,
    toggleMode,
    setTime,
    updateSettings,
    loadState,
    saveState
  }
}