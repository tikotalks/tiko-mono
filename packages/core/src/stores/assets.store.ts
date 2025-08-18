import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { assetsService } from '../services/assets.service'

export interface AssetRecord {
  id: string
  title: string
  description?: string
  filename: string
  original_filename: string
  file_path: string
  file_size: number
  mime_type: string
  file_extension: string
  categories: string[]
  tags: string[]
  width?: number
  height?: number
  duration?: number
  is_public: boolean
  user_id?: string
  created_at: string
  updated_at: string
}

export const useAssetsStore = defineStore('assets', () => {
  // Cache for asset records
  const cache = ref<Map<string, AssetRecord>>(new Map())
  
  // Cache for failed/not found assets (negative cache)
  const failedCache = ref<Map<string, { attempts: number, lastTry: number }>>(new Map())
  
  // Loading states
  const loading = ref<Set<string>>(new Set())
  
  // Configuration
  const MAX_RETRY_ATTEMPTS = 3
  const RETRY_DELAY_MS = 60000 // 1 minute
  
  
  /**
   * Get asset from cache or fetch via service
   */
  const getAsset = async (id: string): Promise<AssetRecord | null> => {
    // Return from cache if available
    if (cache.value.has(id)) {
      return cache.value.get(id)!
    }
    
    // Check if we've already failed to fetch this asset recently
    const failedAttempt = failedCache.value.get(id)
    if (failedAttempt) {
      const now = Date.now()
      const timeSinceLastTry = now - failedAttempt.lastTry
      
      // If we've exceeded max attempts and haven't waited long enough, skip
      if (failedAttempt.attempts >= MAX_RETRY_ATTEMPTS && timeSinceLastTry < RETRY_DELAY_MS) {
        console.warn(`[AssetsStore] Skipping fetch for ${id} - max attempts reached (${failedAttempt.attempts}), next retry in ${Math.round((RETRY_DELAY_MS - timeSinceLastTry) / 1000)}s`)
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
      // Use assets service to fetch the record
      const asset = await assetsService.getAsset(id)
      
      if (!asset) {
        // Update failed cache
        const currentFailed = failedCache.value.get(id) || { attempts: 0, lastTry: 0 }
        failedCache.value.set(id, {
          attempts: currentFailed.attempts + 1,
          lastTry: Date.now()
        })
        
        console.warn(`[AssetsStore] Asset not found: ${id} (attempt ${currentFailed.attempts + 1}/${MAX_RETRY_ATTEMPTS})`)
        return null
      }
      
      // Clear from failed cache if we succeeded
      if (failedCache.value.has(id)) {
        failedCache.value.delete(id)
      }
      
      // Cache the result
      cache.value.set(id, asset)
      
      return asset
    } catch (error) {
      // Update failed cache on error
      const currentFailed = failedCache.value.get(id) || { attempts: 0, lastTry: 0 }
      failedCache.value.set(id, {
        attempts: currentFailed.attempts + 1,
        lastTry: Date.now()
      })
      
      console.error(`[AssetsStore] Error fetching asset ${id} (attempt ${currentFailed.attempts + 1}/${MAX_RETRY_ATTEMPTS}):`, error)
      return null
    } finally {
      loading.value.delete(id)
    }
  }
  
  /**
   * Preload multiple assets into cache
   */
  const preloadAssets = async (ids: string[]): Promise<void> => {
    const uncachedIds = ids.filter(id => !cache.value.has(id) && !loading.value.has(id))
    
    if (uncachedIds.length === 0) {
      return
    }
    
    // Fetch all uncached assets in parallel
    const promises = uncachedIds.map(id => getAsset(id))
    await Promise.allSettled(promises)
  }
  
  /**
   * Get asset URL for display
   */
  const getAssetUrl = (asset: AssetRecord | string): string => {
    if (typeof asset === 'string') {
      // If it's just an ID, we can't construct the URL without the file_path
      // This should ideally not happen - assets should be fetched first
      console.warn(`[AssetsStore] Cannot construct URL for asset ID without file path: ${asset}`)
      return `https://assets.tikocdn.org/assets/${asset}`
    }
    
    return `https://assets.tikocdn.org/${asset.file_path}`
  }
  
  /**
   * Check if asset is cached
   */
  const isCached = (id: string): boolean => {
    return cache.value.has(id)
  }
  
  /**
   * Check if asset is currently loading
   */
  const isLoading = (id: string): boolean => {
    return loading.value.has(id)
  }
  
  /**
   * Clear cache for a specific asset
   */
  const clearAsset = (id: string): void => {
    cache.value.delete(id)
    failedCache.value.delete(id) // Also clear from failed cache
  }
  
  /**
   * Clear all cached assets
   */
  const clearCache = (): void => {
    cache.value.clear()
    failedCache.value.clear()
  }
  
  /**
   * Clear failed cache for a specific asset (force retry)
   */
  const clearFailedAsset = (id: string): void => {
    failedCache.value.delete(id)
  }
  
  /**
   * Get failed cache stats
   */
  const getFailedCacheStats = () => {
    const stats = new Map<string, { attempts: number, lastTry: number }>()
    failedCache.value.forEach((value, key) => {
      stats.set(key, { ...value })
    })
    return stats
  }
  
  /**
   * Get cache size
   */
  const cacheSize = computed(() => cache.value.size)
  
  /**
   * Get all cached asset IDs
   */
  const cachedAssetIds = computed(() => Array.from(cache.value.keys()))
  
  /**
   * Get all cached assets (full records)
   */
  const cachedAssets = computed(() => {
    const assets: Record<string, AssetRecord> = {}
    cache.value.forEach((value, key) => {
      assets[key] = value
    })
    return assets
  })
  
  return {
    // Actions
    getAsset,
    preloadAssets,
    getAssetUrl,
    clearAsset,
    clearCache,
    clearFailedAsset,
    
    // Getters
    isCached,
    isLoading,
    cacheSize,
    cachedAssetIds,
    cachedAssets,
    getFailedCacheStats
  }
})