import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'
import type { MediaItem } from '../services/media.service'
import type { UserMedia } from '../services/user-media.service'
import { mediaService, userMediaService } from '../services'
import { useEventBus } from './useEventBus'
import { useAuthStore } from '../stores/auth'

export interface ImageStats {
  totalImages: number
  storageUsed: number
  lastUpload: Date | null
}

export interface UseImagesReturn {
  // Data
  imageList: Ref<MediaItem[] | UserMedia[]>
  stats: Ref<ImageStats>
  loading: Ref<boolean>
  error: Ref<string | null>

  // Computed
  filteredImages: Ref<(MediaItem | UserMedia)[]>

  // Methods
  getImage: (id: string) => MediaItem | UserMedia | undefined
  loadImages: () => Promise<void>
  searchImages: (query: string) => void
  refreshStats: () => Promise<void>
  refresh: () => Promise<void>
}

export enum ImageLibraryType {
  PUBLIC = 'public',
  USER = 'user'
}

export interface UseImagesOptions {
  libraryType?: ImageLibraryType
  publicMode?: boolean // Deprecated - use libraryType instead
  userMode?: boolean   // Deprecated - use libraryType instead
}

// Global state for images - shared across all instances
const publicImages = ref<MediaItem[]>([])
const userImages = ref<UserMedia[]>([])
const publicImagesLoaded = ref(false)
const userImagesLoaded = ref(false)
let publicLoadPromise: Promise<void> | null = null
let userLoadPromise: Promise<void> | null = null

/**
 * Composable for managing images and media statistics
 * @param options - Configuration options
 * @param options.libraryType - Type of library to load (PUBLIC or USER)
 * @param options.publicMode - Deprecated: If true, uses public API that doesn't require authentication
 * @param options.userMode - Deprecated: If true, returns user's personal media instead of global media
 */
export function useImages(options: UseImagesOptions = {}): UseImagesReturn {
  const { libraryType, publicMode = false, userMode = false } = options
  
  // Determine the library type - prioritize new libraryType param, fall back to legacy boolean flags
  let resolvedLibraryType: ImageLibraryType
  if (libraryType) {
    resolvedLibraryType = libraryType
  } else if (userMode) {
    resolvedLibraryType = ImageLibraryType.USER
  } else {
    resolvedLibraryType = ImageLibraryType.PUBLIC
  }
  
  const isUserLibrary = resolvedLibraryType === ImageLibraryType.USER
  
  console.log('[useImages] Composable initialized with libraryType:', resolvedLibraryType)
  
  // Instance-specific state
  const stats = ref<ImageStats>({
    totalImages: 0,
    storageUsed: 0,
    lastUpload: null
  })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  
  // Event bus for listening to upload completion
  const eventBus = useEventBus()
  
  // Lazy initialization for auth store to avoid Pinia initialization issues
  let authStore: ReturnType<typeof useAuthStore> | null = null
  const getAuthStore = () => {
    if (!authStore) {
      authStore = useAuthStore()
    }
    return authStore
  }
  
  // Computed property that returns the appropriate image list
  const imageList = computed(() => {
    const result = isUserLibrary ? userImages.value : publicImages.value
    return result
  })

  // Computed values
  const filteredImages = computed(() => {
    const list = isUserLibrary ? userImages.value : publicImages.value
    
    if (!searchQuery.value) {
      return list
    }

    const query = searchQuery.value.toLowerCase()
    return list.filter(media => {
      if (isUserLibrary) {
        // For UserMedia
        const userMedia = media as UserMedia
        return userMedia.original_filename?.toLowerCase().includes(query) ||
               userMedia.usage_type?.toLowerCase().includes(query) ||
               userMedia.metadata?.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      } else {
        // For MediaItem
        const mediaItem = media as MediaItem
        return mediaItem.title?.toLowerCase().includes(query) ||
               mediaItem.description?.toLowerCase().includes(query) ||
               mediaItem.tags?.some((tag: string) => tag.toLowerCase().includes(query)) ||
               mediaItem.categories?.some((cat: string) => cat.toLowerCase().includes(query))
      }
    })
  })

  const loadImages = async () => {
    console.log(`[useImages] loadImages called - libraryType: ${resolvedLibraryType}`)
    
    if (isUserLibrary) {
      // Load user images
      if (userImagesLoaded.value && userImages.value.length > 0) {
        console.log('[useImages] User images already loaded, returning cached data. Use refresh() to force reload.')
        await refreshStats()
        return
      }

      if (userLoadPromise) {
        return userLoadPromise
      }

      userLoadPromise = (async () => {
        loading.value = true
        error.value = null

        try {
          const userId = getAuthStore().user?.id
          if (!userId) {
            throw new Error('User not authenticated')
          }
          console.log('[useImages] Loading user media for user:', userId)
          const userMedia = await userMediaService.getUserMedia(userId)
          console.log('[useImages] Loaded user media:', userMedia.length, 'items')
          userImages.value = userMedia
          userImagesLoaded.value = true
          await refreshStats()
        } catch (err) {
          error.value = err instanceof Error ? err.message : 'Failed to load user images'
          console.error('Failed to load user images:', err)
        } finally {
          loading.value = false
          userLoadPromise = null
        }
      })()

      return userLoadPromise
    } else {
      // Load public/global images
      if (publicImagesLoaded.value && publicImages.value.length > 0) {
        console.log('[useImages] Public images already loaded, returning cached data. Use refresh() to force reload.')
        await refreshStats()
        return
      }

      if (publicLoadPromise) {
        return publicLoadPromise
      }

      publicLoadPromise = (async () => {
        loading.value = true
        error.value = null

        try {
          if (resolvedLibraryType === ImageLibraryType.PUBLIC) {
            publicImages.value = await mediaService.getPublicMediaList()
          } else {
            console.log('[useImages] Loading images from authenticated service')
            publicImages.value = await mediaService.getMediaList()
          }
          publicImagesLoaded.value = true
          await refreshStats()
        } catch (err) {
          error.value = err instanceof Error ? err.message : 'Failed to load images'
          console.error('Failed to load images:', err)
        } finally {
          loading.value = false
          publicLoadPromise = null
        }
      })()

      return publicLoadPromise
    }
  }

  const getImage = (id: string): MediaItem | UserMedia | undefined => {
    const list = isUserLibrary ? userImages.value : publicImages.value
    return list.find(image => image.id === id)
  }

  const searchImages = (query: string) => {
    searchQuery.value = query
  }

  const refreshStats = async () => {
    try {
      const list = isUserLibrary ? userImages.value : publicImages.value
      
      if (list.length === 0) {
        stats.value = {
          totalImages: 0,
          storageUsed: 0,
          lastUpload: null
        }
        return
      }

      // Calculate stats from loaded images
      const totalImages = list.length
      const storageUsed = list.reduce((total, image) => total + (image.file_size || 0), 0)

      // Find the most recent upload
      const lastUpload = list.reduce((latest, image) => {
        const imageDate = new Date(image.created_at)
        return !latest || imageDate > latest ? imageDate : latest
      }, null as Date | null)

      stats.value = {
        totalImages,
        storageUsed,
        lastUpload
      }
    } catch (err) {
      console.error('Failed to calculate stats:', err)
    }
  }

  const refresh = async () => {
    // Force reload by clearing the appropriate list and resetting loaded flag
    if (isUserLibrary) {
      userImages.value = []
      userImagesLoaded.value = false
      userLoadPromise = null
    } else {
      publicImages.value = []
      publicImagesLoaded.value = false
      publicLoadPromise = null
    }
    await loadImages()
  }

  // Listen for media refresh events from uploads
  const handleMediaRefresh = () => {
    refresh()
  }
  
  const handleUserMediaRefresh = () => {
    if (isUserLibrary) {
      refresh()
    }
  }

  // Set up event listeners
  onMounted(() => {
    if (isUserLibrary) {
      eventBus.on('user-media:refresh', handleUserMediaRefresh)
    } else {
      eventBus.on('media:refresh', handleMediaRefresh)
    }
  })

  // Clean up event listeners
  onUnmounted(() => {
    if (isUserLibrary) {
      eventBus.off('user-media:refresh', handleUserMediaRefresh)
    } else {
      eventBus.off('media:refresh', handleMediaRefresh)
    }
  })

  return {
    // Data
    imageList,
    stats,
    loading,
    error,

    // Computed
    filteredImages,

    // Methods
    getImage,
    loadImages,
    searchImages,
    refreshStats,
    refresh
  }
}
