import { getSupabase } from '../lib/supabase-lazy'
import type { 
  CollectionsService, 
  MediaCollection, 
  CollectionItem,
  CreateCollectionData, 
  UpdateCollectionData,
  AddItemToCollectionData 
} from './collections.service'
import { logger } from '../utils/logger'

export const collectionsSupabaseService: CollectionsService = {
  async createCollection(data: CreateCollectionData): Promise<MediaCollection> {
    const { data: { user } } = await getSupabase().auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: collection, error } = await getSupabase()
      .from('media_collections')
      .insert({
        user_id: user.id,
        ...data
      })
      .select('*')
      .single()

    if (error) {
      logger.error('collections-supabase', 'Failed to create collection', error)
      throw error
    }

    // Add owner information manually
    return {
      ...collection,
      owner: {
        id: user.id,
        username: user.user_metadata?.username || user.email || 'Unknown',
        avatar_url: user.user_metadata?.avatar_url || null
      },
      items: [],
      item_count: 0
    }
  },
  async getUserCollections(): Promise<MediaCollection[]> {
    const { data: { user } } = await getSupabase().auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: collections, error } = await getSupabase()
      .from('media_collections')
      .select(`
        *,
        items:collection_items(count),
        is_liked:collection_likes!left(user_id)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('collections-supabase', 'Failed to get user collections', error)
      throw error
    }

    // Transform the count aggregation
    return collections.map(col => ({
      ...col,
      items: undefined, // Remove the count object
      item_count: col.items?.[0]?.count || 0,
      owner: {
        id: user.id,
        username: user.user_metadata?.username || user.email || 'You',
        avatar_url: user.user_metadata?.avatar_url || null
      }
    }))
  },

  async getPublicCollections(): Promise<MediaCollection[]> {
    try {
      const { data: collections, error } = await getSupabase()
        .from('media_collections')
        .select(`
          *,
            items:collection_items(count),
          is_liked:collection_likes!left(user_id)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('collections-supabase', 'Failed to get public collections', error)
        throw error
      }

      return collections.map(col => ({
        ...col,
        // Ensure required fields have defaults for older schema compatibility
        is_curated: col.is_curated || false,
        view_count: col.view_count || 0,
        like_count: col.like_count || 0,
        cover_image_url: col.cover_image_url || null,
        items: undefined,
        item_count: col.items?.[0]?.count || 0
      }))
    } catch (error: any) {
      if (error?.message?.includes('column') && error?.message?.includes('does not exist')) {
        throw new Error('Collections database schema needs to be updated. Please run the collections migration script.')
      }
      throw error
    }
  },

  async getCollectionById(id: string): Promise<MediaCollection | null> {
    const { data: { user } } = await getSupabase().auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: collection, error } = await getSupabase()
      .from('media_collections')
      .select(`
        *,
        items:collection_items(count),
        is_liked:collection_likes!left(user_id)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      logger.error('collections-supabase', 'Failed to get collection', error)
      throw error
    }

    // Check accessibility
    const isAccessible = await this.isCollectionAccessible(id)
    if (!isAccessible) {
      throw new Error('Collection not accessible')
    }

    return {
      ...collection,
      items: undefined,
      item_count: collection.items?.[0]?.count || 0,
      // Add owner info manually
      owner: collection.user_id === user.id ? {
        id: user.id,
        username: user.user_metadata?.username || user.email || 'You',
        avatar_url: user.user_metadata?.avatar_url || null
      } : {
        id: collection.user_id,
        username: 'Other User',
        avatar_url: null
      }
    }
  },

  async updateCollection(id: string, data: UpdateCollectionData): Promise<MediaCollection> {
    const { data: { user } } = await getSupabase().auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check if user owns the collection or is admin
    const { data: existingCollection } = await getSupabase()
      .from('media_collections')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existingCollection) {
      throw new Error('Collection not found')
    }

    // Only allow is_curated updates from admin
    const updateData = { ...data }
    if ('is_curated' in updateData && !await this.isUserAdmin()) {
      delete updateData.is_curated
    }

    const { data: collection, error } = await getSupabase()
      .from('media_collections')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        items:collection_items(count),
        is_liked:collection_likes!left(user_id)
      `)
      .single()

    if (error) {
      logger.error('collections-supabase', 'Failed to update collection', error)
      throw error
    }

    return {
      ...collection,
      items: undefined,
      item_count: collection.items?.[0]?.count || 0
    }
  },

  async deleteCollection(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from('media_collections')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('collections-supabase', 'Failed to delete collection', error)
      throw error
    }
  },

  async addItemToCollection(collectionId: string, data: AddItemToCollectionData): Promise<CollectionItem> {
    const { data: item, error } = await getSupabase()
      .from('collection_items')
      .insert({
        collection_id: collectionId,
        ...data
      })
      .select()
      .single()

    if (error) {
      logger.error('collections-supabase', 'Failed to add item to collection', error)
      throw error
    }

    return item
  },

  async removeItemFromCollection(collectionId: string, itemId: string, itemType: 'media' | 'user_media'): Promise<void> {
    const { error } = await getSupabase()
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('item_id', itemId)
      .eq('item_type', itemType)

    if (error) {
      logger.error('collections-supabase', 'Failed to remove item from collection', error)
      throw error
    }
  },

  async getCollectionItems(collectionId: string): Promise<CollectionItem[]> {
    const { data: items, error } = await getSupabase()
      .from('collection_items')
      .select('*')
      .eq('collection_id', collectionId)
      .order('position', { ascending: true, nullsFirst: false })
      .order('added_at', { ascending: false })

    if (error) {
      logger.error('collections-supabase', 'Failed to get collection items', error)
      throw error
    }

    // Load media data for each item
    const itemsWithMedia = await Promise.all(items.map(async (item) => {
      let media = null
      
      try {
        if (item.item_type === 'media') {
          // Fetch public media
          const { data: mediaData } = await getSupabase()
            .from('media')
            .select('*')
            .eq('id', item.item_id)
            .single()
          
          media = mediaData
        } else if (item.item_type === 'user_media') {
          // Fetch user media
          const { data: userMediaData } = await getSupabase()
            .from('user_media')
            .select('*')
            .eq('id', item.item_id)
            .single()
          
          media = userMediaData
        }
      } catch (err) {
        logger.error('collections-supabase', `Failed to load media for item ${item.id}`, err)
      }
      
      return {
        ...item,
        media
      }
    }))

    return itemsWithMedia
  },

  async getCuratedCollections(): Promise<MediaCollection[]> {
    console.log('getCuratedCollections - Starting query')
    const { data: collections, error } = await getSupabase()
      .from('media_collections')
      .select(`
        *,
        items:collection_items(count),
        is_liked:collection_likes!left(user_id)
      `)
      .eq('is_curated', true)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    console.log('getCuratedCollections - Query result:', { collections, error })

    if (error) {
      logger.error('collections-supabase', 'Failed to get curated collections', error)
      throw error
    }

    const mappedCollections = collections.map(col => ({
      ...col,
      items: undefined,
      item_count: col.items?.[0]?.count || 0
    }))
    
    console.log('getCuratedCollections - Mapped collections:', mappedCollections)
    return mappedCollections
  },

  async toggleCollectionLike(collectionId: string): Promise<boolean> {
    const { data: { user } } = await getSupabase().auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check if already liked
    const { data: existingLike } = await getSupabase()
      .from('collection_likes')
      .select('id')
      .eq('collection_id', collectionId)
      .eq('user_id', user.id)
      .single()

    if (existingLike) {
      // Unlike
      const { error } = await getSupabase()
        .from('collection_likes')
        .delete()
        .eq('collection_id', collectionId)
        .eq('user_id', user.id)

      if (error) {
        logger.error('collections-supabase', 'Failed to unlike collection', error)
        throw error
      }

      return false
    } else {
      // Like
      const { error } = await getSupabase()
        .from('collection_likes')
        .insert({
          collection_id: collectionId,
          user_id: user.id
        })

      if (error) {
        logger.error('collections-supabase', 'Failed to like collection', error)
        throw error
      }

      return true
    }
  },

  async getCollectionsForMedia(mediaId: string, mediaType: 'media' | 'user_media'): Promise<MediaCollection[]> {
    const { data: collections, error } = await getSupabase()
      .from('collection_items')
      .select(`
        collection:media_collections(
          *,
            items:collection_items(count),
          is_liked:collection_likes!left(user_id)
        )
      `)
      .eq('item_id', mediaId)
      .eq('item_type', mediaType)

    if (error) {
      logger.error('collections-supabase', 'Failed to get collections for media', error)
      throw error
    }

    return collections
      .map(item => item.collection)
      .filter(Boolean)
      .map(col => ({
        ...col,
        items: undefined,
        item_count: col.items?.[0]?.count || 0
      }))
  },

  async isCollectionAccessible(collectionId: string): Promise<boolean> {
    const { data: { user } } = await getSupabase().auth.getUser()
    
    const { data: collection } = await getSupabase()
      .from('media_collections')
      .select('user_id, is_public')
      .eq('id', collectionId)
      .single()

    if (!collection) return false

    // Public collections are accessible to all
    if (collection.is_public) return true

    // Private collections are only accessible to the owner
    return user?.id === collection.user_id
  },

  async getAllCollections(): Promise<MediaCollection[]> {
    // This method fetches collections that should be visible in admin:
    // - Your own collections (private and public)  
    // - Other users' public collections (for curation)
    try {
      const { data: { user } } = await getSupabase().auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: collections, error } = await getSupabase()
        .from('media_collections')
        .select(`
          *,
            items:collection_items(count),
          is_liked:collection_likes!left(user_id)
        `)
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('collections-supabase', 'Failed to get all collections', error)
        throw error
      }

      return collections.map(col => ({
        ...col,
        // Ensure required fields have defaults for older schema compatibility
        is_curated: col.is_curated || false,
        view_count: col.view_count || 0,
        like_count: col.like_count || 0,
        cover_image_url: col.cover_image_url || null,
        items: undefined,
        item_count: col.items?.[0]?.count || 0,
        // Add owner info manually - for now use current user or unknown
        owner: col.user_id === user.id ? {
          id: user.id,
          username: user.user_metadata?.username || user.email || 'You',
          avatar_url: user.user_metadata?.avatar_url || null
        } : {
          id: col.user_id,
          username: 'Other User',
          avatar_url: null
        }
      }))
    } catch (error: any) {
      // If the error is about missing columns, provide more helpful feedback
      if (error?.message?.includes('column') && error?.message?.includes('does not exist')) {
        const missingColumnError = new Error(
          'Collections database schema needs to be updated. Please run the collections migration script.'
        )
        logger.error('collections-supabase', 'Schema migration required', { originalError: error.message })
        throw missingColumnError
      }
      throw error
    }
  },

  async isUserAdmin(): Promise<boolean> {
    const { data: { user } } = await getSupabase().auth.getUser()
    if (!user) return false

    const { data: profile } = await getSupabase()
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    return profile?.role === 'admin'
  }
}