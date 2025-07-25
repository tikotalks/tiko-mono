/**
 * Supabase Implementation of Media Service using direct API calls
 */

import type { 
  MediaService, 
  MediaItem, 
  MediaUploadData, 
  MediaSearchOptions 
} from './media.service'

export class SupabaseMediaService implements MediaService {
  private readonly API_URL = 'https://kejvhvszhevfwgsztedf.supabase.co/rest/v1'
  private readonly ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'

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
          'apikey': this.ANON_KEY,
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
          ai_analyzed: data.ai_analyzed
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to save media:', errorText)
        throw new Error(`Failed to save media: ${response.statusText}`)
      }

      const mediaArray = await response.json()
      return mediaArray[0]
    } catch (error) {
      console.error('Failed to save media:', error)
      throw error
    }
  }

  async getMediaList(): Promise<MediaItem[]> {
    const session = this.getSession()
    if (!session) throw new Error('Not authenticated')

    try {
      const response = await fetch(`${this.API_URL}/media?select=*&order=created_at.desc`, {
        headers: {
          'apikey': this.ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to fetch media:', errorText)
        throw new Error(`Failed to fetch media: ${response.statusText}`)
      }

      const data = await response.json()
      return data || []
    } catch (error) {
      console.error('Failed to fetch media:', error)
      throw error
    }
  }

  async searchMedia(options: MediaSearchOptions): Promise<MediaItem[]> {
    const session = this.getSession()
    if (!session) throw new Error('Not authenticated')

    try {
      let queryParams = ['select=*', 'order=created_at.desc']

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
          'apikey': this.ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to search media:', errorText)
        throw new Error(`Failed to search media: ${response.statusText}`)
      }

      const data = await response.json()
      return data || []
    } catch (error) {
      console.error('Failed to search media:', error)
      throw error
    }
  }

  async getMediaById(id: string): Promise<MediaItem | null> {
    const session = this.getSession()
    if (!session) throw new Error('Not authenticated')

    try {
      const response = await fetch(`${this.API_URL}/media?select=*&id=eq.${id}`, {
        headers: {
          'apikey': this.ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to get media by ID:', errorText)
        throw new Error(`Failed to get media: ${response.statusText}`)
      }

      const data = await response.json()
      if (!data || data.length === 0) {
        return null // Not found
      }

      return data[0]
    } catch (error) {
      console.error('Failed to get media by ID:', error)
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
          'apikey': this.ANON_KEY,
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
        console.error('Failed to update media:', errorText)
        throw new Error(`Failed to update media: ${response.statusText}`)
      }

      const data = await response.json()
      return data[0]
    } catch (error) {
      console.error('Failed to update media:', error)
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
          'apikey': this.ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to delete media:', errorText)
        throw new Error(`Failed to delete media: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to delete media:', error)
      throw error
    }
  }
}

// Export the service instance
export const mediaService = new SupabaseMediaService()