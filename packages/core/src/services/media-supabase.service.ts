/**
 * Supabase Implementation of Media Service
 */

import { supabase } from '../lib/supabase'
import type { 
  MediaService, 
  MediaItem, 
  MediaUploadData, 
  MediaSearchOptions 
} from './media.service'

export class SupabaseMediaService implements MediaService {
  async saveMedia(data: MediaUploadData): Promise<MediaItem> {
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data: media, error } = await supabase
      .from('media')
      .insert({
        user_id: user?.id,
        filename: data.filename,
        original_filename: data.original_filename,
        file_size: data.file_size,
        mime_type: data.mime_type,
        original_url: data.original_url,
        width: data.width,
        height: data.height,
        name: data.name,
        title: data.title,
        description: data.description,
        tags: data.tags,
        categories: data.categories,
        ai_analyzed: data.ai_analyzed
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to save media:', error)
      throw new Error(`Failed to save media: ${error.message}`)
    }

    return media
  }

  async getMediaList(): Promise<MediaItem[]> {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch media:', error)
      throw new Error(`Failed to fetch media: ${error.message}`)
    }

    return data || []
  }

  async searchMedia(options: MediaSearchOptions): Promise<MediaItem[]> {
    let query = supabase
      .from('media')
      .select('*')

    // Add text search if query provided
    if (options.query) {
      const searchTerm = `%${options.query.toLowerCase()}%`
      query = query.or(
        `name.ilike.${searchTerm},title.ilike.${searchTerm},description.ilike.${searchTerm}`
      )
    }

    // Add tag filter if provided
    if (options.tags && options.tags.length > 0) {
      query = query.overlaps('tags', options.tags)
    }

    // Add category filter if provided
    if (options.categories && options.categories.length > 0) {
      query = query.overlaps('categories', options.categories)
    }

    // Add pagination
    if (options.limit) {
      query = query.limit(options.limit)
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Failed to search media:', error)
      throw new Error(`Failed to search media: ${error.message}`)
    }

    return data || []
  }

  async getMediaById(id: string): Promise<MediaItem | null> {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      console.error('Failed to get media by ID:', error)
      throw new Error(`Failed to get media: ${error.message}`)
    }

    return data
  }

  async updateMedia(id: string, updates: Partial<MediaUploadData>): Promise<MediaItem> {
    const { data, error } = await supabase
      .from('media')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update media:', error)
      throw new Error(`Failed to update media: ${error.message}`)
    }

    return data
  }

  async deleteMedia(id: string): Promise<void> {
    const { error } = await supabase
      .from('media')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete media:', error)
      throw new Error(`Failed to delete media: ${error.message}`)
    }
  }
}

// Export the service instance
export const mediaService = new SupabaseMediaService()