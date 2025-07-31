import { ref, watch } from 'vue'
import { debounce } from '../utils/debounce'
import { logger } from '../utils/logger'
import { USER_PREFERENCE_KEYS } from '../constants/userPreferences'

export interface ListPreferences {
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  pageSize?: number
  filters?: Record<string, any>
}

export interface UserPreferences {
  lists?: Record<string, ListPreferences>
  theme?: string
  locale?: string
  [key: string]: any
}

export function useUserPreferences() {
  const preferences = ref<UserPreferences>({})
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Debounced save function to avoid too many API calls
  const savePreferences = debounce(async (newPreferences: UserPreferences) => {
    try {
      // For now, we'll store preferences in localStorage
      // TODO: Once getUserProfile is added to UserService, switch to database storage
      localStorage.setItem('tiko_user_preferences', JSON.stringify(newPreferences))

      logger.info('user-preferences', 'Preferences saved successfully')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save preferences'
      logger.error('user-preferences', 'Failed to save preferences:', err)
    }
  }, 1000) // 1 second debounce

  // Load preferences on init
  async function loadPreferences() {
    isLoading.value = true
    error.value = null

    try {
      // For now, load from localStorage
      // TODO: Once getUserProfile is added to UserService, switch to database storage
      const stored = localStorage.getItem('tiko_user_preferences')
      if (stored) {
        preferences.value = JSON.parse(stored)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load preferences'
      logger.error('user-preferences', 'Failed to load preferences:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Watch for changes and auto-save
  watch(preferences, (newPreferences) => {
    savePreferences(newPreferences)
  }, { deep: true })

  // Get list preferences for a specific list
  function getListPreferences(listId: string): ListPreferences {
    return preferences.value.lists?.[listId] || {}
  }

  // Update list preferences
  function updateListPreferences(listId: string, listPrefs: ListPreferences) {
    if (!preferences.value.lists) {
      preferences.value.lists = {}
    }
    preferences.value.lists[listId] = {
      ...preferences.value.lists[listId],
      ...listPrefs
    }
  }

  return {
    preferences,
    isLoading,
    error,
    loadPreferences,
    getListPreferences,
    updateListPreferences
  }
}