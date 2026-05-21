/**
 * New Radio Items Composable using the generic item service
 *
 * This replaces the old useRadioItems that used direct Supabase calls
 */

import { ref } from 'vue'
import { useRadio } from './useRadio'
import type { RadioItemType, VideoMetadata } from './useRadio'

export interface CreateRadioItemPayload {
  type: RadioItemType
  name: string
  url: string
  icon?: string
  color?: string
  video_metadata?: VideoMetadata
}

export interface UpdateRadioItemPayload {
  name?: string
  url?: string
  icon?: string
  color?: string
  video_metadata?: VideoMetadata
}

export function useRadioItems() {
  const radio = useRadio()

  // Additional state for compatibility
  const isCreating = ref(false)
  const isDeleting = ref(false)

  // Transform methods to match old API
  const fetchItems = async () => {
    await radio.refreshItems()
  }

  const createItem = async (payload: CreateRadioItemPayload) => {
    isCreating.value = true
    try {
      const item = await radio.createRadioItem(
        payload.type,
        payload.name,
        payload.url,
        payload.video_metadata ? { video: payload.video_metadata } : undefined,
        payload.icon,
        payload.color
      )
      return item
    } finally {
      isCreating.value = false
    }
  }

  const updateItem = async (itemId: string, payload: UpdateRadioItemPayload) => {
    const item = await radio.updateRadioItem(itemId, {
      name: payload.name,
      content: payload.url, // URL stored in content
      icon: payload.icon,
      color: payload.color,
      metadata: payload.video_metadata ? { video: payload.video_metadata } : undefined,
    })
    return item
  }

  const deleteItem = async (itemId: string) => {
    isDeleting.value = true
    try {
      const success = await radio.deleteItem(itemId)
      return success
    } finally {
      isDeleting.value = false
    }
  }

  const toggleFavorite = async (itemId: string) => {
    return radio.toggleFavorite(itemId)
  }

  const reorderItems = async (itemIds: string[]) => {
    return radio.reorderItems(itemIds)
  }

  return {
    // State
    items: radio.radioItems,
    isLoading: radio.loading,
    error: radio.error,
    isCreating,
    isDeleting,

    // Methods
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    toggleFavorite,
    reorderItems,
  }
}
