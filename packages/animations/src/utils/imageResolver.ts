/**
 * Simplified image resolver for animations package
 * This avoids dependencies on stores and auth services
 */

export interface ResolveImageOptions {
  media?: 'assets' | 'public' | 'user'
  size?: 'thumbnail' | 'small' | 'medium' | 'large' | 'full'
}

export function useImageResolver() {
  const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  const resolveImageUrl = async (
    src: string,
    options: ResolveImageOptions = {}
  ): Promise<string> => {
    // If it's already a full URL, return as is
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src
    }

    // If it looks like a UUID, construct the URL based on media type
    if (isUUID(src)) {
      const mediaType = options.media || 'assets'
      
      // Use a simple URL construction for development
      // In production, these would come from the actual stores
      if (mediaType === 'assets') {
        return `https://assets.tikocdn.org/assets/${src}`
      } else if (mediaType === 'public') {
        return `https://assets.tikocdn.org/public/${src}`
      } else {
        return `https://assets.tikocdn.org/user/${src}`
      }
    }

    // Return as is if we can't resolve it
    return src
  }

  const preloadImages = async (images: string[]): Promise<void> => {
    const promises = images.map(src => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
        img.src = src
      })
    })
    
    await Promise.all(promises)
  }

  return {
    resolveImageUrl,
    resolveAssetUrl: resolveImageUrl, // Alias for compatibility
    preloadImages
  }
}