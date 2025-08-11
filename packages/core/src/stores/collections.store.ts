import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { collectionsSupabaseService } from '../services/collections-supabase.service'
import type { MediaCollection } from '../services/collections.service'
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
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const collectionCount = computed(() => collections.value.length)
  
  // Get collection by ID
  const getCollectionById = (id: string) => {
    return collections.value.find(c => c.id === id)
  }

  // Get collections containing a specific media item
  const getCollectionsForMedia = (mediaId: string) => {
    return collections.value.filter(c => c.media_ids.includes(mediaId))
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

  // Create a new collection
  const createCollection = async (name: string, isPublic = false) => {
    if (!authStore.user) throw new Error('User not authenticated')
    
    try {
      const newCollection = await collectionsSupabaseService.createCollection({
        user_id: authStore.user.id,
        name,
        media_ids: [],
        is_public: isPublic
      })
      
      collections.value = [...collections.value, newCollection]
      
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
  const updateCollection = async (id: string, updates: { name?: string; is_public?: boolean }) => {
    if (!authStore.user) throw new Error('User not authenticated')
    
    try {
      const updatedCollection = await collectionsSupabaseService.updateCollection(
        id,
        authStore.user.id,
        updates
      )
      
      const index = collections.value.findIndex(c => c.id === id)
      if (index !== -1) {
        collections.value[index] = updatedCollection
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
      await collectionsSupabaseService.deleteCollection(id, authStore.user.id)
      collections.value = collections.value.filter(c => c.id !== id)
      logger.info('collections-store', 'Collection deleted', { id })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete collection'
      throw err
    }
  }

  // Add media to collection
  const addToCollection = async (collectionId: string, mediaId: string) => {
    if (!authStore.user) throw new Error('User not authenticated')
    
    try {
      const updatedCollection = await collectionsSupabaseService.addMediaToCollection(
        collectionId,
        mediaId,
        authStore.user.id
      )
      
      const index = collections.value.findIndex(c => c.id === collectionId)
      if (index !== -1) {
        collections.value[index] = updatedCollection
      }
      
      logger.info('collections-store', 'Media added to collection', { collectionId, mediaId })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add media to collection'
      throw err
    }
  }

  // Remove media from collection
  const removeFromCollection = async (collectionId: string, mediaId: string) => {
    if (!authStore.user) throw new Error('User not authenticated')
    
    try {
      const updatedCollection = await collectionsSupabaseService.removeMediaFromCollection(
        collectionId,
        mediaId,
        authStore.user.id
      )
      
      const index = collections.value.findIndex(c => c.id === collectionId)
      if (index !== -1) {
        collections.value[index] = updatedCollection
      }
      
      logger.info('collections-store', 'Media removed from collection', { collectionId, mediaId })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove media from collection'
      throw err
    }
  }

  // Check if media is in collection
  const isInCollection = (collectionId: string, mediaId: string) => {
    const collection = getCollectionById(collectionId)
    return collection ? collection.media_ids.includes(mediaId) : false
  }

  // Get a single collection
  const getCollection = async (id: string) => {
    try {
      const collection = await collectionsSupabaseService.getCollection(
        id,
        authStore.user?.id
      )
      return collection
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get collection'
      throw err
    }
  }

  return {
    collections,
    publicCollections,
    collectionCount,
    isLoading,
    error,
    loadCollections,
    loadPublicCollections,
    getCollection,
    getCollectionById,
    getCollectionsForMedia,
    createCollection,
    updateCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection,
    isInCollection
  }
})