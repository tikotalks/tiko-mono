/**
 * Image URL Composable
 * 
 * Generates optimized image URLs using Cloudflare Image Resizing
 * from the original stored URL
 */

export interface ImageVariants {
  original: string
  large: string    // 640px WebP
  medium: string   // 240px WebP
  thumbnail: string // 80px WebP
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
      large: getOptimizedUrl(originalUrl, { width: 640, format: 'webp' }),
      medium: getOptimizedUrl(originalUrl, { width: 240, format: 'webp' }),
      thumbnail: getOptimizedUrl(originalUrl, { width: 80, format: 'webp' })
    }
  }

  /**
   * Generate a custom optimized image URL using Cloudflare Image Resizing
   */
  const getOptimizedUrl = (originalUrl: string, options: ImageUrlOptions = {}): string => {
    if (!originalUrl) return ''
    
    try {
      // Check if this is a tikocdn.org URL that supports Cloudflare transformations
      const url = new URL(originalUrl)
      if (!url.hostname.endsWith('tikocdn.org')) {
        // For non-tikocdn URLs, fall back to query parameters
        const params = new URLSearchParams()
        if (options.width) params.set('width', options.width.toString())
        if (options.height) params.set('height', options.height.toString())
        if (options.format) params.set('format', options.format)
        if (options.quality) params.set('quality', options.quality.toString())
        if (options.fit) params.set('fit', options.fit)
        const queryString = params.toString()
        return queryString ? `${originalUrl}?${queryString}` : originalUrl
      }
    
      // Build Cloudflare Image Resizing options
      const cfOptions: string[] = []
      
      if (options.width) cfOptions.push(`width=${options.width}`)
      if (options.height) cfOptions.push(`height=${options.height}`)
      if (options.format) cfOptions.push(`format=${options.format}`)
      if (options.quality) cfOptions.push(`quality=${options.quality}`)
      if (options.fit) cfOptions.push(`fit=${options.fit}`)
      
      // If no options, return original URL
      if (cfOptions.length === 0) return originalUrl
      
      // Construct Cloudflare transformation URL
      // Format: https://domain/cdn-cgi/image/options/path
      const optionsString = cfOptions.join(',')
      const path = url.pathname
      
      return `${url.protocol}//${url.hostname}/cdn-cgi/image/${optionsString}${path}`
    } catch (error) {
      // If URL parsing fails, return the original URL
      return originalUrl
    }
  }

  /**
   * Generate responsive image sources for <picture> element
   */
  const getResponsiveSources = (originalUrl: string) => {
    return [
      {
        srcset: getOptimizedUrl(originalUrl, { width: 640, format: 'avif' }),
        media: '(min-width: 640px)',
        type: 'image/avif'
      },
      {
        srcset: getOptimizedUrl(originalUrl, { width: 640, format: 'webp' }),
        media: '(min-width: 640px)',
        type: 'image/webp'
      },
      {
        srcset: getOptimizedUrl(originalUrl, { width: 240, format: 'avif' }),
        media: '(min-width: 240px)',
        type: 'image/avif'
      },
      {
        srcset: getOptimizedUrl(originalUrl, { width: 240, format: 'webp' }),
        media: '(min-width: 240px)',
        type: 'image/webp'
      },
      {
        srcset: getOptimizedUrl(originalUrl, { width: 80, format: 'webp' }),
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