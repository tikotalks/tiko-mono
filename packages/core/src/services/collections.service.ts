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

const COLLECTIONS_STORAGE_KEY = 'tiko_collections'
const COLLECTION_LIKES_STORAGE_KEY = 'tiko_collection_likes'

function nowIso(): string {
  return new Date().toISOString()
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function storageAvailable(): boolean {
  return typeof localStorage !== 'undefined'
}

function readJson<T>(key: string, fallback: T): T {
  if (!storageAvailable()) return fallback
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!storageAvailable()) return
  localStorage.setItem(key, JSON.stringify(value))
}

function getCurrentUserId(): string {
  const session = readJson<{ user?: { id?: string } } | null>('tiko_auth_session', null)
  return session?.user?.id || 'anonymous'
}

function normalizeCollection(collection: MediaCollection): MediaCollection {
  return {
    view_count: 0,
    like_count: 0,
    is_public: false,
    is_curated: false,
    ...collection,
    items: collection.items || [],
  }
}

export class LocalStorageCollectionsService implements CollectionsService {
  private readCollections(): MediaCollection[] {
    return readJson<MediaCollection[]>(COLLECTIONS_STORAGE_KEY, []).map(normalizeCollection)
  }

  private writeCollections(collections: MediaCollection[]): void {
    writeJson(COLLECTIONS_STORAGE_KEY, collections)
  }

  private readLikes(): Record<string, string[]> {
    return readJson<Record<string, string[]>>(COLLECTION_LIKES_STORAGE_KEY, {})
  }

  private writeLikes(likes: Record<string, string[]>): void {
    writeJson(COLLECTION_LIKES_STORAGE_KEY, likes)
  }

  async createCollection(data: CreateCollectionData): Promise<MediaCollection> {
    const timestamp = nowIso()
    const collection: MediaCollection = {
      id: createId('collection'),
      user_id: getCurrentUserId(),
      name: data.name,
      description: data.description,
      cover_image_url: data.cover_image_url,
      is_public: data.is_public ?? false,
      is_curated: false,
      view_count: 0,
      like_count: 0,
      created_at: timestamp,
      updated_at: timestamp,
      items: [],
      item_count: 0,
      is_liked: false,
    }
    this.writeCollections([...this.readCollections(), collection])
    return collection
  }

  async getUserCollections(): Promise<MediaCollection[]> {
    const userId = getCurrentUserId()
    return this.readCollections().filter((collection) => collection.user_id === userId)
  }

  async getCollectionById(id: string): Promise<MediaCollection | null> {
    const collection = this.readCollections().find((item) => item.id === id)
    return collection || null
  }

  async getPublicCollections(): Promise<MediaCollection[]> {
    return this.readCollections().filter((collection) => collection.is_public)
  }

  async getAllCollections(): Promise<MediaCollection[]> {
    return this.readCollections()
  }

  async updateCollection(id: string, data: UpdateCollectionData): Promise<MediaCollection> {
    const collections = this.readCollections()
    const index = collections.findIndex((collection) => collection.id === id)
    if (index === -1) throw new Error('Collection not found')

    const updated = normalizeCollection({
      ...collections[index],
      ...data,
      updated_at: nowIso(),
    })
    collections[index] = updated
    this.writeCollections(collections)
    return updated
  }

  async deleteCollection(id: string): Promise<void> {
    this.writeCollections(this.readCollections().filter((collection) => collection.id !== id))
    const likes = this.readLikes()
    delete likes[id]
    this.writeLikes(likes)
  }

  async addItemToCollection(collectionId: string, data: AddItemToCollectionData): Promise<CollectionItem> {
    const collections = this.readCollections()
    const collection = collections.find((item) => item.id === collectionId)
    if (!collection) throw new Error('Collection not found')

    const item: CollectionItem = {
      id: createId('collection_item'),
      collection_id: collectionId,
      item_id: data.item_id,
      item_type: data.item_type,
      position: data.position ?? collection.items?.length ?? 0,
      added_at: nowIso(),
    }

    collection.items = [...(collection.items || []), item]
    collection.item_count = collection.items.length
    collection.updated_at = nowIso()
    this.writeCollections(collections)
    return item
  }

  async removeItemFromCollection(collectionId: string, itemId: string, itemType: 'media' | 'user_media'): Promise<void> {
    const collections = this.readCollections()
    const collection = collections.find((item) => item.id === collectionId)
    if (!collection) return

    collection.items = (collection.items || []).filter((item) => !(item.item_id === itemId && item.item_type === itemType))
    collection.item_count = collection.items.length
    collection.updated_at = nowIso()
    this.writeCollections(collections)
  }

  async getCollectionItems(collectionId: string): Promise<CollectionItem[]> {
    const collection = await this.getCollectionById(collectionId)
    return collection?.items || []
  }

  async getCuratedCollections(): Promise<MediaCollection[]> {
    return this.readCollections().filter((collection) => collection.is_curated)
  }

  async toggleCollectionLike(collectionId: string): Promise<boolean> {
    const userId = getCurrentUserId()
    const likes = this.readLikes()
    const likedBy = new Set(likes[collectionId] || [])
    const isLiked = !likedBy.has(userId)

    if (isLiked) likedBy.add(userId)
    else likedBy.delete(userId)

    likes[collectionId] = Array.from(likedBy)
    this.writeLikes(likes)

    const collections = this.readCollections()
    const collection = collections.find((item) => item.id === collectionId)
    if (collection) {
      collection.like_count = likedBy.size
      collection.is_liked = isLiked
      collection.updated_at = nowIso()
      this.writeCollections(collections)
    }

    return isLiked
  }

  async getCollectionsForMedia(mediaId: string, mediaType: 'media' | 'user_media'): Promise<MediaCollection[]> {
    return this.readCollections().filter((collection) =>
      (collection.items || []).some((item) => item.item_id === mediaId && item.item_type === mediaType)
    )
  }

  async isCollectionAccessible(collectionId: string): Promise<boolean> {
    const collection = await this.getCollectionById(collectionId)
    if (!collection) return false
    return collection.is_public || collection.user_id === getCurrentUserId()
  }

  async isUserAdmin(): Promise<boolean> {
    const session = readJson<{ user?: { role?: string } } | null>('tiko_auth_session', null)
    return session?.user?.role === 'admin'
  }
}

export const collectionsService: CollectionsService = new LocalStorageCollectionsService()
