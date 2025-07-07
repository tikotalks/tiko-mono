import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAppStore } from '@tiko/core'

export interface YesNoSettings {
  buttonSize: 'small' | 'medium' | 'large'
  autoSpeak: boolean
  hapticFeedback: boolean
}

export const useYesNoStore = defineStore('yesno', () => {
  const appStore = useAppStore()
  
  // State
  const currentQuestion = ref<string>('Do you want to play?')
  const questionHistory = ref<string[]>([])
  const isPlaying = ref(false)

  // Settings with defaults
  const defaultSettings: YesNoSettings = {
    buttonSize: 'large',
    autoSpeak: true,
    hapticFeedback: true
  }

  // Getters
  const settings = computed((): YesNoSettings => {
    const appSettings = appStore.getAppSettings('yes-no')
    return { ...defaultSettings, ...appSettings }
  })

  const recentQuestions = computed(() => {
    return questionHistory.value.slice(-5).reverse()
  })

  // Actions
  const setQuestion = async (question: string) => {
    if (!question.trim()) return

    currentQuestion.value = question.trim()
    
    // Add to history if not already present
    if (!questionHistory.value.includes(question.trim())) {
      questionHistory.value.push(question.trim())
      
      // Keep only last 20 questions
      if (questionHistory.value.length > 20) {
        questionHistory.value = questionHistory.value.slice(-20)
      }
      
      // Save to app store
      await saveState()
    }
  }

  const selectQuestion = (question: string) => {
    currentQuestion.value = question
  }

  const speakQuestion = async () => {
    if (!currentQuestion.value || isPlaying.value) return

    isPlaying.value = true

    try {
      // Use Web Speech API if available
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(currentQuestion.value)
        utterance.rate = 0.8
        utterance.pitch = 1.0
        utterance.volume = 1.0
        
        utterance.onend = () => {
          isPlaying.value = false
        }
        
        utterance.onerror = () => {
          isPlaying.value = false
        }

        speechSynthesis.speak(utterance)
      } else {
        // Fallback - just mark as complete
        setTimeout(() => {
          isPlaying.value = false
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to speak question:', error)
      isPlaying.value = false
    }
  }

  const handleAnswer = async (answer: 'yes' | 'no') => {
    // Haptic feedback if enabled
    if (settings.value.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(answer === 'yes' ? [50, 50, 50] : [100])
    }

    // Auto-speak the answer if enabled
    if (settings.value.autoSpeak) {
      await speakAnswer(answer)
    }

    // Could emit events here for analytics
    console.log(`Answer: ${answer} to question: "${currentQuestion.value}"`)
  }

  const speakAnswer = async (answer: 'yes' | 'no') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(answer === 'yes' ? 'Yes!' : 'No!')
      utterance.rate = 0.8
      utterance.pitch = 1.2
      utterance.volume = 1.0
      
      speechSynthesis.speak(utterance)
    }
  }

  const updateSettings = async (newSettings: Partial<YesNoSettings>) => {
    const currentSettings = settings.value
    const updatedSettings = { ...currentSettings, ...newSettings }
    
    await appStore.updateAppSettings('yes-no', updatedSettings)
  }

  const saveState = async () => {
    await appStore.updateAppSettings('yes-no', {
      ...settings.value,
      currentQuestion: currentQuestion.value,
      questionHistory: questionHistory.value
    })
  }

  const loadState = async () => {
    await appStore.loadAppSettings('yes-no')
    
    const appSettings = appStore.getAppSettings('yes-no')
    if (appSettings.currentQuestion) {
      currentQuestion.value = appSettings.currentQuestion
    }
    if (appSettings.questionHistory) {
      questionHistory.value = appSettings.questionHistory
    }
  }

  const clearHistory = async () => {
    questionHistory.value = []
    await saveState()
  }

  return {
    // State
    currentQuestion,
    questionHistory,
    isPlaying,
    
    // Getters
    settings,
    recentQuestions,
    
    // Actions
    setQuestion,
    selectQuestion,
    speakQuestion,
    handleAnswer,
    updateSettings,
    saveState,
    loadState,
    clearHistory
  }
})