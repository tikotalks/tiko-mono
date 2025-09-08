/**
 * Radio-specific wrapper around the generic items composable
 *
 * @module composables/useRadio
 * @description
 * Provides radio-specific functionality on top of the generic items system.
 */

import { computed, type ComputedRef } from 'vue'
import { useItems, type BaseItem } from '@tiko/core'

/**
 * Radio item types
 */
export type RadioItemType = 'youtube' | 'url' | 'playlist'

/**
 * Video metadata stored in item metadata
 */
export interface VideoMetadata {
  title?: string
  author?: string
  duration?: number
  thumbnail?: string
}

/**
 * Radio item extending BaseItem
 */
export interface RadioItem extends BaseItem {
  type: RadioItemType
  metadata?: {
    video?: VideoMetadata
    url?: string
  }
}

/**
 * Radio composable return type
 */
export interface UseRadioReturn {
  // All from useItems
  items: ReturnType<typeof useItems>['items']
  loading: ReturnType<typeof useItems>['loading']
  error: ReturnType<typeof useItems>['error']

  // Radio-specific computed
  radioItems: ComputedRef<RadioItem[]>
  youtubeItems: ComputedRef<RadioItem[]>
  urlItems: ComputedRef<RadioItem[]>
  playlists: ComputedRef<RadioItem[]>
  favoriteItems: ComputedRef<RadioItem[]>

  // Radio-specific methods
  createRadioItem: (
    type: RadioItemType,
    name: string,
    url: string,
    metadata?: { video?: VideoMetadata },
    icon?: string,
    color?: string
  ) => Promise<RadioItem | null>
  updateRadioItem: (itemId: string, updates: Partial<RadioItem>) => Promise<RadioItem | null>
  toggleFavorite: (itemId: string) => Promise<RadioItem | null>
  getItemByUrl: (url: string) => RadioItem | undefined

  // Re-export useful methods
  deleteItem: ReturnType<typeof useItems>['deleteItem']
  reorderItems: ReturnType<typeof useItems>['reorderItems']
  refreshItems: ReturnType<typeof useItems>['refreshItems']
}

/**
 * Radio composable
 *
 * @returns Radio management interface
 *
 * @example
 * const radio = useRadio()
 *
 * // Add a YouTube video
 * await radio.createRadioItem(
 *   'youtube',
 *   'Lofi Hip Hop Radio',
 *   'https://youtube.com/watch?v=...',
 *   {
 *     video: {
 *       title: 'Lofi Hip Hop Radio - Beats to Study/Relax to',
 *       author: 'Lofi Girl',
 *       thumbnail: 'https://...'
 *     }
 *   }
 * )
 *
 * // Toggle favorite
 * await radio.toggleFavorite(itemId)
 */
export function useRadio(): UseRadioReturn {
  // Use the generic items composable
  const items = useItems({
    appName: 'radio',
    autoLoad: true,
  })

  // Radio-specific computed properties
  const radioItems = computed<RadioItem[]>(() => items.items.value as RadioItem[])

  const youtubeItems = computed<RadioItem[]>(() =>
    radioItems.value.filter(item => item.type === 'youtube')
  )

  const urlItems = computed<RadioItem[]>(() => radioItems.value.filter(item => item.type === 'url'))

  const playlists = computed<RadioItem[]>(() =>
    radioItems.value.filter(item => item.type === 'playlist')
  )

  const favoriteItems = computed<RadioItem[]>(() =>
    radioItems.value.filter(item => item.is_favorite)
  )

  // Radio-specific methods
  const createRadioItem = async (
    type: RadioItemType,
    name: string,
    url: string,
    metadata?: { video?: VideoMetadata },
    icon?: string,
    color?: string
  ): Promise<RadioItem | null> => {
    const result = await items.createItem({
      type,
      name,
      content: url, // Store URL in content field
      metadata: {
        ...metadata,
        url, // Also store in metadata for easier access
      },
      icon,
      color,
      is_favorite: false,
    })

    return result as RadioItem | null
  }

  const updateRadioItem = async (
    itemId: string,
    updates: Partial<RadioItem>
  ): Promise<RadioItem | null> => {
    const { metadata, ...otherUpdates } = updates

    const result = await items.updateItem(itemId, {
      ...otherUpdates,
      metadata: metadata ? { ...metadata } : undefined,
    })

    return result as RadioItem | null
  }

  const toggleFavorite = async (itemId: string): Promise<RadioItem | null> => {
    const result = await items.toggleFavorite(itemId)
    return result as RadioItem | null
  }

  const getItemByUrl = (url: string): RadioItem | undefined => {
    return radioItems.value.find(item => item.content === url || item.metadata?.url === url)
  }

  return {
    // State
    items: items.items,
    loading: items.loading,
    error: items.error,

    // Radio-specific computed
    radioItems,
    youtubeItems,
    urlItems,
    playlists,
    favoriteItems,

    // Radio-specific methods
    createRadioItem,
    updateRadioItem,
    toggleFavorite,
    getItemByUrl,

    // Re-export useful methods
    deleteItem: items.deleteItem,
    reorderItems: items.reorderItems,
    refreshItems: items.refreshItems,
  }
}
