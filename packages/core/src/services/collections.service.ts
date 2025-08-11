/**
 * Collections Service Interface
 */

export interface MediaCollection {
  id: string
  user_id: string
  name: string
  media_ids: string[]
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface CreateCollectionData {
  name: string
  media_ids?: string[]
  is_public?: boolean
}

export interface UpdateCollectionData {
  name?: string
  media_ids?: string[]
  is_public?: boolean
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
   * Update a collection
   */
  updateCollection(id: string, data: UpdateCollectionData): Promise<MediaCollection>

  /**
   * Delete a collection
   */
  deleteCollection(id: string): Promise<void>

  /**
   * Add media to collection
   */
  addMediaToCollection(collectionId: string, mediaId: string): Promise<MediaCollection>

  /**
   * Remove media from collection
   */
  removeMediaFromCollection(collectionId: string, mediaId: string): Promise<MediaCollection>

  /**
   * Check if a collection is accessible by the current user
   */
  isCollectionAccessible(collectionId: string): Promise<boolean>
}