import { getSupabase } from '../lib/supabase-lazy'

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
  usage_type: 'profile_picture' | 'card_media' | 'general'
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
}

export const userMediaService = new UserMediaService()