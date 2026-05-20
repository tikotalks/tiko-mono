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

class LocalCollectionsService implements CollectionsService {
  private readonly storageKey = 'tiko_collections'
  private readonly likesKey = 'tiko_collection_likes'

  async createCollection(data: CreateCollectionData): Promise<MediaCollection> {
    const now = new Date().toISOString()
    const collection: MediaCollection = {
      id: crypto.randomUUID(),
      user_id: this.getCurrentUserId(),
      name: data.name,
      description: data.description,
      cover_image_url: data.cover_image_url,
      is_public: data.is_public ?? false,
      is_curated: false,
      view_count: 0,
      like_count: 0,
      created_at: now,
      updated_at: now,
      items: []
    }
    this.saveCollections([...this.loadCollections(), collection])
    return collection
  }

  async getUserCollections(): Promise<MediaCollection[]> {
    const userId = this.getCurrentUserId()
    return this.loadCollections().filter(collection => collection.user_id === userId)
  }

  async getCollectionById(id: string): Promise<MediaCollection | null> {
    return this.loadCollections().find(collection => collection.id === id) || null
  }

  async getPublicCollections(): Promise<MediaCollection[]> {
    return this.loadCollections().filter(collection => collection.is_public)
  }

  async getAllCollections(): Promise<MediaCollection[]> {
    return this.loadCollections()
  }

  async updateCollection(id: string, data: UpdateCollectionData): Promise<MediaCollection> {
    const collections = this.loadCollections()
    const index = collections.findIndex(collection => collection.id === id)
    if (index === -1) throw new Error('Collection not found')
    const updated = { ...collections[index], ...data, updated_at: new Date().toISOString() }
    collections[index] = updated
    this.saveCollections(collections)
    return updated
  }

  async deleteCollection(id: string): Promise<void> {
    this.saveCollections(this.loadCollections().filter(collection => collection.id !== id))
  }

  async addItemToCollection(collectionId: string, data: AddItemToCollectionData): Promise<CollectionItem> {
    const collections = this.loadCollections()
    const collection = collections.find(item => item.id === collectionId)
    if (!collection) throw new Error('Collection not found')
    const item: CollectionItem = {
      id: crypto.randomUUID(),
      collection_id: collectionId,
      item_id: data.item_id,
      item_type: data.item_type,
      position: data.position ?? collection.items?.length ?? 0,
      added_at: new Date().toISOString()
    }
    collection.items = [...(collection.items || []), item]
    collection.updated_at = new Date().toISOString()
    this.saveCollections(collections)
    return item
  }

  async removeItemFromCollection(collectionId: string, itemId: string, itemType: 'media' | 'user_media'): Promise<void> {
    const collections = this.loadCollections()
    const collection = collections.find(item => item.id === collectionId)
    if (!collection) return
    collection.items = (collection.items || []).filter(item => item.item_id !== itemId || item.item_type !== itemType)
    collection.updated_at = new Date().toISOString()
    this.saveCollections(collections)
  }

  async getCollectionItems(collectionId: string): Promise<CollectionItem[]> {
    return (await this.getCollectionById(collectionId))?.items || []
  }

  async getCuratedCollections(): Promise<MediaCollection[]> {
    return this.loadCollections().filter(collection => collection.is_curated && collection.is_public)
  }

  async toggleCollectionLike(collectionId: string): Promise<boolean> {
    const liked = this.loadLikes()
    const next = !liked.includes(collectionId)
    const nextLikes = next ? [...liked, collectionId] : liked.filter(id => id !== collectionId)
    localStorage.setItem(this.likesKey, JSON.stringify(nextLikes))
    const collection = await this.getCollectionById(collectionId)
    if (collection) await this.updateCollection(collectionId, { } as UpdateCollectionData)
    return next
  }

  async getCollectionsForMedia(mediaId: string, mediaType: 'media' | 'user_media'): Promise<MediaCollection[]> {
    return this.loadCollections().filter(collection => collection.items?.some(item => item.item_id === mediaId && item.item_type === mediaType))
  }

  async isCollectionAccessible(collectionId: string): Promise<boolean> {
    const collection = await this.getCollectionById(collectionId)
    return Boolean(collection && (collection.is_public || collection.user_id === this.getCurrentUserId()))
  }

  async isUserAdmin(): Promise<boolean> { return false }

  private loadCollections(): MediaCollection[] {
    try { return JSON.parse(localStorage.getItem(this.storageKey) || '[]') as MediaCollection[] }
    catch { return [] }
  }

  private saveCollections(collections: MediaCollection[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(collections))
  }

  private loadLikes(): string[] {
    try { return JSON.parse(localStorage.getItem(this.likesKey) || '[]') as string[] }
    catch { return [] }
  }

  private getCurrentUserId(): string {
    try {
      const session = JSON.parse(localStorage.getItem('tiko_auth_session') || 'null')
      return session?.user?.id || 'anonymous'
    } catch {
      return 'anonymous'
    }
  }
}

export const collectionsService: CollectionsService = new LocalCollectionsService()
