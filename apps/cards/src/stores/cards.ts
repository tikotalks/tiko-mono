import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useAppStore, useAuthStore, itemService } from '@tiko/core'

export interface YesNoSettings {
  buttonSize: 'small' | 'medium' | 'large'
  autoSpeak: boolean
  hapticFeedback: boolean
}

export const useCardStore = defineStore('yesno', () => {
  const appStore = useAppStore()
  const authStore = useAuthStore()


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

  const speakText = async (text: string) => {
    try {
      // Import useTextToSpeech dynamically
      const { useTextToSpeech } = await import('@tiko/ui')
      const tts = useTextToSpeech()

      // Speak with language-aware voice
      await tts.speak(text, {
        rate: 0.8,
        pitch: 1.0,
        volume: 1.0
      })
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
    await appStore.updateAppSettings('cards', {
      ...settings.value
    })
  }


  const loadState = async () => {
    console.log('[CardsStore] Loading state...')
    await appStore.loadAppSettings('yes-no')

    const appSettings = appStore.getAppSettings('yes-no')
    console.log('[CardsStore] Retrieved settings:', appSettings)

    if (appSettings?.currentQuestion) {
      console.log('[CardsStore] Loaded question:', appSettings.currentQuestion)
    } else {
      console.log('[CardsStore] No saved question found, using default')
    }

    // Load questions from Items service
  }
  return {


    // Getters
    settings,
    // Actions
    speakText,
    updateSettings,
    saveState,
    loadState,
   }
})
