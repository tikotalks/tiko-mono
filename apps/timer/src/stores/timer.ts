import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAppStore } from '@tiko/core'

export interface TimerSettings {
  soundEnabled: boolean
  vibrationEnabled: boolean
  defaultTime: number // in seconds
}

export const useTimerStore = defineStore('timer', () => {
  const appStore = useAppStore()
  
  // State
  const currentTime = ref<number>(0) // seconds
  const targetTime = ref<number>(300) // 5 minutes default
  const mode = ref<'up' | 'down'>('down')
  const isRunning = ref(false)
  const hasExpired = ref(false)
  const startTime = ref<number>(0)
  const pausedTime = ref<number>(0)

  // Settings with defaults
  const defaultSettings: TimerSettings = {
    soundEnabled: true,
    vibrationEnabled: true,
    defaultTime: 300 // 5 minutes
  }

  // Getters
  const settings = computed((): TimerSettings => {
    const appSettings = appStore.getAppSettings('timer')
    return { ...defaultSettings, ...appSettings }
  })

  const displayTime = computed(() => {
    const time = mode.value === 'down' ? Math.max(0, targetTime.value - currentTime.value) : currentTime.value
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  const progress = computed(() => {
    if (mode.value === 'down') {
      return targetTime.value > 0 ? (currentTime.value / targetTime.value) * 100 : 0
    } else {
      // For count up, we'll show progress based on a reasonable max (like 1 hour)
      const maxTime = Math.max(targetTime.value, 3600) // 1 hour or target time
      return (currentTime.value / maxTime) * 100
    }
  })

  const isExpired = computed(() => {
    return mode.value === 'down' && currentTime.value >= targetTime.value
  })

  const timeLeft = computed(() => {
    if (mode.value === 'down') {
      return Math.max(0, targetTime.value - currentTime.value)
    }
    return 0
  })

  const formattedTime = computed(() => {
    const time = mode.value === 'down' ? Math.max(0, targetTime.value - currentTime.value) : currentTime.value
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  // Timer interval reference
  let timerInterval: number | null = null

  // Actions
  const start = () => {
    if (isRunning.value) return

    isRunning.value = true
    hasExpired.value = false
    startTime.value = performance.now() - (pausedTime.value * 1000)

    timerInterval = window.setInterval(() => {
      const elapsed = Math.floor((performance.now() - startTime.value) / 1000)
      currentTime.value = pausedTime.value + elapsed

      // Check for expiration
      if (mode.value === 'down' && currentTime.value >= targetTime.value) {
        currentTime.value = targetTime.value
        expire()
      }
    }, 100) // Update every 100ms for smooth progress
  }

  const pause = () => {
    if (!isRunning.value) return

    isRunning.value = false
    pausedTime.value = currentTime.value

    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  const reset = () => {
    pause()
    currentTime.value = 0
    pausedTime.value = 0
    hasExpired.value = false
  }

  const expire = () => {
    pause()
    hasExpired.value = true

    // Play sound if enabled
    if (settings.value.soundEnabled) {
      playExpiredSound()
    }

    // Vibrate if enabled
    if (settings.value.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200])
    }
  }

  const playExpiredSound = () => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 1)
    } catch (error) {
      console.warn('Could not play timer sound:', error)
    }
  }

  const setTime = (minutes: number, seconds: number = 0) => {
    const totalSeconds = minutes * 60 + seconds
    targetTime.value = Math.max(1, totalSeconds) // Minimum 1 second
    reset()
  }

  const setMode = (newMode: 'up' | 'down') => {
    mode.value = newMode
    reset()
  }

  const toggleMode = () => {
    setMode(mode.value === 'up' ? 'down' : 'up')
  }

  const updateSettings = async (newSettings: Partial<TimerSettings>) => {
    const currentSettings = settings.value
    const updatedSettings = { ...currentSettings, ...newSettings }
    
    await appStore.updateAppSettings('timer', updatedSettings)
  }

  const saveState = async () => {
    await appStore.updateAppSettings('timer', {
      ...settings.value,
      targetTime: targetTime.value,
      mode: mode.value
    })
  }

  const loadState = async () => {
    await appStore.loadAppSettings('timer')
    
    const appSettings = appStore.getAppSettings('timer')
    if (appSettings.targetTime) {
      targetTime.value = appSettings.targetTime
    }
    if (appSettings.mode) {
      mode.value = appSettings.mode
    }
  }

  // Cleanup
  const cleanup = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  return {
    // State
    currentTime,
    targetTime,
    mode,
    isRunning,
    hasExpired,
    
    // Getters
    settings,
    displayTime,
    progress,
    isExpired,
    timeLeft,
    formattedTime,
    
    // Actions
    start,
    pause,
    reset,
    expire,
    setTime,
    setMode,
    toggleMode,
    updateSettings,
    saveState,
    loadState,
    cleanup
  }
})