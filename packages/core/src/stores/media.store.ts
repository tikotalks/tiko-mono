import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { mediaService } from '../services/media.service'
import type { MediaItem } from '../services/media.service'

export const useMediaStore = defineStore('media', () => {
  // Cache for media records
  const cache = ref<Map<string, MediaItem>>(new Map())
  
  // Cache for failed/not found media (negative cache)
  const failedCache = ref<Map<string, { attempts: number, lastTry: number }>>(new Map())
  
  // Loading states
  const loading = ref<Set<string>>(new Set())
  
  // Configuration
  const MAX_RETRY_ATTEMPTS = 3
  const RETRY_DELAY_MS = 60000 // 1 minute
  
  /**
   * Get media item from cache or fetch via service
   */
  const getMediaItem = async (id: string): Promise<MediaItem | null> => {
    // Return from cache if available
    if (cache.value.has(id)) {
      return cache.value.get(id)!
    }
    
    // Check if we've already failed to fetch this media recently
    const failedAttempt = failedCache.value.get(id)
    if (failedAttempt) {
      const now = Date.now()
      const timeSinceLastTry = now - failedAttempt.lastTry
      
      // If we've exceeded max attempts and haven't waited long enough, skip
      if (failedAttempt.attempts >= MAX_RETRY_ATTEMPTS && timeSinceLastTry < RETRY_DELAY_MS) {
        console.warn(`[MediaStore] Skipping fetch for ${id} - max attempts reached (${failedAttempt.attempts}), next retry in ${Math.round((RETRY_DELAY_MS - timeSinceLastTry) / 1000)}s`)
        return null
      }
    }
    
    // Don't fetch if already loading
    if (loading.value.has(id)) {
      // Wait for existing request to complete
      while (loading.value.has(id)) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      return cache.value.get(id) || null
    }
    
    // Start loading
    loading.value.add(id)
    
    try {
      // Fetch single media item
      const media = await mediaService.getMediaById(id)
      
      if (!media) {
        // Update failed cache
        const currentFailed = failedCache.value.get(id) || { attempts: 0, lastTry: 0 }
        failedCache.value.set(id, {
          attempts: currentFailed.attempts + 1,
          lastTry: Date.now()
        })
        
        console.warn(`[MediaStore] Media not found: ${id} (attempt ${currentFailed.attempts + 1}/${MAX_RETRY_ATTEMPTS})`)
        return null
      }
      
      // Clear from failed cache if we succeeded
      if (failedCache.value.has(id)) {
        failedCache.value.delete(id)
      }
      
      // Cache the result
      cache.value.set(id, media)
      
      return media
    } catch (error) {
      // Update failed cache on error
      const currentFailed = failedCache.value.get(id) || { attempts: 0, lastTry: 0 }
      failedCache.value.set(id, {
        attempts: currentFailed.attempts + 1,
        lastTry: Date.now()
      })
      
      console.error(`[MediaStore] Error fetching media ${id} (attempt ${currentFailed.attempts + 1}/${MAX_RETRY_ATTEMPTS}):`, error)
      return null
    } finally {
      loading.value.delete(id)
    }
  }
  
  /**
   * Preload multiple media items into cache
   */
  const preloadMedia = async (ids: string[]): Promise<void> => {
    const uncachedIds = ids.filter(id => !cache.value.has(id) && !loading.value.has(id))
    
    if (uncachedIds.length === 0) {
      return
    }
    
    // Fetch all uncached media in parallel
    const promises = uncachedIds.map(id => getMediaItem(id))
    await Promise.allSettled(promises)
  }
  
  /**
   * Check if media is cached
   */
  const isCached = (id: string): boolean => {
    return cache.value.has(id)
  }
  
  /**
   * Check if media is currently loading
   */
  const isLoading = (id: string): boolean => {
    return loading.value.has(id)
  }
  
  /**
   * Clear cache for a specific media
   */
  const clearMedia = (id: string): void => {
    cache.value.delete(id)
    failedCache.value.delete(id)
  }
  
  /**
   * Clear all cached media
   */
  const clearCache = (): void => {
    cache.value.clear()
    failedCache.value.clear()
  }
  
  /**
   * Get cache size
   */
  const cacheSize = computed(() => cache.value.size)
  
  /**
   * Get all cached media IDs
   */
  const cachedMediaIds = computed(() => Array.from(cache.value.keys()))
  
  /**
   * Get all cached media (full records)
   */
  const cachedMedia = computed(() => {
    const media: Record<string, MediaItem> = {}
    cache.value.forEach((value, key) => {
      media[key] = value
    })
    return media
  })
  
  return {
    // Actions
    getMediaItem,
    preloadMedia,
    clearMedia,
    clearCache,
    
    // Getters
    isCached,
    isLoading,
    cacheSize,
    cachedMediaIds,
    cachedMedia
  }
})