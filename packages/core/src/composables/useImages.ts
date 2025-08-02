import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'
import type { MediaItem } from '../services/media.service'
import { mediaService } from '../services'
import { useEventBus } from './useEventBus'

export interface ImageStats {
  totalImages: number
  storageUsed: number
  lastUpload: Date | null
}

export interface UseImagesReturn {
  // Data
  imageList: Ref<MediaItem[]>
  stats: Ref<ImageStats>
  loading: Ref<boolean>
  error: Ref<string | null>

  // Computed
  filteredImages: Ref<MediaItem[]>

  // Methods
  getImage: (id: string) => MediaItem | undefined
  loadImages: () => Promise<void>
  searchImages: (query: string) => void
  refreshStats: () => Promise<void>
  refresh: () => Promise<void>
}

const imageList = ref<MediaItem[]>([])
const stats = ref<ImageStats>({
  totalImages: 0,
  storageUsed: 0,
  lastUpload: null
})
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')

// Computed values
const filteredImages = computed(() => {
  if (!searchQuery.value) {
    return imageList.value
  }

  const query = searchQuery.value.toLowerCase()
  return imageList.value.filter(media =>
    media.title?.toLowerCase().includes(query) ||
    media.description?.toLowerCase().includes(query) ||
    media.tags?.some((tag: string) => tag.toLowerCase().includes(query)) ||
    media.categories?.some((cat: string) => cat.toLowerCase().includes(query))
  )
})

/**
 * Composable for managing images and media statistics
 * @param publicMode - If true, uses public API that doesn't require authentication
 */
export function useImages(publicMode = false): UseImagesReturn {
  // Event bus for listening to upload completion
  const eventBus = useEventBus()

  const loadImages = async () => {
    loading.value = true
    error.value = null

    try {
      if (publicMode) {
        imageList.value = await mediaService.getPublicMediaList()
      } else {
        imageList.value = await mediaService.getMediaList()
      }
      await refreshStats()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load images'
      console.error('Failed to load images:', err)
    } finally {
      loading.value = false
    }
  }

  const getImage = (id: string): MediaItem | undefined => {
    return imageList.value.find(image => image.id === id)
  }

  const searchImages = (query: string) => {
    searchQuery.value = query
  }

  const refreshStats = async () => {
    try {
      if (imageList.value.length === 0) {
        stats.value = {
          totalImages: 0,
          storageUsed: 0,
          lastUpload: null
        }
        return
      }

      // Calculate stats from loaded images
      const totalImages = imageList.value.length
      const storageUsed = imageList.value.reduce((total, image) => total + (image.file_size || 0), 0)

      // Find the most recent upload
      const lastUpload = imageList.value.reduce((latest, image) => {
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
    await loadImages()
  }

  // Listen for media refresh events from uploads
  const handleMediaRefresh = () => {
    refresh()
  }

  // Set up event listeners
  onMounted(() => {
    eventBus.on('media:refresh', handleMediaRefresh)
  })

  // Clean up event listeners
  onUnmounted(() => {
    eventBus.off('media:refresh', handleMediaRefresh)
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
