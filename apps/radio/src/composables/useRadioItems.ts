/**
 * Composable for managing radio items CRUD operations
 * Handles data persistence with Supabase and local state management
 */

import { ref, computed } from 'vue'
import { useAuthStore, itemService } from '@tiko/core'
import type { 
  RadioItem, 
  CreateRadioItemPayload, 
  UpdateRadioItemPayload, 
  RadioItemRow,
  VideoMetadata 
} from '../types/radio.types'

/**
 * Radio items management composable
 * 
 * Provides CRUD operations for radio items with Supabase integration.
 * Handles data transformation between UI models and database rows.
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
  const sortedItems = computed(() => 
    [...items.value].sort((a, b) => a.sortOrder - b.sortOrder)
  )
  
  const favoriteItems = computed(() => 
    items.value.filter(item => item.isFavorite)
  )
  
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
      console.log('Querying radio_items table...')
      const { data, error: fetchError } = await supabase
        .from('radio_items')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('sort_order', { ascending: true })

      console.log('Supabase fetch result:', { data, error: fetchError })

      if (fetchError) {
        throw fetchError
      }

      const transformedItems = (data || []).map(transformFromRow)
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
      
      const payload: CreateRadioItemPayload = {
        user_id: authStore.user.id,
        title: itemData.title || metadata.title || 'Untitled Audio',
        description: itemData.description || '',
        video_url: itemData.videoUrl || '',
        video_type: metadata.videoType,
        thumbnail_url: metadata.thumbnailUrl,
        custom_thumbnail_url: itemData.customThumbnailUrl,
        duration_seconds: metadata.durationSeconds,
        tags: itemData.tags || [],
        sort_order: items.value.length
      }

      console.log('Payload being sent to Supabase:', payload)

      const { data, error: insertError } = await supabase
        .from('radio_items')
        .insert([payload])
        .select()
        .single()

      console.log('Supabase insert result:', { data, error: insertError })

      if (insertError) {
        throw insertError
      }

      const newItem = transformFromRow(data)
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
      const { data, error: updateError } = await supabase
        .from('radio_items')
        .update(updates)
        .eq('id', id)
        .eq('user_id', authStore.user.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // Update local state
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = transformFromRow(data)
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
      const { error: deleteError } = await supabase
        .from('radio_items')
        .delete()
        .eq('id', id)
        .eq('user_id', authStore.user.id)

      if (deleteError) {
        throw deleteError
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
      const { error: updateError } = await supabase
        .from('radio_items')
        .update({
          play_count: item.playCount + 1,
          last_played_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', authStore.user?.id)

      if (updateError) {
        throw updateError
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
      // Update sort orders in database
      const updates = itemIds.map((id, index) => ({
        id,
        sort_order: index
      }))

      for (const update of updates) {
        await supabase
          .from('radio_items')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
          .eq('user_id', authStore.user.id)
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
    return items.value.filter(item =>
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

    return items.value.filter(item =>
      tags.some(tag => item.tags.includes(tag))
    )
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
    updatedAt: new Date(row.updated_at)
  })

  /**
   * Extract metadata from video URL
   */
  const extractVideoMetadata = async (url: string): Promise<VideoMetadata> => {
    const metadata: VideoMetadata = {
      videoType: 'url'
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
    getAllTags
  }
}