import { mediaService } from './media.service'
import { authService } from './auth.service'
import { assetsService } from './assets.service'
import type { MediaItem } from './media.service'
import type { AssetRecord } from '../stores/assets.store'

export type MediaSourceType = 'public' | 'assets' | 'personal' | 'url'

export interface MediaSourceItem extends MediaItem {
  source: MediaSourceType
}

export interface MediaFieldValue {
  id: string
  source: MediaSourceType
  url?: string
  metadata?: {
    alt?: string
    caption?: string
    [key: string]: any
  }
}

class MediaSourceService {
  /**
   * Load media from a specific source
   */
  async loadMediaFromSource(
    source: MediaSourceType, 
    options?: { 
      userId?: string
      search?: string
      limit?: number
      offset?: number
    }
  ): Promise<MediaItem[]> {
    switch (source) {
      case 'public':
        return this.loadPublicMedia(options)
      
      case 'personal':
        if (options?.userId) {
          return this.loadPersonalMedia(options.userId)
        } else {
          const authResult = await authService.getCurrentUser()
          const userId = authResult.user?.id
          return userId ? this.loadPersonalMedia(userId) : []
        }
      
      case 'assets':
        return this.loadAssets(options)
      
      default:
        return []
    }
  }

  /**
   * Load public media library
   */
  async loadPublicMedia(options?: { search?: string; limit?: number; offset?: number }): Promise<MediaItem[]> {
    try {
      // Use existing media service for public media
      const media = await mediaService.getPublicMediaList()
      
      // Apply search filter if provided
      if (options?.search) {
        const searchLower = options.search.toLowerCase()
        return media.filter(item => 
          item.title?.toLowerCase().includes(searchLower) ||
          item.filename.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
        )
      }
      
      return media
    } catch (error) {
      console.error('Failed to load public media:', error)
      return []
    }
  }

  /**
   * Load user's personal media
   */
  async loadPersonalMedia(userId: string, options?: { search?: string }): Promise<MediaItem[]> {
    if (!userId) return []
    
    try {
      // Use media service to get user's media
      const media = await mediaService.getMediaList()
      
      // Apply search filter if provided
      if (options?.search) {
        const searchLower = options.search.toLowerCase()
        return media.filter(item => 
          item.title?.toLowerCase().includes(searchLower) ||
          item.filename.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
        )
      }
      
      return media
    } catch (error) {
      console.error('Failed to load personal media:', error)
      return []
    }
  }

  /**
   * Load system assets
   */
  async loadAssets(options?: { search?: string }): Promise<MediaItem[]> {
    try {
      // Fetch assets from the assets service
      let assets: AssetRecord[] = []
      
      if (options?.search) {
        assets = await assetsService.searchAssets(options.search)
      } else {
        assets = await assetsService.getPublicAssets(100)
      }
      
      // Convert AssetRecord to MediaItem format
      return assets.map(asset => ({
        id: asset.id,
        user_id: asset.user_id,
        filename: asset.filename,
        original_filename: asset.original_filename,
        file_size: asset.file_size,
        mime_type: asset.mime_type,
        original_url: asset.id, // Store just the ID, will be resolved by useImageResolver
        width: asset.width,
        height: asset.height,
        name: asset.title || asset.filename,
        title: asset.title,
        description: asset.description,
        categories: asset.categories || [],
        tags: asset.tags || [],
        ai_analyzed: false,
        is_private: !asset.is_public,
        created_at: asset.created_at,
        updated_at: asset.updated_at
      }))
    } catch (error) {
      console.error('Failed to load assets:', error)
      return []
    }
  }

  /**
   * Get a single media item by ID and source
   */
  async getMediaBySource(mediaValue: MediaFieldValue): Promise<MediaItem | null> {
    try {
      switch (mediaValue.source) {
        case 'public':
          const publicMedia = await this.loadPublicMedia()
          return publicMedia.find(m => m.id === mediaValue.id) || null
        
        case 'personal':
          const authResult = await authService.getCurrentUser()
          const userId = authResult.user?.id
          if (!userId || authResult.error) return null
          const personalMedia = await this.loadPersonalMedia(userId)
          return personalMedia.find(m => m.id === mediaValue.id) || null
        
        case 'assets':
          const asset = await assetsService.getAsset(mediaValue.id)
          if (!asset) return null
          
          // Convert AssetRecord to MediaItem format
          return {
            id: asset.id,
            user_id: asset.user_id,
            filename: asset.filename,
            original_filename: asset.original_filename,
            file_size: asset.file_size,
            mime_type: asset.mime_type,
            original_url: asset.id, // Store just the ID, will be resolved by useImageResolver
            width: asset.width,
            height: asset.height,
            name: asset.title || asset.filename,
            title: asset.title,
            description: asset.description,
            categories: asset.categories || [],
            tags: asset.tags || [],
            ai_analyzed: false,
            is_private: !asset.is_public,
            created_at: asset.created_at,
            updated_at: asset.updated_at
          }
        
        case 'url':
          // For external URLs, create a synthetic MediaItem
          if (mediaValue.url) {
            return {
              id: mediaValue.id,
              user_id: 'external',
              filename: mediaValue.url.split('/').pop() || 'external-media',
              original_filename: mediaValue.url.split('/').pop() || 'external-media',
              file_size: 0,
              mime_type: 'image/unknown',
              original_url: mediaValue.url,
              name: mediaValue.metadata?.alt || 'External Media',
              title: mediaValue.metadata?.alt || 'External Media',
              description: mediaValue.metadata?.caption,
              tags: [],
              categories: [],
              ai_analyzed: false,
              is_private: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }
          return null
        
        default:
          return null
      }
    } catch (error) {
      console.error('Failed to get media by source:', error)
      return null
    }
  }

  /**
   * Get URL for a media field value
   */
  async getMediaUrl(mediaValue: MediaFieldValue): Promise<string | null> {
    if (mediaValue.source === 'url' && mediaValue.url) {
      return mediaValue.url
    }

    const mediaItem = await this.getMediaBySource(mediaValue)
    return mediaItem?.original_url || null
  }

  /**
   * Normalize legacy media values to new format
   */
  normalizeMediaValue(value: any): MediaFieldValue | MediaFieldValue[] | null {
    if (!value) return null
    
    // Handle array of values
    if (Array.isArray(value)) {
      return value.map(v => this.normalizeSingleValue(v)).filter(Boolean) as MediaFieldValue[]
    }
    
    // Handle single value
    return this.normalizeSingleValue(value)
  }

  private normalizeSingleValue(value: any): MediaFieldValue | null {
    if (!value) return null
    
    // If it's already in the new format
    if (typeof value === 'object' && 'id' in value && 'source' in value) {
      return value as MediaFieldValue
    }
    
    // If it's just a string ID (legacy format), default to 'public'
    if (typeof value === 'string') {
      return {
        id: value,
        source: 'public' // Default to public when no source is specified
      }
    }
    
    return null
  }
}

export const mediaSourceService = new MediaSourceService()