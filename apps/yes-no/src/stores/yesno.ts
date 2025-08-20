import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAppStore, useAuthStore, itemService } from '@tiko/core'

export interface YesNoSettings {
  buttonSize: 'small' | 'medium' | 'large'
  buttonStyle: 'hands' | 'icons' | 'text'
  autoSpeak: boolean
  hapticFeedback: boolean
}

export const useYesNoStore = defineStore('yesno', () => {
  const appStore = useAppStore()
  const authStore = useAuthStore()
  
  // State
  const currentQuestion = ref<string>('Do you want to play?')
  const questionHistory = ref<string[]>([]) // This will be populated from Items
  const questionItems = ref<any[]>([]) // Full item objects for advanced features
  const isPlaying = ref(false)

  // Settings with defaults
  const defaultSettings: YesNoSettings = {
    buttonSize: 'large',
    buttonStyle: 'icons',
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

  const recentQuestionItems = computed(() => {
    // Sort with favorites first, then by created date
    return [...questionItems.value].sort((a, b) => {
      // Favorites first
      if (a.is_favorite && !b.is_favorite) return -1
      if (!a.is_favorite && b.is_favorite) return 1
      
      // Then by created date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }).slice(0, 10)
  })

  // Actions
  const setQuestion = async (question: string) => {
    if (!question.trim()) return

    currentQuestion.value = question.trim()
    
    // Save current question to settings
    await saveState()
    
    // Save as an item if not already present
    if (!questionHistory.value.includes(question.trim())) {
      try {
        const userId = authStore.user?.id
        if (!userId) {
          console.log('[YesNoStore] No user ID available - running in skip auth mode')
          // In skip auth mode, just update local history without saving to DB
          questionHistory.value = [question.trim(), ...questionHistory.value].slice(0, 20)
          return
        }
        
        await itemService.createItem(userId, {
          app_name: 'yesno',
          type: 'question',
          name: question.trim(),
          metadata: {
            created_from: 'question_input',
            timestamp: new Date().toISOString()
          }
        })
        
        // Reload questions from items
        await loadQuestionsFromItems()
      } catch (error) {
        console.error('[YesNoStore] Failed to save question as item:', error)
      }
    }
  }

  const selectQuestion = (question: string) => {
    currentQuestion.value = question
  }

  const speakQuestion = async (speakFn?: (text: string, options: any) => Promise<void>) => {
    if (!currentQuestion.value || isPlaying.value) return

    isPlaying.value = true

    try {
      if (speakFn) {
        // Use enhanced TTS function passed from component
        await speakFn(currentQuestion.value, {})
      }
      isPlaying.value = false
    } catch (error) {
      console.error('Failed to speak question:', error)
      isPlaying.value = false
    }
  }

  const handleAnswer = async (answer: 'yes' | 'no', speakFn?: (text: string, options: any) => Promise<void>, translateFn?: (key: string) => string) => {
    // Haptic feedback if enabled
    if (settings.value.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(answer === 'yes' ? [50, 50, 50] : [100])
    }

    // Auto-speak the answer if enabled
    if (settings.value.autoSpeak) {
      await speakAnswer(answer, speakFn, translateFn)
    }

    // Could emit events here for analytics
    console.log(`Answer: ${answer} to question: "${currentQuestion.value}"`)
  }

  const speakAnswer = async (answer: 'yes' | 'no', speakFn?: (text: string, options: any) => Promise<void>, translateFn?: (key: string) => string) => {
    try {
      if (speakFn && translateFn) {
        // Get translated answer
        const translatedAnswer = answer === 'yes' 
          ? translateFn('common.yes') 
          : translateFn('common.no')
        
        // Use enhanced TTS function passed from component
        await speakFn(translatedAnswer, {})
      }
    } catch (error) {
      console.error('Failed to speak answer:', error)
    }
  }

  const speakText = async (text: string, speakFn?: (text: string, options: any) => Promise<void>) => {
    try {
      if (speakFn) {
        // Use enhanced TTS function passed from component
        await speakFn(text, {})
      }
    } catch (error) {
      console.error('Failed to speak text:', error)
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
      currentQuestion: currentQuestion.value
      // questionHistory is now stored in Items, not in settings
    })
  }

  const loadQuestionsFromItems = async () => {
    try {
      const userId = authStore.user?.id
      if (!userId) {
        console.log('[YesNoStore] No user ID available - running in skip auth mode')
        // In skip auth mode, questions are only stored locally
        return
      }
      
      const items = await itemService.getItems(userId, { 
        app_name: 'yesno',
        type: 'question' 
      })
      console.log('[YesNoStore] Loaded questions from items:', items.length)
      
      // Store full items
      questionItems.value = items
      
      // Sort by created_at and get the last 20
      const sortedItems = items.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      
      questionHistory.value = sortedItems.slice(0, 20).map(item => item.name).reverse()
    } catch (error) {
      console.error('[YesNoStore] Failed to load questions from items:', error)
      questionHistory.value = []
      questionItems.value = []
    }
  }

  const loadState = async () => {
    console.log('[YesNoStore] Loading state...')
    await appStore.loadAppSettings('yes-no')
    
    const appSettings = appStore.getAppSettings('yes-no')
    console.log('[YesNoStore] Retrieved settings:', appSettings)
    
    if (appSettings?.currentQuestion) {
      currentQuestion.value = appSettings.currentQuestion
      console.log('[YesNoStore] Loaded question:', appSettings.currentQuestion)
    } else {
      console.log('[YesNoStore] No saved question found, using default')
    }
    
    // Load questions from Items service
    await loadQuestionsFromItems()
  }

  const toggleFavorite = async (itemId: string) => {
    console.log('[YesNoStore] toggleFavorite called for:', itemId)
    try {
      const item = questionItems.value.find(q => q.id === itemId)
      if (!item) {
        console.error('[YesNoStore] Item not found:', itemId)
        return
      }
      
      console.log('[YesNoStore] Toggling favorite from', item.is_favorite, 'to', !item.is_favorite)
      
      const result = await itemService.updateItem(itemId, {
        is_favorite: !item.is_favorite
      })
      
      console.log('[YesNoStore] Update result:', result)
      
      // Reload to reflect changes
      await loadQuestionsFromItems()
    } catch (error) {
      console.error('[YesNoStore] Failed to toggle favorite:', error)
    }
  }

  const deleteQuestion = async (itemId: string) => {
    console.log('[YesNoStore] deleteQuestion called for:', itemId)
    try {
      const result = await itemService.deleteItem(itemId)
      console.log('[YesNoStore] Delete result:', result)
      
      // Reload to reflect changes
      await loadQuestionsFromItems()
    } catch (error) {
      console.error('[YesNoStore] Failed to delete question:', error)
    }
  }

  const clearHistory = async () => {
    try {
      const userId = authStore.user?.id
      if (!userId) {
        console.log('[YesNoStore] No user ID available - running in skip auth mode')
        // In skip auth mode, just clear local history
        questionHistory.value = []
        return
      }
      
      // Delete all question items for this user
      const items = await itemService.getItems(userId, { 
        app_name: 'yesno',
        type: 'question' 
      })
      for (const item of items) {
        await itemService.deleteItem(item.id)
      }
      questionHistory.value = []
      questionItems.value = []
    } catch (error) {
      console.error('[YesNoStore] Failed to clear question history:', error)
    }
  }

  return {
    // State
    currentQuestion,
    questionHistory,
    questionItems,
    isPlaying,
    
    // Getters
    settings,
    recentQuestions,
    recentQuestionItems,
    
    // Actions
    setQuestion,
    selectQuestion,
    speakQuestion,
    speakText,
    handleAnswer,
    updateSettings,
    saveState,
    loadState,
    toggleFavorite,
    deleteQuestion,
    clearHistory
  }
})