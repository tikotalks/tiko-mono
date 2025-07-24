/**
 * Image URL Composable
 * 
 * Generates optimized image URLs using Cloudflare Image Resizing
 * from the original stored URL
 */

export interface ImageVariants {
  original: string
  large: string    // 1200px WebP
  medium: string   // 800px WebP
  thumbnail: string // 200px WebP
}

export interface ImageUrlOptions {
  width?: number
  height?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
  quality?: number
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
}

export function useImageUrl() {
  /**
   * Generate all standard image variants from original URL
   */
  const getImageVariants = (originalUrl: string): ImageVariants => {
    return {
      original: originalUrl,
      large: getOptimizedUrl(originalUrl, { width: 1200, format: 'webp' }),
      medium: getOptimizedUrl(originalUrl, { width: 800, format: 'webp' }),
      thumbnail: getOptimizedUrl(originalUrl, { width: 200, format: 'webp' })
    }
  }

  /**
   * Generate a custom optimized image URL
   */
  const getOptimizedUrl = (originalUrl: string, options: ImageUrlOptions = {}): string => {
    if (!originalUrl) return ''
    
    const params = new URLSearchParams()
    
    if (options.width) params.set('width', options.width.toString())
    if (options.height) params.set('height', options.height.toString())
    if (options.format) params.set('format', options.format)
    if (options.quality) params.set('quality', options.quality.toString())
    if (options.fit) params.set('fit', options.fit)
    
    const queryString = params.toString()
    return queryString ? `${originalUrl}?${queryString}` : originalUrl
  }

  /**
   * Generate responsive image sources for <picture> element
   */
  const getResponsiveSources = (originalUrl: string) => {
    return [
      {
        srcset: getOptimizedUrl(originalUrl, { width: 1200, format: 'avif' }),
        media: '(min-width: 1024px)',
        type: 'image/avif'
      },
      {
        srcset: getOptimizedUrl(originalUrl, { width: 1200, format: 'webp' }),
        media: '(min-width: 1024px)',
        type: 'image/webp'
      },
      {
        srcset: getOptimizedUrl(originalUrl, { width: 800, format: 'avif' }),
        media: '(min-width: 768px)',
        type: 'image/avif'
      },
      {
        srcset: getOptimizedUrl(originalUrl, { width: 800, format: 'webp' }),
        media: '(min-width: 768px)',
        type: 'image/webp'
      },
      {
        srcset: getOptimizedUrl(originalUrl, { width: 400, format: 'webp' }),
        type: 'image/webp'
      }
    ]
  }

  return {
    getImageVariants,
    getOptimizedUrl,
    getResponsiveSources
  }
}