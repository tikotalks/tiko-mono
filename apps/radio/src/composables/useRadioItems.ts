/**
 * Composable for managing radio items CRUD operations
 * Handles data persistence with Items service and local state management
 */

import { ref, computed } from 'vue'
import { useAuthStore, itemService } from '@tiko/core'
import type { BaseItem } from '@tiko/core'
import type {
  RadioItem,
  CreateRadioItemPayload,
  UpdateRadioItemPayload,
  RadioItemRow,
  VideoMetadata,
} from '../types/radio.types'

/**
 * Radio items management composable
 *
 * Provides CRUD operations for radio items using the Items service.
 * Handles data transformation between UI models and BaseItem format.
 *
 * @returns Radio items interface with CRUD methods and state
 *
 * @example
 * const radioItems = useRadioItems()
 *
 * // Load user's radio items
 * await radioItems.fetchItems()
 *
 * // Add new item
 * await radioItems.addItem({
 *   title: 'My Audio',
 *   videoUrl: 'https://youtube.com/watch?v=...',
 *   description: 'Great audio track'
 * })
 *
 * // Update existing item
 * await radioItems.updateItem(itemId, { title: 'New Title' })
 */
export function useRadioItems() {
  const authStore = useAuthStore()

  // State
  const items = ref<RadioItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const sortedItems = computed(() => [...items.value].sort((a, b) => a.sortOrder - b.sortOrder))

  const favoriteItems = computed(() => items.value.filter(item => item.isFavorite))

  const recentItems = computed(() =>
    [...items.value]
      .filter(item => item.lastPlayedAt)
      .sort((a, b) => {
        const dateA = a.lastPlayedAt ? new Date(a.lastPlayedAt).getTime() : 0
        const dateB = b.lastPlayedAt ? new Date(b.lastPlayedAt).getTime() : 0
        return dateB - dateA
      })
      .slice(0, 10)
  )

  /**
   * Transform BaseItem to RadioItem
   */
  const transformFromBaseItem = (item: BaseItem): RadioItem => ({
    id: item.id,
    userId: item.user_id,
    title: item.name,
    description: item.content || undefined,
    videoUrl: item.metadata?.video_url || '',
    videoType: (item.metadata?.video_type || 'url') as RadioItem['videoType'],
    thumbnailUrl: item.metadata?.thumbnail_url || undefined,
    customThumbnailUrl: item.metadata?.custom_thumbnail_url || undefined,
    durationSeconds: item.metadata?.duration_seconds || undefined,
    tags: item.tags || [],
    isFavorite: item.is_favorite || false,
    playCount: item.metadata?.play_count || 0,
    lastPlayedAt: item.metadata?.last_played_at
      ? new Date(item.metadata.last_played_at)
      : undefined,
    sortOrder: item.order_index,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
  })

  /**
   * Fetch all radio items for the current user
   */
  const fetchItems = async (): Promise<void> => {
    console.log('Fetching radio items for user:', authStore.user?.id)

    if (!authStore.user) {
      error.value = 'User not authenticated'
      console.error('No authenticated user found')
      return
    }

    loading.value = true
    error.value = null

    try {
      console.log('Querying radio items...')
      const baseItems = await itemService.getItems(authStore.user.id, {
        app_name: 'radio',
        type: 'radio_item',
      })

      console.log('Items service fetch result:', baseItems)

      const transformedItems = baseItems.map(transformFromBaseItem)
      items.value = transformedItems
      console.log('Successfully loaded', transformedItems.length, 'radio items:', transformedItems)
    } catch (err) {
      console.error('Failed to fetch radio items:', err)
      error.value = 'Failed to load radio items'
    } finally {
      loading.value = false
    }
  }

  /**
   * Add a new radio item
   */
  const addItem = async (itemData: Partial<RadioItem>): Promise<RadioItem | null> => {
    if (!authStore.user) {
      error.value = 'User not authenticated'
      return null
    }

    loading.value = true
    error.value = null

    try {
      console.log('Adding radio item for user:', authStore.user.id)
      console.log('Item data received:', itemData)

      // Extract video metadata if possible
      const metadata = await extractVideoMetadata(itemData.videoUrl || '')
      console.log('Extracted metadata:', metadata)

      const payload = {
        app_name: 'radio',
        type: 'radio_item',
        name: itemData.title || metadata.title || 'Untitled Audio',
        content: itemData.description || '',
        metadata: {
          video_url: itemData.videoUrl || '',
          video_type: metadata.videoType,
          thumbnail_url: metadata.thumbnailUrl,
          custom_thumbnail_url: itemData.customThumbnailUrl,
          duration_seconds: metadata.durationSeconds,
          play_count: 0,
          last_played_at: null,
        },
        tags: itemData.tags || [],
        is_favorite: false,
        order_index: items.value.length,
      }

      console.log('Payload being sent to itemService:', payload)

      const result = await itemService.createItem(authStore.user.id, payload)

      console.log('Item service create result:', result)

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create item')
      }

      const newItem = transformFromBaseItem(result.data)
      items.value.push(newItem)

      console.log('Successfully added item:', newItem)
      return newItem
    } catch (err) {
      console.error('Failed to add radio item:', err)
      error.value = 'Failed to add radio item'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing radio item
   */
  const updateItem = async (id: string, updates: UpdateRadioItemPayload): Promise<boolean> => {
    if (!authStore.user) {
      error.value = 'User not authenticated'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const existingItem = items.value.find(item => item.id === id)
      if (!existingItem) {
        throw new Error('Item not found')
      }

      // Transform updates to BaseItem format
      const baseItemUpdates: any = {}

      if (updates.title !== undefined) baseItemUpdates.name = updates.title
      if (updates.description !== undefined) baseItemUpdates.content = updates.description
      if (updates.tags !== undefined) baseItemUpdates.tags = updates.tags
      if (updates.is_favorite !== undefined) baseItemUpdates.is_favorite = updates.is_favorite
      if (updates.sort_order !== undefined) baseItemUpdates.order_index = updates.sort_order

      // Handle metadata updates
      if (
        updates.video_url !== undefined ||
        updates.custom_thumbnail_url !== undefined ||
        updates.play_count !== undefined ||
        updates.last_played_at !== undefined
      ) {
        baseItemUpdates.metadata = {
          ...existingItem,
          video_url: updates.video_url ?? existingItem.videoUrl,
          video_type: existingItem.videoType,
          thumbnail_url: existingItem.thumbnailUrl,
          custom_thumbnail_url: updates.custom_thumbnail_url ?? existingItem.customThumbnailUrl,
          duration_seconds: existingItem.durationSeconds,
          play_count: updates.play_count ?? existingItem.playCount,
          last_played_at: updates.last_played_at ?? existingItem.lastPlayedAt?.toISOString(),
        }
      }

      const result = await itemService.updateItem(id, baseItemUpdates)

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to update item')
      }

      // Update local state
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = transformFromBaseItem(result.data)
      }

      return true
    } catch (err) {
      console.error('Failed to update radio item:', err)
      error.value = 'Failed to update radio item'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a radio item
   */
  const deleteItem = async (id: string): Promise<boolean> => {
    if (!authStore.user) {
      error.value = 'User not authenticated'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const result = await itemService.deleteItem(id)

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete item')
      }

      // Update local state
      items.value = items.value.filter(item => item.id !== id)

      return true
    } catch (err) {
      console.error('Failed to delete radio item:', err)
      error.value = 'Failed to delete radio item'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Toggle favorite status of an item
   */
  const toggleFavorite = async (id: string): Promise<boolean> => {
    const item = items.value.find(item => item.id === id)
    if (!item) return false

    return await updateItem(id, { is_favorite: !item.isFavorite })
  }

  /**
   * Increment play count and update last played time
   */
  const incrementPlayCount = async (id: string): Promise<boolean> => {
    const item = items.value.find(item => item.id === id)
    if (!item) return false

    try {
      const result = await itemService.updateItem(id, {
        metadata: {
          ...item,
          video_url: item.videoUrl,
          video_type: item.videoType,
          thumbnail_url: item.thumbnailUrl,
          custom_thumbnail_url: item.customThumbnailUrl,
          duration_seconds: item.durationSeconds,
          play_count: item.playCount + 1,
          last_played_at: new Date().toISOString(),
        },
      })

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to update play count')
      }

      // Update local state
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index].playCount += 1
        items.value[index].lastPlayedAt = new Date()
      }

      return true
    } catch (err) {
      console.error('Failed to increment play count:', err)
      return false
    }
  }

  /**
   * Reorder items
   */
  const reorderItems = async (itemIds: string[]): Promise<boolean> => {
    if (!authStore.user) return false

    loading.value = true
    error.value = null

    try {
      // Use the reorderItems method from itemService
      const result = await itemService.reorderItems(itemIds)

      if (!result.success) {
        throw new Error(result.error || 'Failed to reorder items')
      }

      // Update local state
      items.value.forEach(item => {
        const newIndex = itemIds.indexOf(item.id)
        if (newIndex !== -1) {
          item.sortOrder = newIndex
        }
      })

      return true
    } catch (err) {
      console.error('Failed to reorder items:', err)
      error.value = 'Failed to reorder items'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Search items by title, description, or tags
   */
  const searchItems = (query: string): RadioItem[] => {
    if (!query.trim()) return items.value

    const lowerQuery = query.toLowerCase()
    return items.value.filter(
      item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  /**
   * Filter items by tags
   */
  const filterByTags = (tags: string[]): RadioItem[] => {
    if (tags.length === 0) return items.value

    return items.value.filter(item => tags.some(tag => item.tags.includes(tag)))
  }

  /**
   * Get all unique tags from items
   */
  const getAllTags = (): string[] => {
    const tagSet = new Set<string>()
    items.value.forEach(item => {
      item.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }

  /**
   * Transform database row to RadioItem
   */
  const transformFromRow = (row: RadioItemRow): RadioItem => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || undefined,
    videoUrl: row.video_url,
    videoType: row.video_type as RadioItem['videoType'],
    thumbnailUrl: row.thumbnail_url || undefined,
    customThumbnailUrl: row.custom_thumbnail_url || undefined,
    durationSeconds: row.duration_seconds || undefined,
    tags: row.tags || [],
    isFavorite: row.is_favorite,
    playCount: row.play_count,
    lastPlayedAt: row.last_played_at ? new Date(row.last_played_at) : undefined,
    sortOrder: row.sort_order,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  })

  /**
   * Extract metadata from video URL
   */
  const extractVideoMetadata = async (url: string): Promise<VideoMetadata> => {
    const metadata: VideoMetadata = {
      videoType: 'url',
    }

    try {
      // YouTube URL detection and metadata extraction
      const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
      if (youtubeMatch) {
        metadata.videoType = 'youtube'
        const videoId = youtubeMatch[1]
        metadata.thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

        // Note: In a real implementation, you'd use YouTube API to get title and duration
        // For now, we'll leave these undefined and let the user fill them in
      }

      // Vimeo URL detection
      const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
      if (vimeoMatch) {
        metadata.videoType = 'vimeo'
        // Note: In a real implementation, you'd use Vimeo API for metadata
      }
    } catch (err) {
      console.warn('Failed to extract video metadata:', err)
    }

    return metadata
  }

  return {
    // State
    items: sortedItems,
    loading,
    error,

    // Computed
    favoriteItems,
    recentItems,

    // Actions
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    toggleFavorite,
    incrementPlayCount,
    reorderItems,
    searchItems,
    filterByTags,
    getAllTags,
  }
}
