/**
 * Media Service Interface
 * 
 * Handles media upload, storage, and retrieval operations.
 * Abstracts the backend implementation to allow easy switching between providers.
 */

export type MediaStatus = 'queued' | 'generating' | 'generated' | 'published' | 'failed' | 'rejected'

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
  is_private: boolean
  status?: MediaStatus
  generation_data?: {
    prompt: string
    size?: string
    style?: string
    revised_prompt?: string
    queued_at?: string
    started_at?: string
    completed_at?: string
    failed_at?: string
  }
  error_message?: string
  generated_by?: string
  generated_at?: string
  published_at?: string
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
  is_private?: boolean
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

  /**
   * Get AI generated media with optional status filter
   */
  getGeneratedMedia(status?: MediaStatus | MediaStatus[], generatedBy?: string): Promise<MediaItem[]>

  /**
   * Update media status (for approval workflow)
   */
  updateMediaStatus(mediaId: string, status: MediaStatus): Promise<void>

  /**
   * Queue images for AI generation
   */
  queueImageGeneration(
    generatedBy: string,
    items: Array<{ 
      name: string; 
      prompt: string; 
      size?: string; 
      style?: string;
      category?: string;
      tags?: string[];
    }>
  ): Promise<{ success: boolean; queued: number; records: any[] }>

  /**
   * Subscribe to real-time generation updates
   */
  subscribeToGenerationUpdates(
    generatedBy: string,
    callback: (payload: any) => void
  ): () => void
}

// Export the active implementation
export { mediaService } from './media-supabase.service'