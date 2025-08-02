import { ref, computed, type Ref } from 'vue'
import { sentenceService, type SentencePrediction } from '../services/sentence.service'
import { useLocalStorage } from './useLocalStorage'

export interface UseSentenceBuilderOptions {
  language?: string
  userId?: string
  persistPath?: boolean
  maxPathLength?: number
  onError?: (error: string) => void
}

export interface UseSentenceBuilderReturn {
  // State
  currentPath: Ref<string[]>
  predictions: Ref<SentencePrediction[]>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  isInitial: Ref<boolean>
  
  // Computed
  sentence: Ref<string>
  canAddMore: Ref<boolean>
  hasPath: Ref<boolean>
  
  // Methods
  selectWord: (word: string) => Promise<void>
  removeLastWord: () => void
  clearPath: () => void
  loadPredictions: () => Promise<void>
  setLanguage: (lang: string) => void
}

export function useSentenceBuilder(
  options: UseSentenceBuilderOptions = {}
): UseSentenceBuilderReturn {
  const {
    language = 'en',
    userId,
    persistPath = false,
    maxPathLength = 20,
    onError
  } = options

  // State
  const currentLanguage = ref(language)
  const currentPath = persistPath
    ? useLocalStorage<string[]>('sentencePath', [])
    : ref<string[]>([])
  const predictions = ref<SentencePrediction[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isInitial = ref(true)

  // Computed
  const sentence = computed(() => currentPath.value.join(' '))
  const canAddMore = computed(() => currentPath.value.length < maxPathLength)
  const hasPath = computed(() => currentPath.value.length > 0)

  // Load predictions based on current path
  const loadPredictions = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await sentenceService.getPredictions(
        currentLanguage.value,
        currentPath.value
      )

      if (response.success) {
        predictions.value = response.predictions
        isInitial.value = response.isInitial
      } else {
        throw new Error(response.error || 'Failed to load predictions')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      error.value = errorMsg
      predictions.value = []
      
      if (onError) {
        onError(errorMsg)
      }
    } finally {
      isLoading.value = false
    }
  }

  // Select a word and add it to the path
  const selectWord = async (word: string) => {
    if (!canAddMore.value) {
      const errorMsg = `Maximum sentence length (${maxPathLength} words) reached`
      error.value = errorMsg
      if (onError) onError(errorMsg)
      return
    }

    // Add to path
    currentPath.value = [...currentPath.value, word]

    // Record selection (fire and forget)
    sentenceService.recordSelection({
      lang: currentLanguage.value,
      path: currentPath.value.slice(0, -1), // Path before selection
      choice: word,
      userId
    }).catch(err => {
      console.warn('Failed to record selection:', err)
    })

    // Load new predictions
    await loadPredictions()
  }

  // Remove the last word from the path
  const removeLastWord = () => {
    if (currentPath.value.length > 0) {
      currentPath.value = currentPath.value.slice(0, -1)
      loadPredictions()
    }
  }

  // Clear the entire path
  const clearPath = () => {
    currentPath.value = []
    loadPredictions()
  }

  // Set a new language
  const setLanguage = (lang: string) => {
    currentLanguage.value = lang
    // Optionally clear path when changing language
    // currentPath.value = []
    loadPredictions()
  }

  // Load initial predictions
  loadPredictions()

  return {
    // State
    currentPath,
    predictions,
    isLoading,
    error,
    isInitial,
    
    // Computed
    sentence,
    canAddMore,
    hasPath,
    
    // Methods
    selectWord,
    removeLastWord,
    clearPath,
    loadPredictions,
    setLanguage
  }
}

/**
 * Composable for managing multiple sentence builders
 * Useful for comparison or multi-user scenarios
 */
export function useSentenceBuilders(
  count: number = 2,
  options: UseSentenceBuilderOptions = {}
): UseSentenceBuilderReturn[] {
  const builders: UseSentenceBuilderReturn[] = []
  
  for (let i = 0; i < count; i++) {
    builders.push(useSentenceBuilder({
      ...options,
      persistPath: false // Don't persist when using multiple builders
    }))
  }
  
  return builders
}