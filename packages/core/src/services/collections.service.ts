/**
 * Collections Service Interface
 */

export interface MediaCollection {
  id: string
  user_id: string
  name: string
  description?: string
  cover_image_url?: string
  is_public: boolean
  is_curated: boolean
  view_count: number
  like_count: number
  created_at: string
  updated_at: string
  // Virtual fields
  items?: CollectionItem[]
  item_count?: number
  is_liked?: boolean
  owner?: {
    id: string
    username?: string
    avatar_url?: string
  }
}

export interface CollectionItem {
  id: string
  collection_id: string
  item_id: string
  item_type: 'media' | 'user_media'
  position?: number
  added_at: string
  // Virtual field - the actual media item
  media?: any
}

export interface CreateCollectionData {
  name: string
  description?: string
  cover_image_url?: string
  is_public?: boolean
}

export interface UpdateCollectionData {
  name?: string
  description?: string
  cover_image_url?: string
  is_public?: boolean
  is_curated?: boolean // Only admins can set this
}

export interface AddItemToCollectionData {
  item_id: string
  item_type: 'media' | 'user_media'
  position?: number
}

export interface CollectionsService {
  /**
   * Create a new collection
   */
  createCollection(data: CreateCollectionData): Promise<MediaCollection>

  /**
   * Get all collections for the authenticated user
   */
  getUserCollections(): Promise<MediaCollection[]>

  /**
   * Get a specific collection by ID
   */
  getCollectionById(id: string): Promise<MediaCollection | null>

  /**
   * Get all public collections
   */
  getPublicCollections(): Promise<MediaCollection[]>

  /**
   * Get all collections (admin only)
   */
  getAllCollections(): Promise<MediaCollection[]>

  /**
   * Update a collection
   */
  updateCollection(id: string, data: UpdateCollectionData): Promise<MediaCollection>

  /**
   * Delete a collection
   */
  deleteCollection(id: string): Promise<void>

  /**
   * Add item to collection
   */
  addItemToCollection(collectionId: string, data: AddItemToCollectionData): Promise<CollectionItem>

  /**
   * Remove item from collection
   */
  removeItemFromCollection(collectionId: string, itemId: string, itemType: 'media' | 'user_media'): Promise<void>

  /**
   * Get collection items
   */
  getCollectionItems(collectionId: string): Promise<CollectionItem[]>

  /**
   * Get curated collections
   */
  getCuratedCollections(): Promise<MediaCollection[]>

  /**
   * Toggle collection like
   */
  toggleCollectionLike(collectionId: string): Promise<boolean>

  /**
   * Get collections containing a specific media item
   */
  getCollectionsForMedia(mediaId: string, mediaType: 'media' | 'user_media'): Promise<MediaCollection[]>

  /**
   * Check if a collection is accessible by the current user
   */
  isCollectionAccessible(collectionId: string): Promise<boolean>

  /**
   * Check if the current user is an admin
   */
  isUserAdmin(): Promise<boolean>
}