import { getSupabase } from '../lib/supabase-lazy'

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
  private uploadUrl = 'https://user-media.tikocdn.org/upload'

  async uploadUserMedia(options: UploadUserMediaOptions): Promise<UserMedia> {
    const supabase = getSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    try {
      // Try Cloudflare worker first
      const formData = new FormData()
      formData.append('file', options.file)
      formData.append('data', JSON.stringify({
        userId: user.id,
        usageType: options.usageType,
        metadata: options.metadata || {}
      }))

      const response = await fetch(this.uploadUrl, {
        method: 'POST',
        body: formData
      })

      console.log('Upload response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Upload result:', result)
        
        if (result.success && result.url) {
          // Create a media record to return
          const mediaRecord: UserMedia = {
            id: result.id || `upload-${Date.now()}`,
            user_id: user.id,
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
          
          // If it's a profile picture, update user metadata
          if (options.usageType === 'profile_picture') {
            await this.updateUserProfilePicture(result.url)
          }
          
          return mediaRecord
        }
      } else {
        const errorText = await response.text()
        console.error('Upload failed:', response.status, errorText)
      }
    } catch (workerError) {
      console.warn('Cloudflare worker upload failed, falling back to direct update:', workerError)
    }

    // Fallback: Don't use data URLs as they cause storage issues
    throw new Error('Upload failed - storage service unavailable. Please try again later.')
  }

  async updateUserProfilePicture(url: string): Promise<void> {
    const supabase = getSupabase()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // Update user metadata
    const { error } = await supabase.auth.updateUser({
      data: {
        avatar_url: url
      }
    })

    if (error) {
      throw error
    }
  }

  async getUserMedia(
    userId?: string,
    usageType?: 'profile_picture' | 'card_media' | 'general'
  ): Promise<UserMedia[]> {
    const supabase = getSupabase()
    
    let query = supabase.from('user_media').select('*')
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    if (usageType) {
      query = query.eq('usage_type', usageType)
    }
    
    query = query.order('created_at', { ascending: false })
    
    const { data, error } = await query
    
    if (error) {
      throw error
    }
    
    return data || []
  }

  async getLatestProfilePicture(userId: string): Promise<UserMedia | null> {
    const media = await this.getUserMedia(userId, 'profile_picture')
    return media[0] || null
  }

  async deleteUserMedia(mediaId: string): Promise<void> {
    const supabase = getSupabase()
    
    // Get the media record first
    const { data: media, error: fetchError } = await supabase
      .from('user_media')
      .select('*')
      .eq('id', mediaId)
      .single()
    
    if (fetchError) {
      throw fetchError
    }
    
    // Delete from database (R2 deletion would be handled by a cleanup worker)
    const { error } = await supabase
      .from('user_media')
      .delete()
      .eq('id', mediaId)
    
    if (error) {
      throw error
    }
    
    // If it was the current profile picture, clear it from user metadata
    if (media.usage_type === 'profile_picture') {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.user_metadata?.avatar_url === media.url) {
        await supabase.auth.updateUser({
          data: {
            avatar_url: null
          }
        })
      }
    }
  }

  async getMediaUsageStats(userId: string): Promise<{
    totalCount: number
    totalSize: number
    byType: Record<string, { count: number; size: number }>
  }> {
    const media = await this.getUserMedia(userId)
    
    const stats = {
      totalCount: media.length,
      totalSize: 0,
      byType: {} as Record<string, { count: number; size: number }>
    }
    
    media.forEach(item => {
      stats.totalSize += item.file_size
      
      if (!stats.byType[item.usage_type]) {
        stats.byType[item.usage_type] = { count: 0, size: 0 }
      }
      
      stats.byType[item.usage_type].count++
      stats.byType[item.usage_type].size += item.file_size
    })
    
    return stats
  }

  async getGeneratedMedia(
    userId: string,
    status?: MediaStatus | MediaStatus[]
  ): Promise<UserMedia[]> {
    const supabase = getSupabase()
    
    let query = supabase
      .from('user_media')
      .select('*')
      .eq('user_id', userId)
      .eq('usage_type', 'generated')
    
    if (status) {
      if (Array.isArray(status)) {
        query = query.in('status', status)
      } else {
        query = query.eq('status', status)
      }
    }
    
    query = query.order('created_at', { ascending: false })
    
    const { data, error } = await query
    
    if (error) {
      throw error
    }
    
    return data || []
  }

  async updateMediaStatus(
    mediaId: string,
    status: MediaStatus
  ): Promise<void> {
    const supabase = getSupabase()
    
    const { error } = await supabase.rpc('transition_media_status', {
      media_id: mediaId,
      new_status: status
    })
    
    if (error) {
      throw error
    }
  }

  async bulkUpdateMediaStatus(
    mediaIds: string[],
    status: MediaStatus
  ): Promise<void> {
    const supabase = getSupabase()
    
    // Use Promise.all to update multiple items
    const promises = mediaIds.map(id => 
      this.updateMediaStatus(id, status)
    )
    
    await Promise.all(promises)
  }

  async queueImageGeneration(
    userId: string,
    scope: 'personal' | 'global',
    items: Array<{ 
      name: string; 
      prompt: string; 
      size?: string; 
      style?: string;
      category?: string;
      tags?: string[];
    }>
  ): Promise<{ success: boolean; queued: number; records: any[] }> {
    // Call the image generation worker
    const response = await fetch('https://generate.tikocdn.org/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        scope,
        items
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to queue image generation')
    }
    
    return response.json()
  }

  subscribeToGenerationUpdates(
    userId: string,
    callback: (payload: any) => void
  ) {
    const supabase = getSupabase()
    
    const channel = supabase
      .channel(`generation-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_media',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Only notify for generated items
          if ((payload.new as any)?.usage_type === 'generated') {
            callback(payload)
          }
        }
      )
      .subscribe()
    
    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel)
    }
  }
}

export const userMediaService = new UserMediaService()