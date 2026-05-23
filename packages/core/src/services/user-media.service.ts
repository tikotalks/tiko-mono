import { authService } from './auth.service'

export type MediaStatus = 'queued' | 'generating' | 'generated' | 'published' | 'failed' | 'rejected'

export interface UserMedia {
  id: string
  user_id: string
  filename: string
  original_filename: string
  file_size: number
  mime_type: string
  url: string
  thumbnail_url?: string
  medium_url?: string
  large_url?: string
  width?: number
  height?: number
  metadata: Record<string, any>
  usage_type: 'profile_picture' | 'card_media' | 'general' | 'generated'
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
  generated_at?: string
  published_at?: string
  created_at: string
  updated_at: string
}

export interface UploadUserMediaOptions {
  file: File
  usageType: 'profile_picture' | 'card_media' | 'general'
  metadata?: Record<string, any>
}

class UserMediaService {
  private readonly apiUrl = stripTrailingSlash((import.meta as any).env?.VITE_USER_MEDIA_API_URL || 'https://user-media.tikocdn.org')

  async uploadUserMedia(options: UploadUserMediaOptions): Promise<UserMedia> {
    const session = await authService.getSession()
    if (!session?.user) throw new Error('User not authenticated')

    const formData = new FormData()
    formData.append('file', options.file)
    formData.append('data', JSON.stringify({
      usageType: options.usageType,
      metadata: options.metadata || {}
    }))

    const result = await this.request<any>('/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`
      },
      body: formData
    }, false)
    const media: UserMedia = {
      id: result.id || `upload-${Date.now()}`,
      user_id: session.user.id,
      filename: options.file.name,
      original_filename: options.file.name,
      file_size: options.file.size,
      mime_type: options.file.type,
      url: result.url,
      thumbnail_url: result.thumbnailUrl || result.url,
      medium_url: result.mediumUrl || result.url,
      large_url: result.largeUrl || result.url,
      metadata: options.metadata || {},
      usage_type: options.usageType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (options.usageType === 'profile_picture') {
      await this.updateUserProfilePicture(media.url)
    }

    return media
  }

  async updateUserProfilePicture(url: string): Promise<void> {
    const result = await authService.updateUserMetadata({ avatar_url: url })
    if (!result.success) throw new Error(result.error || 'Failed to update profile picture')
  }

  async getUserMedia(userId?: string, usageType?: UserMedia['usage_type']): Promise<UserMedia[]> {
    const params = new URLSearchParams()
    if (userId) params.set('userId', userId)
    if (usageType) params.set('usageType', usageType)
    return this.request<UserMedia[]>(`/media?${params}`)
  }

  async getLatestProfilePicture(userId: string): Promise<UserMedia | null> {
    const media = await this.getUserMedia(userId, 'profile_picture')
    return media[0] || null
  }

  async deleteUserMedia(mediaId: string): Promise<void> {
    await this.request<void>(`/media/${encodeURIComponent(mediaId)}`, { method: 'DELETE' })
  }

  async getMediaUsageStats(userId: string): Promise<{ total: number; by_type: Record<string, number>; total_size: number }> {
    return this.request(`/media/stats?userId=${encodeURIComponent(userId)}`)
  }

  async getGeneratedMedia(status?: MediaStatus | MediaStatus[], generatedBy?: string): Promise<UserMedia[]> {
    const params = new URLSearchParams()
    if (Array.isArray(status)) status.forEach(item => params.append('status', item))
    else if (status) params.set('status', status)
    if (generatedBy) params.set('generatedBy', generatedBy)
    return this.request<UserMedia[]>(`/media/generated?${params}`)
  }

  async updateMediaStatus(mediaId: string, status: MediaStatus): Promise<void> {
    await this.request<void>(`/media/${encodeURIComponent(mediaId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  }

  async bulkUpdateMediaStatus(mediaIds: string[], status: MediaStatus): Promise<void> {
    await this.request<void>('/media/status', {
      method: 'PATCH',
      body: JSON.stringify({ mediaIds, status })
    })
  }

  async queueImageGeneration(generatedBy: string, items: Array<{ name: string; prompt: string; size?: string; style?: string; category?: string; tags?: string[] }>): Promise<{ success: boolean; queued: number; records: any[] }> {
    return this.request('/generate', {
      method: 'POST',
      body: JSON.stringify({ generatedBy, items })
    })
  }

  subscribeToGenerationUpdates(_generatedBy: string, _callback: (payload: any) => void): () => void {
    return () => {}
  }

  private async request<T>(path: string, init: RequestInit = {}, json = true): Promise<T> {
    const headers = new Headers(init.headers || {})
    if (json && !headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json')
    const response = await fetch(`${this.apiUrl}${path}`, { ...init, headers, credentials: 'include' })
    if (!response.ok) throw new Error(`User media request failed: ${response.status}`)
    if (response.status === 204) return undefined as T
    const data = await response.json()
    return (data.media || data.items || data.records || data) as T
  }
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

export const userMediaService = new UserMediaService()
