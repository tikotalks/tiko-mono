import { ref, computed } from 'vue'
import { useI18n } from './useI18n'
import type { Locale } from '../i18n/types'

export interface TextToSpeechOptions {
  rate?: number
  pitch?: number
  volume?: number
  voice?: SpeechSynthesisVoice | null
}

export function useTextToSpeech() {
  const { locale } = useI18n()
  const isPlaying = ref(false)
  const isSupported = ref('speechSynthesis' in window)
  const voices = ref<SpeechSynthesisVoice[]>([])
  
  // Load available voices
  const loadVoices = () => {
    if (!isSupported.value) return
    
    voices.value = speechSynthesis.getVoices()
    
    // Chrome loads voices asynchronously
    speechSynthesis.onvoiceschanged = () => {
      voices.value = speechSynthesis.getVoices()
    }
  }
  
  // Get voice for current locale
  const getVoiceForLocale = (targetLocale?: Locale): SpeechSynthesisVoice | null => {
    const localeToUse = targetLocale || locale.value
    
    if (!voices.value.length) {
      loadVoices()
    }
    
    // Try to find exact match first
    let voice = voices.value.find(v => v.lang === localeToUse)
    
    // If not found, try to match language part only (e.g., 'en' from 'en-GB')
    if (!voice) {
      const langPart = localeToUse.split('-')[0]
      voice = voices.value.find(v => v.lang.startsWith(langPart))
    }
    
    // Fallback to default voice
    return voice || voices.value.find(v => v.default) || voices.value[0] || null
  }
  
  // Speak text with options
  const speak = async (
    text: string, 
    options: TextToSpeechOptions = {}
  ): Promise<void> => {
    if (!isSupported.value || !text || isPlaying.value) {
      return Promise.resolve()
    }
    
    return new Promise((resolve, reject) => {
      isPlaying.value = true
      
      try {
        // Cancel any ongoing speech
        speechSynthesis.cancel()
        
        const utterance = new SpeechSynthesisUtterance(text)
        
        // Set voice based on current locale if not provided
        utterance.voice = options.voice || getVoiceForLocale()
        
        // Set other options with defaults
        utterance.rate = options.rate ?? 0.9
        utterance.pitch = options.pitch ?? 1.0
        utterance.volume = options.volume ?? 1.0
        
        // Set language explicitly
        if (utterance.voice) {
          utterance.lang = utterance.voice.lang
        } else {
          utterance.lang = locale.value
        }
        
        utterance.onend = () => {
          isPlaying.value = false
          resolve()
        }
        
        utterance.onerror = (event) => {
          isPlaying.value = false
          console.error('Speech synthesis error:', event)
          reject(event)
        }
        
        speechSynthesis.speak(utterance)
      } catch (error) {
        isPlaying.value = false
        console.error('Failed to speak:', error)
        reject(error)
      }
    })
  }
  
  // Stop speaking
  const stop = () => {
    if (isSupported.value) {
      speechSynthesis.cancel()
      isPlaying.value = false
    }
  }
  
  // Pause speaking
  const pause = () => {
    if (isSupported.value && speechSynthesis.speaking) {
      speechSynthesis.pause()
    }
  }
  
  // Resume speaking
  const resume = () => {
    if (isSupported.value && speechSynthesis.paused) {
      speechSynthesis.resume()
    }
  }
  
  // Initialize voices
  if (isSupported.value) {
    loadVoices()
  }
  
  return {
    isSupported: computed(() => isSupported.value),
    isPlaying: computed(() => isPlaying.value),
    voices: computed(() => voices.value),
    speak,
    stop,
    pause,
    resume,
    getVoiceForLocale
  }
}