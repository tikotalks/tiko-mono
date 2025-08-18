export interface TImageProps {
  /**
   * Image source - can be:
   * - Full URL (https://assets.tikocdn.org/... or https://media.tikocdn.org/... or https://user-media.tikocdn.org/...)
   * - Asset ID (UUID, will be resolved from database based on media type)
   * - Path (will be resolved relative to current domain)
   */
  src: string

  /**
   * Media source type for UUID resolution
   */
  media?: 'assets' | 'user' | 'public'

  /**
   * Alt text for accessibility
   */
  alt: string

  /**
   * Predefined size variants
   */
  size?: 'thumbnail' | 'small' | 'medium' | 'large' | 'full'

  /**
   * Custom width in pixels (overrides size)
   */
  width?: number

  /**
   * Custom height in pixels
   */
  height?: number

  /**
   * How the image should be resized to fit the container
   */
  fit?: 'contain' | 'cover' | 'fill' | 'scale-down'

  /**
   * Loading strategy
   */
  loading?: 'lazy' | 'eager'

  /**
   * Whether to use responsive images with <picture> element
   */
  responsive?: boolean

  /**
   * Fallback image URL if main image fails to load
   */
  fallback?: string

  /**
   * Corner radius
   */
  rounded?: boolean | 'sm' | 'md' | 'lg' | 'full'

  /**
   * Whether to show a loading skeleton while image loads
   */
  skeleton?: boolean
}

export interface TImageEmits {
  load: []
  error: [error: Event]
  click: []
}
