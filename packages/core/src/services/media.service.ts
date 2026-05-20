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

class WorkerMediaService implements MediaService {
  private readonly apiUrl = stripTrailingSlash((import.meta as any).env?.VITE_MEDIA_API_URL || 'https://media.tikoapi.org')

  async saveMedia(data: MediaUploadData): Promise<MediaItem> { return this.request<MediaItem>('/media', { method: 'POST', body: JSON.stringify(data) }) }
  async getMediaList(): Promise<MediaItem[]> { return this.request<MediaItem[]>('/media') }
  async getPublicMediaList(): Promise<MediaItem[]> { return this.request<MediaItem[]>('/media/public') }
  async searchMedia(options: MediaSearchOptions): Promise<MediaItem[]> {
    const params = new URLSearchParams()
    Object.entries(options).forEach(([key, value]) => {
      if (Array.isArray(value)) value.forEach(item => params.append(key, item))
      else if (value !== undefined) params.set(key, String(value))
    })
    return this.request<MediaItem[]>(`/media/search?${params}`)
  }
  async getMediaById(id: string): Promise<MediaItem | null> {
    try { return await this.request<MediaItem>(`/media/${encodeURIComponent(id)}`) }
    catch (error) { if (error instanceof Error && error.message.includes('404')) return null; throw error }
  }
  async updateMedia(id: string, updates: Partial<MediaUploadData>): Promise<MediaItem> { return this.request<MediaItem>(`/media/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(updates) }) }
  async deleteMedia(id: string): Promise<void> { await this.request<void>(`/media/${encodeURIComponent(id)}`, { method: 'DELETE' }) }
  async getGeneratedMedia(status?: MediaStatus | MediaStatus[], generatedBy?: string): Promise<MediaItem[]> {
    const params = new URLSearchParams()
    if (Array.isArray(status)) status.forEach(item => params.append('status', item))
    else if (status) params.set('status', status)
    if (generatedBy) params.set('generatedBy', generatedBy)
    return this.request<MediaItem[]>(`/media/generated?${params}`)
  }
  async updateMediaStatus(mediaId: string, status: MediaStatus): Promise<void> { await this.updateMedia(mediaId, { status } as Partial<MediaUploadData>) }
  async queueImageGeneration(generatedBy: string, items: Array<{ name: string; prompt: string; size?: string; style?: string; category?: string; tags?: string[] }>): Promise<{ success: boolean; queued: number; records: any[] }> {
    return this.request('/generation/queue', { method: 'POST', body: JSON.stringify({ generatedBy, items }) })
  }
  subscribeToGenerationUpdates(_generatedBy: string, _callback: (payload: any) => void): () => void { return () => {} }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers || {})
    if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json')
    const response = await fetch(`${this.apiUrl}${path}`, { ...init, headers, credentials: 'include' })
    if (!response.ok) throw new Error(`Media request failed: ${response.status}`)
    if (response.status === 204) return undefined as T
    const data = await response.json()
    return (data.media || data.items || data.records || data) as T
  }
}

function stripTrailingSlash(value: string): string { return value.endsWith('/') ? value.slice(0, -1) : value }

export const mediaService: MediaService = new WorkerMediaService()
