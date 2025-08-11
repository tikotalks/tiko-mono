import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useUserPreferences } from '../composables/useUserPreferences'
import { logger } from '../utils/logger'

export const useFavoritesStore = defineStore('favorites', () => {
  const { preferences, updatePreferences, loadPreferences } = useUserPreferences()
  
  // State
  const favorites = ref<string[]>([])
  const isLoading = ref(false)
  const isInitialized = ref(false)

  // Computed
  const favoriteCount = computed(() => favorites.value.length)

  // Check if an item is favorited
  const isFavorite = (itemId: string) => {
    return favorites.value.includes(itemId)
  }

  // Initialize favorites from preferences
  const initializeFavorites = async () => {
    if (isInitialized.value) return
    
    isLoading.value = true
    try {
      await loadPreferences()
      favorites.value = preferences.value?.favoriteImages || []
      isInitialized.value = true
      logger.info('favorites-store', 'Favorites initialized', { count: favorites.value.length })
    } catch (error) {
      logger.error('favorites-store', 'Failed to initialize favorites', error)
    } finally {
      isLoading.value = false
    }
  }

  // Toggle favorite status
  const toggleFavorite = async (itemId: string) => {
    const currentFavorites = [...favorites.value]
    const index = currentFavorites.indexOf(itemId)
    
    if (index > -1) {
      currentFavorites.splice(index, 1)
    } else {
      currentFavorites.push(itemId)
    }
    
    favorites.value = currentFavorites
    
    // Sync with user preferences
    await updatePreferences({
      favoriteImages: currentFavorites
    })
    
    logger.info('favorites-store', 'Favorite toggled', { 
      itemId, 
      isFavorite: index === -1,
      totalFavorites: currentFavorites.length 
    })
  }

  // Add to favorites
  const addFavorite = async (itemId: string) => {
    if (!isFavorite(itemId)) {
      await toggleFavorite(itemId)
    }
  }

  // Remove from favorites
  const removeFavorite = async (itemId: string) => {
    if (isFavorite(itemId)) {
      await toggleFavorite(itemId)
    }
  }

  // Clear all favorites
  const clearFavorites = async () => {
    favorites.value = []
    await updatePreferences({
      favoriteImages: []
    })
    logger.info('favorites-store', 'All favorites cleared')
  }

  return {
    favorites,
    favoriteCount,
    isLoading,
    isInitialized,
    initializeFavorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites
  }
})