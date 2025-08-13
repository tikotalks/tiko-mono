import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { collectionsSupabaseService } from '../services/collections-supabase.service'
import type { MediaCollection, CollectionItem, CreateCollectionData, UpdateCollectionData, AddItemToCollectionData } from '../services/collections.service'
import { useAuthStore } from './auth'
import { logger } from '../utils/logger'

export interface Collection extends MediaCollection {
  // Using MediaCollection from service
}

export const useCollectionsStore = defineStore('collections', () => {
  const authStore = useAuthStore()
  
  // State
  const collections = ref<Collection[]>([])
  const publicCollections = ref<Collection[]>([])
  const curatedCollections = ref<Collection[]>([])
  const allCollections = ref<Collection[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const collectionCount = computed(() => collections.value.length)
  
  // Get collection by ID
  const getCollectionById = (id: string) => {
    return collections.value.find(c => c.id === id)
  }

  // Get collections containing a specific media item
  const getCollectionsForMedia = (mediaId: string, mediaType: 'media' | 'user_media' = 'media') => {
    return collections.value.filter(c => 
      c.items?.some(item => item.item_id === mediaId && item.item_type === mediaType)
    )
  }

  // Load user collections
  const loadCollections = async () => {
    if (!authStore.user) return
    
    isLoading.value = true
    error.value = null
    try {
      collections.value = await collectionsSupabaseService.getUserCollections(authStore.user.id)
      logger.info('collections-store', 'Collections loaded', { count: collections.value.length })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load collections'
      logger.error('collections-store', 'Failed to load collections', err)
    } finally {
      isLoading.value = false
    }
  }

  // Load public collections
  const loadPublicCollections = async () => {
    isLoading.value = true
    error.value = null
    try {
      publicCollections.value = await collectionsSupabaseService.getPublicCollections()
      logger.info('collections-store', 'Public collections loaded', { count: publicCollections.value.length })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load public collections'
      logger.error('collections-store', 'Failed to load public collections', err)
    } finally {
      isLoading.value = false
    }
  }

  // Load curated collections
  const loadCuratedCollections = async () => {
    console.log('loadCuratedCollections - Starting load')
    isLoading.value = true
    error.value = null
    try {
      curatedCollections.value = await collectionsSupabaseService.getCuratedCollections()
      console.log('loadCuratedCollections - Loaded collections:', curatedCollections.value)
      logger.info('collections-store', 'Curated collections loaded', { count: curatedCollections.value.length })
    } catch (err) {
      console.error('loadCuratedCollections - Error:', err)
      error.value = err instanceof Error ? err.message : 'Failed to load curated collections'
      logger.error('collections-store', 'Failed to load curated collections', err)
    } finally {
      isLoading.value = false
      console.log('loadCuratedCollections - Finished loading, isLoading:', isLoading.value)
    }
  }

  // Load all collections (admin view)
  const loadAllCollections = async () => {
    isLoading.value = true
    error.value = null
    try {
      const allCollectionsData = await collectionsSupabaseService.getAllCollections()
      allCollections.value = allCollectionsData || []
      logger.info('collections-store', 'All collections loaded', { count: allCollections.value.length })
    } catch (err) {
      // Initialize with empty array if load fails
      allCollections.value = []
      error.value = err instanceof Error ? err.message : 'Failed to load all collections'
      logger.error('collections-store', 'Failed to load all collections', err)
      console.error('Collections load error:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Create a new collection
  const createCollection = async (data: CreateCollectionData) => {
    if (!authStore.user) throw new Error('User not authenticated')
    
    try {
      const newCollection = await collectionsSupabaseService.createCollection(data)
      
      collections.value = [...collections.value, newCollection]
      if (data.is_public) {
        publicCollections.value = [...publicCollections.value, newCollection]
      }
      
      logger.info('collections-store', 'Collection created', { 
        id: newCollection.id, 
        name: newCollection.name,
        isPublic: newCollection.is_public
      })
      
      return newCollection
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create collection'
      throw err
    }
  }

  // Update collection
  const updateCollection = async (id: string, updates: UpdateCollectionData) => {
    if (!authStore.user) throw new Error('User not authenticated')
    
    try {
      const updatedCollection = await collectionsSupabaseService.updateCollection(id, updates)
      
      // Update in user collections
      const index = collections.value.findIndex(c => c.id === id)
      if (index !== -1) {
        collections.value[index] = updatedCollection
      }
      
      // Update in public collections if necessary
      const publicIndex = publicCollections.value.findIndex(c => c.id === id)
      if (updates.is_public && publicIndex === -1) {
        publicCollections.value.push(updatedCollection)
      } else if (!updates.is_public && publicIndex !== -1) {
        publicCollections.value.splice(publicIndex, 1)
      } else if (publicIndex !== -1) {
        publicCollections.value[publicIndex] = updatedCollection
      }
      
      // Update in curated collections if necessary
      const curatedIndex = curatedCollections.value.findIndex(c => c.id === id)
      if (updates.is_curated && curatedIndex === -1) {
        curatedCollections.value.push(updatedCollection)
      } else if (!updates.is_curated && curatedIndex !== -1) {
        curatedCollections.value.splice(curatedIndex, 1)
      } else if (curatedIndex !== -1) {
        curatedCollections.value[curatedIndex] = updatedCollection
      }
      
      // Update in all collections
      const allIndex = allCollections.value.findIndex(c => c.id === id)
      if (allIndex !== -1) {
        allCollections.value[allIndex] = updatedCollection
      }
      
      logger.info('collections-store', 'Collection updated', { id })
      return updatedCollection
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update collection'
      throw err
    }
  }

  // Delete collection
  const deleteCollection = async (id: string) => {
    if (!authStore.user) throw new Error('User not authenticated')
    
    try {
      await collectionsSupabaseService.deleteCollection(id)
      collections.value = collections.value.filter(c => c.id !== id)
      publicCollections.value = publicCollections.value.filter(c => c.id !== id)
      curatedCollections.value = curatedCollections.value.filter(c => c.id !== id)
      allCollections.value = allCollections.value.filter(c => c.id !== id)
      logger.info('collections-store', 'Collection deleted', { id })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete collection'
      throw err
    }
  }

  // Add item to collection
  const addItemToCollection = async (collectionId: string, data: AddItemToCollectionData) => {
    if (!authStore.user) throw new Error('User not authenticated')
    
    try {
      const newItem = await collectionsSupabaseService.addItemToCollection(collectionId, data)
      
      // Update the collection's items array
      const updateCollectionItems = (collection: Collection) => {
        if (collection.id === collectionId) {
          if (!collection.items) {
            collection.items = []
          }
          collection.items.push(newItem)
        }
      }
      
      collections.value.forEach(updateCollectionItems)
      publicCollections.value.forEach(updateCollectionItems)
      curatedCollections.value.forEach(updateCollectionItems)
      allCollections.value.forEach(updateCollectionItems)
      
      logger.info('collections-store', 'Item added to collection', { 
        collectionId, 
        itemId: data.item_id,
        itemType: data.item_type 
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add item to collection'
      throw err
    }
  }

  // Remove item from collection
  const removeItemFromCollection = async (collectionId: string, itemId: string, itemType: 'media' | 'user_media') => {
    if (!authStore.user) throw new Error('User not authenticated')
    
    try {
      await collectionsSupabaseService.removeItemFromCollection(collectionId, itemId, itemType)
      
      // Update the collection's items array
      const updateCollectionItems = (collection: Collection) => {
        if (collection.id === collectionId && collection.items) {
          collection.items = collection.items.filter(
            item => !(item.item_id === itemId && item.item_type === itemType)
          )
        }
      }
      
      collections.value.forEach(updateCollectionItems)
      publicCollections.value.forEach(updateCollectionItems)
      curatedCollections.value.forEach(updateCollectionItems)
      allCollections.value.forEach(updateCollectionItems)
      
      logger.info('collections-store', 'Item removed from collection', { 
        collectionId, 
        itemId,
        itemType 
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove item from collection'
      throw err
    }
  }

  // Check if item is in collection
  const isItemInCollection = (collectionId: string, itemId: string, itemType: 'media' | 'user_media' = 'media') => {
    const collection = getCollectionById(collectionId)
    return collection ? 
      collection.items?.some(item => item.item_id === itemId && item.item_type === itemType) ?? false : 
      false
  }

  // Toggle collection like
  const toggleCollectionLike = async (collectionId: string) => {
    if (!authStore.user) throw new Error('User not authenticated')
    
    try {
      const isLiked = await collectionsSupabaseService.toggleCollectionLike(collectionId)
      
      // Update the like status and count in all collections
      const updateCollectionLike = (collection: Collection) => {
        if (collection.id === collectionId) {
          collection.is_liked = isLiked
          collection.like_count = isLiked ? 
            (collection.like_count || 0) + 1 : 
            Math.max((collection.like_count || 0) - 1, 0)
        }
      }
      
      collections.value.forEach(updateCollectionLike)
      publicCollections.value.forEach(updateCollectionLike)
      curatedCollections.value.forEach(updateCollectionLike)
      allCollections.value.forEach(updateCollectionLike)
      
      logger.info('collections-store', 'Collection like toggled', { collectionId, isLiked })
      return isLiked
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to toggle collection like'
      throw err
    }
  }

  // Get a single collection with items
  const getCollection = async (id: string, loadItems = true) => {
    try {
      const collection = await collectionsSupabaseService.getCollectionById(id)
      
      if (loadItems && collection) {
        collection.items = await collectionsSupabaseService.getCollectionItems(id)
      }
      
      return collection
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get collection'
      throw err
    }
  }

  // Get collections for a specific media item
  const getCollectionsForMediaItem = async (mediaId: string, mediaType: 'media' | 'user_media') => {
    try {
      const result = await collectionsSupabaseService.getCollectionsForMedia(mediaId, mediaType)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get collections for media'
      throw err
    }
  }

  return {
    collections,
    publicCollections,
    curatedCollections,
    allCollections,
    collectionCount,
    isLoading,
    error,
    loadCollections,
    loadPublicCollections,
    loadCuratedCollections,
    loadAllCollections,
    getCollection,
    getCollectionById,
    getCollectionsForMedia,
    getCollectionsForMediaItem,
    createCollection,
    updateCollection,
    deleteCollection,
    addItemToCollection,
    removeItemFromCollection,
    isItemInCollection,
    toggleCollectionLike
  }
})