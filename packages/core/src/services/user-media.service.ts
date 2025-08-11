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

    // TEMPORARY: Use Supabase Storage until worker is configured
    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const extension = options.file.name.match(/\.[^.]+$/)?.[0] || ''
    const filename = `${user.id}/${options.usageType}/${timestamp}-${randomStr}${extension}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-media')
      .upload(filename, options.file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      // If bucket doesn't exist, create it
      if (uploadError.message?.includes('not found')) {
        const { error: createError } = await supabase.storage.createBucket('user-media', {
          public: true,
          fileSizeLimit: 10485760 // 10MB
        })
        
        if (createError && !createError.message?.includes('already exists')) {
          throw createError
        }

        // Try upload again
        const { error: retryError } = await supabase.storage
          .from('user-media')
          .upload(filename, options.file, {
            cacheControl: '3600',
            upsert: false
          })

        if (retryError) {
          throw retryError
        }
      } else {
        throw uploadError
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-media')
      .getPublicUrl(filename)

    // Create database record
    const mediaRecord = {
      user_id: user.id,
      filename,
      original_filename: options.file.name,
      file_size: options.file.size,
      mime_type: options.file.type,
      url: publicUrl,
      thumbnail_url: publicUrl,
      medium_url: publicUrl,
      large_url: publicUrl,
      metadata: options.metadata || {},
      usage_type: options.usageType
    }

    const { data, error } = await supabase
      .from('user_media')
      .insert(mediaRecord)
      .select()
      .single()

    if (error) {
      await supabase.storage.from('user-media').remove([filename])
      throw error
    }

    // If it's a profile picture, update user metadata
    if (options.usageType === 'profile_picture') {
      await this.updateUserProfilePicture(publicUrl)
    }

    return data
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