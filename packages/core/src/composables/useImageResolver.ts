import { ref, type Ref } from 'vue'
import { useAssetsStore } from '../stores/assets.store'
import { useMediaStore } from '../stores/media.store'

export type MediaType = 'assets' | 'public' | 'user'

export interface ResolveImageOptions {
  media?: MediaType
  size?: 'thumbnail' | 'small' | 'medium' | 'large' | 'full'
}

export interface ResolvedImage {
  originalUrl: string
  optimizedUrl: string
  isLoading: boolean
  error: string | null
}

/**
 * Composable for resolving image URLs from various sources
 * Handles assets, public media, and user media
 */
export function useImageResolver() {
  const assetsStore = useAssetsStore()
  const mediaStore = useMediaStore()

  /**
   * Check if a string is a valid UUID
   */
  const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  /**
   * Resolve an image URL from various sources
   */
  const resolveImageUrl = async (
    src: string,
    options: ResolveImageOptions = {}
  ): Promise<string> => {
    // If it's already a full URL, return as is
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src
    }

    // If it looks like a UUID, resolve based on media type
    if (isUUID(src)) {
      const mediaType = options.media || 'assets' // Default to assets

      switch (mediaType) {
        case 'assets':
          try {
            const asset = await assetsStore.getAsset(src)
            if (asset) {
              return assetsStore.getAssetUrl(asset)
            }
          } catch (error) {
            console.warn(`[ImageResolver] Failed to load from assets: ${error}`)
          }
          break

        case 'user':
          // TODO: Create a method to fetch single user media by ID
          // For now, just construct the URL directly
          return `https://user-media.tikocdn.org/${src}`

        case 'public':
          try {
            const media = await mediaStore.getMediaItem(src)
            if (media) {
              return media.filename 
                ? `https://media.tikocdn.org/${media.filename}`
                : `https://media.tikocdn.org/${src}`
            } else {
              // Fallback to constructed URL
              return `https://media.tikocdn.org/${src}`
            }
          } catch (error) {
            console.warn(`[ImageResolver] Failed to fetch public media ${src}:`, error)
            return `https://media.tikocdn.org/${src}`
          }
      }
    }

    // Otherwise treat as a path
    return src.startsWith('/') ? src : `/${src}`
  }

  /**
   * Resolve an image with loading state
   */
  const resolveImage = async (
    src: string,
    options: ResolveImageOptions = {}
  ): Promise<ResolvedImage> => {
    const result: ResolvedImage = {
      originalUrl: '',
      optimizedUrl: '',
      isLoading: true,
      error: null
    }

    try {
      result.originalUrl = await resolveImageUrl(src, options)
      result.optimizedUrl = result.originalUrl // Can be enhanced with optimization logic
      result.isLoading = false
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Failed to resolve image'
      result.isLoading = false
    }

    return result
  }

  /**
   * Preload multiple images
   */
  const preloadImages = async (
    images: Array<{ src: string; options?: ResolveImageOptions }>
  ): Promise<void> => {
    const urls = await Promise.all(
      images.map(({ src, options }) => resolveImageUrl(src, options))
    )

    // Preload all resolved URLs
    await Promise.all(
      urls.map(
        (url) =>
          new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = resolve
            img.onerror = reject
            img.src = url
          })
      )
    )
  }

  return {
    resolveImageUrl,
    resolveImage,
    preloadImages,
    isUUID
  }
}