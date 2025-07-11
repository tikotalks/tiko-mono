import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface TimerSettings {
  soundEnabled: boolean
  vibrationEnabled: boolean
}

export type TimerMode = 'up' | 'down'

// Create shared state outside of the composable function
const currentTime = ref(0) // seconds
const targetTime = ref(20) // 20 seconds default
const mode = ref<TimerMode>('down')
const isRunning = ref(false)
const isExpired = ref(false)
const timeLeft = ref(targetTime.value)

// Settings
const settings = ref<TimerSettings>({
  soundEnabled: true,
  vibrationEnabled: true
})

// Timer interval
let intervalId: number | null = null

export function useTimer() {

  // Computed
  const displayTime = computed(() => {
    if (mode.value === 'down') {
      const remaining = Math.max(0, targetTime.value - currentTime.value)
      return remaining
    }
    return currentTime.value
  })

  const progress = computed(() => {
    if (mode.value === 'down') {
      return targetTime.value > 0 ? (currentTime.value / targetTime.value) * 100 : 0
    }
    return 0 // No progress for count up
  })

  const formattedTime = computed(() => {
    const time = displayTime.value
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  // Methods
  const start = () => {
    if (isExpired.value) {
      reset()
    }

    isRunning.value = true
    intervalId = window.setInterval(() => {
      currentTime.value += 1
      timeLeft.value = targetTime.value - currentTime.value

      // Check for expiration in countdown mode
      if (mode.value === 'down' && currentTime.value >= targetTime.value) {
        expire()
      }
    }, 1000)
  }

  const pause = () => {
    isRunning.value = false
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  const reset = () => {
    pause()
    currentTime.value = 0
    isExpired.value = false
  }

  const expire = () => {
    pause()
    isExpired.value = true

    // Notifications
    if (settings.value.soundEnabled) {
      playNotificationSound()
    }

    if (settings.value.vibrationEnabled) {
      triggerVibration()
    }
  }

  const setTime = (minutes: number, seconds: number = 0) => {
    if (!isRunning.value) {
      targetTime.value = minutes * 60 + seconds
      timeLeft.value = targetTime.value
      currentTime.value = 0
      isExpired.value = false
    }
  }

  const setMode = (newMode: TimerMode) => {
    if (!isRunning.value) {
      mode.value = newMode
      reset()
    }
  }

  const toggleMode = () => {
    setMode(mode.value === 'up' ? 'down' : 'up')
  }

  const updateSettings = (newSettings: Partial<TimerSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    saveSettings()
  }

  // Utilities
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUdBzmJ0fPTgjEGJXfH8N6QQAoUXrTp66hVFApGn+DyvmUdBzmJ0fPTgjEGJXfH8N6QQAoUXrTp66hVFApGn+DyvmUdBzmJ0fPTgjEGJXfH8N6QQAoUXrTp66hVFApGn+DyvmUdBzmJ0fPTgjEGJXfH8N6QQAoUXrTp66hVFApGn+DyvmUdBzmJ0fPTgjEGJXfH8N6QQAoUXrTp66hVFApGn+DyvmUdBzmJ0fPTgjEGJXfH8N6QQAoUXrTp66hVFApGn+DyvmUdBzmJ0fPTgjEGJXfH8N6QQAoUXrTp66hVFApGn+DyvmUdBzmJ0fPTgjEGJXfH8N6QQAoUXrTp66hVFApGn+DyvmUdBzmJ0fPTgjEGJXfH8N6QQAoUXrTp66hVFApGn+DyvmUdBzmJ0fPTgjEGJXfH8N6QQAoUXrTp66hVFApGn+DyvmUdBzmJ0fPTgjEGJXfH8N6QQAoUXrTp66hVFApGn+DyvmUdBzmJ0fPTgjEG')
      audio.play().catch(() => {
        // Ignore audio play errors (e.g., user hasn't interacted with page)
      })
    } catch (error) {
      console.warn('Could not play notification sound:', error)
    }
  }

  const triggerVibration = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
    }
  }

  const saveSettings = () => {
    try {
      localStorage.setItem('timer-settings', JSON.stringify(settings.value))
    } catch (error) {
      console.warn('Could not save settings:', error)
    }
  }

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('timer-settings')
      if (saved) {
        settings.value = { ...settings.value, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.warn('Could not load settings:', error)
    }
  }

  // Lifecycle
  onMounted(() => {
    loadSettings()
  })

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  })

  return {
    // State
    currentTime,
    timeLeft,
    targetTime,
    mode,
    isRunning,
    isExpired,
    settings,

    // Computed
    displayTime,
    progress,
    formattedTime,

    // Methods
    start,
    pause,
    reset,
    setTime,
    setMode,
    toggleMode,
    updateSettings
  }
}
