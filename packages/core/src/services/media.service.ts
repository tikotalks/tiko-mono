/**
 * Media Service Interface
 * 
 * Handles media upload, storage, and retrieval operations.
 * Abstracts the backend implementation to allow easy switching between providers.
 */

export interface MediaItem {
  id: string
  user_id?: string
  filename: string
  original_filename: string
  file_size: number
  mime_type: string
  original_url: string
  width?: number
  height?: number
  name: string
  title: string
  description?: string
  tags: string[]
  categories: string[]
  ai_analyzed: boolean
  created_at: string
  updated_at: string
}

export interface MediaUploadData {
  filename: string
  original_filename: string
  file_size: number
  mime_type: string
  original_url: string
  width?: number
  height?: number
  name: string
  title: string
  description?: string
  tags: string[]
  categories: string[]
  ai_analyzed: boolean
}

export interface MediaSearchOptions {
  query?: string
  tags?: string[]
  categories?: string[]
  limit?: number
  offset?: number
}

export interface MediaService {
  /**
   * Save uploaded media metadata to database
   */
  saveMedia(data: MediaUploadData): Promise<MediaItem>

  /**
   * Get all media items for current user
   */
  getMediaList(): Promise<MediaItem[]>

  /**
   * Get all public media items (no authentication required)
   */
  getPublicMediaList(): Promise<MediaItem[]>

  /**
   * Search media items
   */
  searchMedia(options: MediaSearchOptions): Promise<MediaItem[]>

  /**
   * Get media item by ID
   */
  getMediaById(id: string): Promise<MediaItem | null>

  /**
   * Update media metadata
   */
  updateMedia(id: string, updates: Partial<MediaUploadData>): Promise<MediaItem>

  /**
   * Delete media item
   */
  deleteMedia(id: string): Promise<void>
}

// Export the active implementation
export { mediaService } from './media-supabase.service'