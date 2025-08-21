/**
 * Supabase Implementation of Media Service using direct API calls
 */

import type { 
  MediaService, 
  MediaItem, 
  MediaUploadData, 
  MediaSearchOptions,
  MediaStatus 
} from './media.service'
import { getSupabase } from '../lib/supabase-lazy'
import { logger } from '../utils/logger'

export class SupabaseMediaService implements MediaService {
  private readonly API_URL: string
  private readonly apiKey: string

  constructor() {
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL environment variable is required')
    }
    this.API_URL = `${supabaseUrl}/rest/v1`
    
    // Use public key for browser compatibility
    this.apiKey = import.meta.env?.VITE_SUPABASE_PUBLIC
    if (!this.apiKey) {
      throw new Error('VITE_SUPABASE_PUBLIC environment variable is required')
    }
  }

  /**
   * Get current session from localStorage
   */
  private getSession() {
    try {
      const sessionStr = localStorage.getItem('tiko_auth_session')
      if (!sessionStr) return null
      return JSON.parse(sessionStr)
    } catch {
      return null
    }
  }

  async saveMedia(data: MediaUploadData): Promise<MediaItem> {
    const session = this.getSession()
    if (!session) throw new Error('Not authenticated')

    // Get current user ID from session
    const userId = session.user?.id
    
    try {
      const response = await fetch(`${this.API_URL}/media`, {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: userId,
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
          ai_analyzed: data.ai_analyzed,
          is_private: data.is_private || false
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('Failed to save media:', errorText)
        throw new Error(`Failed to save media: ${response.statusText}`)
      }

      const mediaArray = await response.json()
      return mediaArray[0]
    } catch (error) {
      logger.error('Failed to save media:', error)
      throw error
    }
  }

  async getMediaList(): Promise<MediaItem[]> {
    const session = this.getSession()
    if (!session) throw new Error('Not authenticated')

    try {
      const allMedia: MediaItem[] = []
      let offset = 0
      const limit = 1000
      let hasMore = true
      let pageCount = 0

      logger.debug('[MediaService] Starting pagination loop for authenticated user')
      
      while (hasMore) {
        logger.debug(`[MediaService] Fetching page ${pageCount + 1}: offset=${offset}, limit=${limit}`)
        
        // Use Supabase pagination with offset and limit
        const url = `${this.API_URL}/media?select=*&order=created_at.desc&offset=${offset}&limit=${limit}`
        logger.debug(`[MediaService] Fetching from: ${url}`)
        
        const response = await fetch(url, {
          headers: {
            'apikey': this.apiKey,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'count=exact'
          }
        })

        logger.debug(`[MediaService] Response status: ${response.status}`)
        
        if (!response.ok && response.status !== 206) {
          const errorText = await response.text()
          logger.error('Failed to fetch media:', errorText)
          throw new Error(`Failed to fetch media: ${response.statusText}`)
        }

        const data = await response.json()
        const contentRange = response.headers.get('content-range')
        
        // Debug all response headers  
        const headers: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          headers[key] = value
        })
        logger.debug('[MediaService] Response headers:', headers)
        
        logger.debug(`[MediaService] Fetched ${data.length} items, content-range: ${contentRange}`)
        
        if (data && Array.isArray(data) && data.length > 0) {
          allMedia.push(...data)
          offset += data.length
          pageCount++
          
          // Default: if we got a full page, assume there might be more
          hasMore = data.length === limit
          logger.debug(`[MediaService] Added ${data.length} items`)
          
          // Check if we have more pages based on content-range header
          if (contentRange) {
            const match = contentRange.match(/(\d+)-(\d+)\/(\d+|\*)/)
            if (match) {
              const rangeStart = parseInt(match[1])
              const rangeEnd = parseInt(match[2])
              const total = match[3] === '*' ? -1 : parseInt(match[3])
              
              logger.debug(`[MediaService] Content-range: ${rangeStart}-${rangeEnd}/${total}`)
              
              if (total > 0) {
                // If we know the total, use it to determine if there are more pages
                hasMore = offset < total
                logger.debug(`[MediaService] Has more: ${hasMore} (${offset} < ${total})`)
              }
              // If total is unknown (*), keep the default behavior (full page = more pages)
            } else {
              logger.debug(`[MediaService] Could not parse content-range: ${contentRange}`)
            }
          } else {
            logger.debug(`[MediaService] No content-range header`)
          }
        } else {
          hasMore = false
        }
        
        logger.debug(`[MediaService] Page ${pageCount} complete. Total: ${allMedia.length} items`)
        
        // Special logging for exactly 1000 items
        if (allMedia.length === 1000 && pageCount === 1) {
          logger.warning('[MediaService] Exactly 1000 items after first page - may have more')
        }
        
      }

      logger.info(`[MediaService] Fetched ${allMedia.length} items across ${pageCount} pages`)
      
      // CRITICAL DEBUG: Alert if we stopped at exactly 1000
      if (allMedia.length === 1000 && pageCount === 1) {
        logger.warning('[MediaService] Stopped at exactly 1000 items - checking for more')
        
        // Force try page 2
        const testUrl = `${this.API_URL}/media?select=*&order=created_at.desc&offset=1000&limit=${limit}`
        logger.debug('[MediaService] Testing for additional items')
        
        try {
          const testResponse = await fetch(testUrl, {
            headers: {
              'apikey': this.apiKey,
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              'Prefer': 'count=exact'
            }
          })
          
          const testData = await testResponse.json()
          logger.debug(`[MediaService] Additional items found: ${testData.length}`)
          
          if (testData.length > 0) {
            logger.error('[MediaService] Pagination incomplete - more items exist')
          }
        } catch (e) {
          logger.debug('[MediaService] No additional items found')
        }
      }
      
      return allMedia
    } catch (error) {
      logger.error('Failed to fetch media:', error)
      throw error
    }
  }

  async getPublicMediaList(): Promise<MediaItem[]> {
    try {
      logger.debug('[MediaService] Fetching public media list')
      const allMedia: MediaItem[] = []
      let offset = 0
      const limit = 1000
      let hasMore = true
      let pageCount = 0
      const maxPages = 100 // Safety limit to prevent infinite loops

      while (hasMore && pageCount < maxPages) {
        // TODO: Add back &is_private=eq.false filter after database migration is applied
        logger.debug(`[MediaService] Fetching public page: offset=${offset}`)
        
        // Use Supabase pagination with offset and limit
        const url = `${this.API_URL}/media?select=*&order=created_at.desc&offset=${offset}&limit=${limit}`
        logger.debug(`[MediaService] Fetching from: ${url}`)
        
        const response = await fetch(url, {
          headers: {
            'apikey': this.apiKey,
            'Content-Type': 'application/json',
            'Prefer': 'count=exact'
            // Explicitly no Authorization header for public access
          }
        })

        logger.debug(`[MediaService] Response status: ${response.status}`)
        
        if (!response.ok) {
          const errorText = await response.text()
          logger.error(`[MediaService] Failed to fetch public media: ${response.status}`, errorText)
          
          // Check if it's an auth error
          if (response.status === 401 || errorText.includes('JWT')) {
            throw new Error('Authentication required - RLS policy may need update')
          }
          
          throw new Error(`Failed to fetch public media: ${response.statusText}`)
        }

        const data = await response.json()
        const contentRange = response.headers.get('content-range')
        logger.debug(`[MediaService] Fetched ${data.length} public items, content-range: ${contentRange}`)
        
        if (data && data.length > 0) {
          allMedia.push(...data)
          offset += data.length
          pageCount++
          
          // Default: if we got a full page, assume there might be more
          hasMore = data.length === limit
          
          // Check if we have more pages based on content-range header
          if (contentRange) {
            const match = contentRange.match(/(\d+)-(\d+)\/(\d+|\*)/)
            if (match) {
              const rangeStart = parseInt(match[1])
              const rangeEnd = parseInt(match[2])
              const total = match[3] === '*' ? -1 : parseInt(match[3])
              
              logger.debug(`[MediaService] Content-range: ${rangeStart}-${rangeEnd}/${total}`)
              
              if (total > 0) {
                // If we know the total, use it to determine if there are more pages
                hasMore = offset < total
                logger.debug(`[MediaService] Has more: ${hasMore} (${offset} < ${total})`)
              }
              // If total is unknown (*), keep the default behavior (full page = more pages)
            } else {
              logger.debug(`[MediaService] Could not parse content-range: ${contentRange}`)
            }
          } else {
            logger.debug(`[MediaService] No content-range header`)
          }
        } else {
          hasMore = false
        }
        
        logger.debug(`[MediaService] Page ${pageCount} complete. Total: ${allMedia.length}`)
      }
      
      if (pageCount >= maxPages) {
        logger.warning(`[MediaService] Reached maximum page limit (${maxPages})`)
      }
      
      // TODO: Remove this client-side filter after database migration is applied
      // For now, filter out private media on the client side
      const publicMedia = allMedia.filter((item: MediaItem) => !item.is_private)
      
      logger.info(`[MediaService] Fetched ${publicMedia.length} public media items`)
      return publicMedia
    } catch (error) {
      logger.error('[MediaService] Error in getPublicMediaList:', error)
      throw error
    }
  }

  async searchMedia(options: MediaSearchOptions): Promise<MediaItem[]> {
    const session = this.getSession()
    if (!session) throw new Error('Not authenticated')

    try {
      let queryParams = ['select=*']

      // Add text search if query provided
      if (options.query) {
        const searchTerm = encodeURIComponent(options.query.toLowerCase())
        queryParams.push(`or=(name.ilike.*${searchTerm}*,title.ilike.*${searchTerm}*,description.ilike.*${searchTerm}*)`)
      }

      // Add tag filter if provided
      if (options.tags && options.tags.length > 0) {
        const tagsJson = encodeURIComponent(JSON.stringify(options.tags))
        queryParams.push(`tags=ov.${tagsJson}`)
      }

      // Add category filter if provided
      if (options.categories && options.categories.length > 0) {
        const categoriesJson = encodeURIComponent(JSON.stringify(options.categories))
        queryParams.push(`categories=ov.${categoriesJson}`)
      }

      // Add pagination
      if (options.limit) {
        queryParams.push(`limit=${options.limit}`)
      }
      if (options.offset) {
        const range = `${options.offset}-${options.offset + (options.limit || 50) - 1}`
        queryParams.push(`offset=${options.offset}`)
      }

      const url = `${this.API_URL}/media?${queryParams.join('&')}`
      
      const response = await fetch(url, {
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('Failed to search media:', errorText)
        throw new Error(`Failed to search media: ${response.statusText}`)
      }

      const data = await response.json()
      return data || []
    } catch (error) {
      logger.error('Failed to search media:', error)
      throw error
    }
  }

  async getMediaById(id: string): Promise<MediaItem | null> {
    // Allow public access to individual media items
    try {
      const response = await fetch(`${this.API_URL}/media?select=*&id=eq.${id}`, {
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json'
          // No Authorization header for public access
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('Failed to get media by ID:', errorText)
        throw new Error(`Failed to get media: ${response.statusText}`)
      }

      const data = await response.json()
      if (!data || data.length === 0) {
        return null // Not found
      }

      return data[0]
    } catch (error) {
      logger.error('Failed to get media by ID:', error)
      throw error
    }
  }

  async updateMedia(id: string, updates: Partial<MediaUploadData>): Promise<MediaItem> {
    const session = this.getSession()
    if (!session) throw new Error('Not authenticated')

    try {
      const response = await fetch(`${this.API_URL}/media?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...updates,
          updated_at: new Date().toISOString()
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('Failed to update media:', errorText)
        throw new Error(`Failed to update media: ${response.statusText}`)
      }

      const data = await response.json()
      return data[0]
    } catch (error) {
      logger.error('Failed to update media:', error)
      throw error
    }
  }

  async deleteMedia(id: string): Promise<void> {
    const session = this.getSession()
    if (!session) throw new Error('Not authenticated')

    try {
      const response = await fetch(`${this.API_URL}/media?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('Failed to delete media:', errorText)
        throw new Error(`Failed to delete media: ${response.statusText}`)
      }
    } catch (error) {
      logger.error('Failed to delete media:', error)
      throw error
    }
  }

  async getGeneratedMedia(
    status?: MediaStatus | MediaStatus[],
    generatedBy?: string
  ): Promise<MediaItem[]> {
    const session = this.getSession()
    
    try {
      let queryParams = ['select=*']
      
      // Filter by generation_data existence
      queryParams.push('generation_data=not.is.null')
      
      // Filter by status if provided
      if (status) {
        if (Array.isArray(status)) {
          queryParams.push(`status=in.(${status.join(',')})`)
        } else {
          queryParams.push(`status=eq.${status}`)
        }
      }
      
      // Filter by generated_by if provided
      if (generatedBy) {
        queryParams.push(`generated_by=eq.${generatedBy}`)
      }
      
      queryParams.push('order=created_at.desc')
      
      const url = `${this.API_URL}/media?${queryParams.join('&')}`
      
      const headers: any = {
        'apikey': this.apiKey,
        'Content-Type': 'application/json'
      }
      
      // Add auth header if we have a session
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const response = await fetch(url, { headers })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('Failed to fetch generated media:', errorText)
        throw new Error(`Failed to fetch generated media: ${response.statusText}`)
      }

      const data = await response.json()
      return data || []
    } catch (error) {
      logger.error('Failed to fetch generated media:', error)
      throw error
    }
  }

  async updateMediaStatus(
    mediaId: string,
    status: MediaStatus
  ): Promise<void> {
    const supabase = getSupabase()
    
    const { error } = await supabase.rpc('transition_global_media_status', {
      media_id: mediaId,
      new_status: status
    })
    
    if (error) {
      throw error
    }
  }

  async queueImageGeneration(
    generatedBy: string,
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
        userId: generatedBy,
        scope: 'global',
        items
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to queue image generation')
    }
    
    return response.json()
  }

  subscribeToGenerationUpdates(
    generatedBy: string,
    callback: (payload: any) => void
  ): () => void {
    const supabase = getSupabase()
    
    const channel = supabase
      .channel(`generation-global-${generatedBy}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media',
          filter: `generated_by=eq.${generatedBy}`
        },
        (payload) => {
          // Only notify for generated items
          if ((payload.new as any)?.generation_data) {
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

// Export the service instance
export const mediaService = new SupabaseMediaService()