/**
 * Generic Items Composable
 * 
 * @module composables/useItems
 * @description
 * Composable for managing items across all Tiko apps.
 * Provides reactive state management and convenient methods.
 */

import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import { itemService } from '../services/item.service'
import type { BaseItem, ItemFilters, CreateItemPayload, UpdateItemPayload, ItemStats } from '../services/item.service'
import { useAuthStore } from '../stores/auth'

/**
 * Item composable options
 */
export interface UseItemsOptions {
  appName: string
  autoLoad?: boolean
  filters?: ItemFilters
  syncToLocalStorage?: boolean
}

/**
 * Item composable return type
 */
export interface UseItemsReturn {
  // State
  items: Ref<BaseItem[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  stats: Ref<ItemStats | null>
  
  // Computed
  itemsByParent: ComputedRef<Map<string | null | undefined, BaseItem[]>>
  favoriteItems: ComputedRef<BaseItem[]>
  completedItems: ComputedRef<BaseItem[]>
  publicItems: ComputedRef<BaseItem[]>
  
  // Methods
  loadItems: (filters?: ItemFilters) => Promise<void>
  createItem: (payload: Omit<CreateItemPayload, 'app_name'>) => Promise<BaseItem | null>
  updateItem: (itemId: string, payload: UpdateItemPayload) => Promise<BaseItem | null>
  deleteItem: (itemId: string) => Promise<boolean>
  toggleFavorite: (itemId: string) => Promise<BaseItem | null>
  toggleComplete: (itemId: string) => Promise<BaseItem | null>
  togglePublic: (itemId: string) => Promise<BaseItem | null>
  reorderItems: (itemIds: string[], parentId?: string) => Promise<boolean>
  moveItem: (itemId: string, newParentId: string | null, newIndex?: number) => Promise<BaseItem | null>
  searchItems: (query: string) => Promise<void>
  loadStats: () => Promise<void>
  refreshItems: () => Promise<void>
  
  // Utilities
  getItemById: (itemId: string) => BaseItem | undefined
  getItemsByType: (type: string) => BaseItem[]
  getItemsByTags: (tags: string[]) => BaseItem[]
}

/**
 * Generic items composable
 * 
 * @param options - Configuration options
 * @returns Items management interface
 * 
 * @example
 * // In a todo app
 * const todos = useItems({
 *   appName: 'todo',
 *   autoLoad: true,
 *   filters: { type: 'todo_item' }
 * })
 * 
 * // Create a new todo
 * await todos.createItem({
 *   type: 'todo_item',
 *   name: 'Buy groceries',
 *   parent_id: 'group-123'
 * })
 * 
 * // Toggle completion
 * await todos.toggleComplete(todoId)
 */
export function useItems(options: UseItemsOptions): UseItemsReturn {
  const authStore = useAuthStore()
  
  // State
  const items = ref<BaseItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const stats = ref<ItemStats | null>(null)
  
  // Computed
  const itemsByParent = computed(() => {
    const map = new Map<string | null | undefined, BaseItem[]>()
    
    items.value.forEach(item => {
      const parentId = item.parent_id
      if (!map.has(parentId)) {
        map.set(parentId, [])
      }
      map.get(parentId)!.push(item)
    })
    
    // Sort items within each parent group
    map.forEach(items => {
      items.sort((a, b) => a.order_index - b.order_index)
    })
    
    return map
  })
  
  const favoriteItems = computed(() => 
    items.value.filter(item => item.is_favorite)
  )
  
  const completedItems = computed(() => 
    items.value.filter(item => item.is_completed)
  )
  
  const publicItems = computed(() => 
    items.value.filter(item => item.is_public)
  )
  
  // Methods
  const loadItems = async (filters?: ItemFilters) => {
    if (!authStore.user) return
    
    loading.value = true
    error.value = null
    
    try {
      const result = await itemService.getItems(authStore.user.id, {
        app_name: options.appName,
        ...options.filters,
        ...filters
      })
      
      if (result.success && result.data) {
        items.value = result.data
      } else {
        error.value = result.error || 'Failed to load items'
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load items'
      console.error('Failed to load items:', err)
    } finally {
      loading.value = false
    }
  }
  
  const createItem = async (payload: Omit<CreateItemPayload, 'app_name'>): Promise<BaseItem | null> => {
    if (!authStore.user) return null
    
    try {
      const result = await itemService.createItem({
        ...payload,
        app_name: options.appName,
        user_id: authStore.user.id
      })
      
      items.value.push(result)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create item'
      return null
    }
  }
  
  const updateItem = async (itemId: string, payload: UpdateItemPayload): Promise<BaseItem | null> => {
    try {
      const result = await itemService.updateItem(itemId, payload)
      
      const index = items.value.findIndex(i => i.id === itemId)
      if (index !== -1) {
        items.value[index] = result
      }
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update item'
      return null
    }
  }
  
  const deleteItem = async (itemId: string): Promise<boolean> => {
    try {
      await itemService.deleteItem(itemId)
      
      // Remove item and its children from local state
      const idsToRemove = new Set([itemId])
      let hasNewIds = true
      
      while (hasNewIds) {
        const currentSize = idsToRemove.size
        items.value.forEach(item => {
          if (item.parent_id && idsToRemove.has(item.parent_id)) {
            idsToRemove.add(item.id)
          }
        })
        hasNewIds = idsToRemove.size > currentSize
      }
      
      items.value = items.value.filter(item => !idsToRemove.has(item.id))
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete item'
      return false
    }
  }
  
  const toggleFavorite = async (itemId: string): Promise<BaseItem | null> => {
    const item = items.value.find(i => i.id === itemId)
    if (!item) return null
    
    return updateItem(itemId, { is_favorite: !item.is_favorite })
  }
  
  const toggleComplete = async (itemId: string): Promise<BaseItem | null> => {
    const item = items.value.find(i => i.id === itemId)
    if (!item) return null
    
    return updateItem(itemId, { is_completed: !item.is_completed })
  }
  
  const togglePublic = async (itemId: string): Promise<BaseItem | null> => {
    const item = items.value.find(i => i.id === itemId)
    if (!item) return null
    
    return updateItem(itemId, { is_public: !item.is_public })
  }
  
  const reorderItems = async (itemIds: string[], parentId?: string): Promise<boolean> => {
    try {
      // Filter to only items that belong to the specified parent
      const validIds = itemIds.filter(id => {
        const item = items.value.find(i => i.id === id)
        return item && item.parent_id === parentId
      })
      
      const result = await itemService.reorderItems(validIds)
      
      if (result.success) {
        // Update local order
        validIds.forEach((id, index) => {
          const item = items.value.find(i => i.id === id)
          if (item) {
            item.order_index = index
          }
        })
        return true
      }
      
      error.value = result.error || 'Failed to reorder items'
      return false
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reorder items'
      return false
    }
  }
  
  const moveItem = async (itemId: string, newParentId: string | null, newIndex?: number): Promise<BaseItem | null> => {
    try {
      const result = await itemService.moveItem(itemId, newParentId, newIndex)
      
      if (result.success && result.data) {
        const index = items.value.findIndex(i => i.id === itemId)
        if (index !== -1) {
          items.value[index] = result.data
        }
        return result.data
      }
      
      error.value = result.error || 'Failed to move item'
      return null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to move item'
      return null
    }
  }
  
  const searchItems = async (query: string) => {
    if (!authStore.user) return
    
    loading.value = true
    error.value = null
    
    try {
      const result = await itemService.getItems(authStore.user.id, {
        app_name: options.appName,
        search: query,
        ...options.filters
      })
      
      if (result.success && result.data) {
        items.value = result.data
      } else {
        error.value = result.error || 'Failed to search items'
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to search items'
    } finally {
      loading.value = false
    }
  }
  
  const loadStats = async () => {
    if (!authStore.user) return
    
    try {
      stats.value = await itemService.getStats(authStore.user.id, options.appName)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }
  
  const refreshItems = async () => {
    await loadItems()
    await loadStats()
  }
  
  // Utilities
  const getItemById = (itemId: string): BaseItem | undefined => {
    return items.value.find(item => item.id === itemId)
  }
  
  const getItemsByType = (type: string): BaseItem[] => {
    return items.value.filter(item => item.type === type)
  }
  
  const getItemsByTags = (tags: string[]): BaseItem[] => {
    return items.value.filter(item => 
      item.tags && tags.some(tag => item.tags!.includes(tag))
    )
  }
  
  // Auto-load if requested
  if (options.autoLoad && authStore.user) {
    loadItems()
  }
  
  // Watch for auth changes
  watch(() => authStore.user, (user) => {
    if (user && options.autoLoad) {
      loadItems()
    } else if (!user) {
      items.value = []
      stats.value = null
    }
  })
  
  return {
    // State
    items,
    loading,
    error,
    stats,
    
    // Computed
    itemsByParent,
    favoriteItems,
    completedItems,
    publicItems,
    
    // Methods
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    toggleFavorite,
    toggleComplete,
    togglePublic,
    reorderItems,
    moveItem,
    searchItems,
    loadStats,
    refreshItems,
    
    // Utilities
    getItemById,
    getItemsByType,
    getItemsByTags
  }
}