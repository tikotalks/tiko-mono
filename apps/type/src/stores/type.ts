import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAppStore } from '@tiko/core'

export interface TypeSettings {
  voice: string | null
  rate: number // 0.1 to 10
  pitch: number // 0 to 2
  volume: number // 0 to 1
  autoSave: boolean
  historyLimit: number
  hapticFeedback: boolean
  speakOnType: boolean
  keyboardTheme: string
  keyboardLayout: string
  funLetters: boolean
}

export interface TypeHistory {
  id: string
  text: string
  timestamp: number
  voice?: string
}

export const useTypeStore = defineStore('type', () => {
  const appStore = useAppStore()
  
  // State
  const currentText = ref<string>('')
  const isSpeaking = ref<boolean>(false)
  const isLoading = ref<boolean>(false)
  const availableVoices = ref<SpeechSynthesisVoice[]>([])
  const history = ref<TypeHistory[]>([])
  const selectedVoice = ref<SpeechSynthesisVoice | null>(null)

  // Settings with defaults
  const defaultSettings: TypeSettings = {
    voice: null,
    rate: 1,
    pitch: 1,
    volume: 1,
    autoSave: true,
    historyLimit: 50,
    hapticFeedback: true,
    speakOnType: false,
    keyboardTheme: 'default',
    keyboardLayout: 'qwerty',
    funLetters: false
  }

  // Speech synthesis reference
  let currentUtterance: SpeechSynthesisUtterance | null = null

  // Getters
  const settings = computed((): TypeSettings => {
    const appSettings = appStore.getAppSettings('type')
    return { ...defaultSettings, ...appSettings }
  })

  const canSpeak = computed(() => {
    return currentText.value.trim().length > 0 && !isSpeaking.value
  })

  const hasVoices = computed(() => {
    return availableVoices.value.length > 0
  })

  const recentHistory = computed(() => {
    return history.value
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, settings.value.historyLimit)
  })

  // Actions
  const loadVoices = () => {
    isLoading.value = true
    
    const updateVoices = () => {
      const voices = speechSynthesis.getVoices()
      availableVoices.value = voices
      
      // Set default voice if none selected
      if (!selectedVoice.value && voices.length > 0) {
        // Try to find a good default voice (English, if available)
        const englishVoice = voices.find(voice => voice.lang.startsWith('en'))
        selectedVoice.value = englishVoice || voices[0]
      }
      
      isLoading.value = false
    }

    // Voices might not be immediately available
    if (speechSynthesis.getVoices().length > 0) {
      updateVoices()
    } else {
      speechSynthesis.addEventListener('voiceschanged', updateVoices, { once: true })
      // Fallback timeout
      setTimeout(updateVoices, 1000)
    }
  }

  const speak = (text?: string) => {
    if (isSpeaking.value) {
      stop()
      return
    }

    const textToSpeak = text || currentText.value.trim()
    if (!textToSpeak) return

    try {
      currentUtterance = new SpeechSynthesisUtterance(textToSpeak)
      
      // Apply settings
      const currentSettings = settings.value
      if (selectedVoice.value) {
        currentUtterance.voice = selectedVoice.value
      }
      currentUtterance.rate = currentSettings.rate
      currentUtterance.pitch = currentSettings.pitch
      currentUtterance.volume = currentSettings.volume

      // Event handlers
      currentUtterance.onstart = () => {
        isSpeaking.value = true
      }

      currentUtterance.onend = () => {
        isSpeaking.value = false
        currentUtterance = null
      }

      currentUtterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error)
        isSpeaking.value = false
        currentUtterance = null
      }

      // Speak
      speechSynthesis.speak(currentUtterance)

      // Save to history if enabled
      if (currentSettings.autoSave && textToSpeak !== currentText.value) {
        addToHistory(textToSpeak)
      }
    } catch (error) {
      console.error('Error speaking text:', error)
      isSpeaking.value = false
    }
  }

  const stop = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel()
    }
    isSpeaking.value = false
    currentUtterance = null
  }

  const pause = () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause()
    }
  }

  const resume = () => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume()
    }
  }

  const setText = (text: string) => {
    currentText.value = text
  }

  const clearText = () => {
    currentText.value = ''
  }

  const appendText = (text: string) => {
    currentText.value += text
  }

  const setVoice = (voice: SpeechSynthesisVoice | null) => {
    selectedVoice.value = voice
    if (voice) {
      updateSettings({ voice: voice.name })
    }
  }

  const addToHistory = (text: string) => {
    const historyItem: TypeHistory = {
      id: crypto.randomUUID(),
      text,
      timestamp: Date.now(),
      voice: selectedVoice.value?.name
    }

    history.value.unshift(historyItem)
    
    // Limit history size
    const limit = settings.value.historyLimit
    if (history.value.length > limit) {
      history.value = history.value.slice(0, limit)
    }

    saveHistory()
  }

  const removeFromHistory = (id: string) => {
    history.value = history.value.filter(item => item.id !== id)
    saveHistory()
  }

  const clearHistory = () => {
    history.value = []
    saveHistory()
  }

  const speakFromHistory = (historyItem: TypeHistory) => {
    currentText.value = historyItem.text
    speak()
  }

  const updateSettings = async (newSettings: Partial<TypeSettings>) => {
    const currentSettings = settings.value
    const updatedSettings = { ...currentSettings, ...newSettings }
    
    await appStore.updateAppSettings('type', updatedSettings)
  }

  const saveHistory = async () => {
    await appStore.updateAppSettings('type', {
      ...settings.value,
      history: history.value
    })
  }

  const loadState = async () => {
    await appStore.loadAppSettings('type')
    
    const appSettings = appStore.getAppSettings('type')
    if (appSettings.history && Array.isArray(appSettings.history)) {
      history.value = appSettings.history
    }
    
    // Load voices
    loadVoices()
  }

  // Cleanup
  const cleanup = () => {
    stop()
  }

  return {
    // State
    currentText,
    isSpeaking,
    isLoading,
    availableVoices,
    history,
    selectedVoice,
    
    // Getters
    settings,
    canSpeak,
    hasVoices,
    recentHistory,
    
    // Actions
    loadVoices,
    speak,
    stop,
    pause,
    resume,
    setText,
    clearText,
    appendText,
    setVoice,
    addToHistory,
    removeFromHistory,
    clearHistory,
    speakFromHistory,
    updateSettings,
    loadState,
    cleanup
  }
})