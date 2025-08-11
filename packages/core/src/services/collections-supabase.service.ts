import { getSupabase } from '../lib/supabase-lazy'
import type { CollectionsService, MediaCollection, CreateCollectionDto, UpdateCollectionDto } from './collections.service'

export const collectionsSupabaseService: CollectionsService = {
  async getUserCollections(userId: string): Promise<MediaCollection[]> {
    const { data, error } = await getSupabase()
      .from('media_collections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user collections:', error)
      throw error
    }

    return data || []
  },

  async getPublicCollections(): Promise<MediaCollection[]> {
    const { data, error } = await getSupabase()
      .from('media_collections')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching public collections:', error)
      throw error
    }

    return data || []
  },

  async getCollection(id: string, userId?: string): Promise<MediaCollection | null> {
    let query = getSupabase()
      .from('media_collections')
      .select('*')
      .eq('id', id)

    // If userId is provided, allow access to their own collections
    // Otherwise, only allow access to public collections
    if (userId) {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`)
    } else {
      query = query.eq('is_public', true)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null
      }
      console.error('Error fetching collection:', error)
      throw error
    }

    return data
  },

  async createCollection(dto: CreateCollectionDto): Promise<MediaCollection> {
    // Check current Supabase session
    const { data: { session } } = await getSupabase().auth.getSession()
    console.log('[Collections] Creating with Supabase session user:', session?.user?.id)
    console.log('[Collections] DTO user_id:', dto.user_id)
    console.log('[Collections] Session exists:', !!session)
    
    const { data, error } = await getSupabase()
      .from('media_collections')
      .insert([dto])
      .select()
      .single()

    if (error) {
      console.error('Error creating collection:', error)
      console.error('Full DTO:', dto)
      throw error
    }

    return data
  },

  async updateCollection(id: string, userId: string, dto: UpdateCollectionDto): Promise<MediaCollection> {
    const { data, error } = await getSupabase()
      .from('media_collections')
      .update(dto)
      .eq('id', id)
      .eq('user_id', userId) // Ensure user can only update their own collections
      .select()
      .single()

    if (error) {
      console.error('Error updating collection:', error)
      throw error
    }

    return data
  },

  async deleteCollection(id: string, userId: string): Promise<void> {
    const { error } = await getSupabase()
      .from('media_collections')
      .delete()
      .eq('id', id)
      .eq('user_id', userId) // Ensure user can only delete their own collections

    if (error) {
      console.error('Error deleting collection:', error)
      throw error
    }
  },

  async addMediaToCollection(collectionId: string, mediaId: string, userId: string): Promise<MediaCollection> {
    // First, get the current collection
    const collection = await this.getCollection(collectionId, userId)
    
    if (!collection) {
      throw new Error('Collection not found')
    }

    if (collection.user_id !== userId) {
      throw new Error('Unauthorized')
    }

    // Add the media ID if it's not already in the collection
    const updatedMediaIds = collection.media_ids.includes(mediaId)
      ? collection.media_ids
      : [...collection.media_ids, mediaId]

    return this.updateCollection(collectionId, userId, { media_ids: updatedMediaIds })
  },

  async removeMediaFromCollection(collectionId: string, mediaId: string, userId: string): Promise<MediaCollection> {
    // First, get the current collection
    const collection = await this.getCollection(collectionId, userId)
    
    if (!collection) {
      throw new Error('Collection not found')
    }

    if (collection.user_id !== userId) {
      throw new Error('Unauthorized')
    }

    // Remove the media ID from the collection
    const updatedMediaIds = collection.media_ids.filter(id => id !== mediaId)

    return this.updateCollection(collectionId, userId, { media_ids: updatedMediaIds })
  }
}