/**
 * Generic Item Service
 *
 * @module services/item.service
 * @description
 * Generic service for managing items across all Tiko apps.
 * Provides a unified API for todo items, radio stations, cards, etc.
 */

/**
 * Base item structure shared by all apps
 */
export interface BaseItem {
  id: string
  user_id: string
  app_name: string // 'todo', 'radio', 'cards', etc.
  type: string // app-specific type (e.g., 'todo_item', 'radio_station', 'card')
  name: string
  content?: string // flexible content field
  metadata?: Record<string, any> // app-specific data
  parent_id?: string // for hierarchical items (e.g., todo items in groups)
  order_index: number
  is_favorite?: boolean
  is_completed?: boolean
  is_public?: boolean
  is_curated?: boolean // Admin-curated items
  tags?: string[]
  icon?: string
  color?: string
  created_at: string
  updated_at: string
}

/**
 * Query filters for items
 */
export interface ItemFilters {
  app_name?: string
  type?: string
  parent_id?: string | null
  is_favorite?: boolean
  is_completed?: boolean
  is_public?: boolean
  tags?: string[]
  search?: string
}

/**
 * Create item payload
 */
export interface CreateItemPayload {
  app_name: string
  type: string
  name: string
  content?: string
  metadata?: Record<string, any>
  parent_id?: string
  order_index?: number
  is_favorite?: boolean
  is_completed?: boolean
  is_public?: boolean
  tags?: string[]
  icon?: string
  color?: string
}

/**
 * Update item payload
 */
export interface UpdateItemPayload {
  name?: string
  content?: string
  metadata?: Record<string, any>
  parent_id?: string
  order_index?: number
  is_favorite?: boolean
  is_completed?: boolean
  is_public?: boolean
  tags?: string[]
  icon?: string
  color?: string
}

/**
 * Bulk update payload
 */
export interface BulkUpdatePayload {
  ids: string[]
  updates: UpdateItemPayload
}

/**
 * Item service result
 */
export interface ItemResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Item statistics
 */
export interface ItemStats {
  total: number
  by_app: Record<string, number>
  by_type: Record<string, number>
  favorites: number
  completed: number
  public: number
}

/**
 * Item service interface
 */
export interface ItemService {
  // CRUD operations
  getItems(userId: string, filters?: ItemFilters): Promise<BaseItem[]>
  getItem(itemId: string): Promise<BaseItem | null>
  createItem(userId: string, payload: CreateItemPayload): Promise<ItemResult<BaseItem>>
  updateItem(itemId: string, payload: UpdateItemPayload): Promise<ItemResult<BaseItem>>
  deleteItem(itemId: string): Promise<ItemResult>

  // Bulk operations
  createItems(userId: string, payloads: CreateItemPayload[]): Promise<ItemResult<BaseItem[]>>
  updateItems(payload: BulkUpdatePayload): Promise<ItemResult<BaseItem[]>>
  deleteItems(itemIds: string[]): Promise<ItemResult>

  // Specialized queries
  getItemsByParent(parentId: string): Promise<BaseItem[]>
  getPublicItems(filters?: ItemFilters): Promise<BaseItem[]>
  searchItems(userId: string, query: string, filters?: ItemFilters): Promise<BaseItem[]>

  // Ordering
  reorderItems(itemIds: string[], startIndex?: number): Promise<ItemResult>
  moveItem(itemId: string, newParentId: string | null, newIndex?: number): Promise<ItemResult<BaseItem>>

  // Statistics
  getStats(userId: string, appName?: string): Promise<ItemStats>

  // Import/Export
  exportItems(userId: string, filters?: ItemFilters): Promise<BaseItem[]>
  importItems(userId: string, items: Omit<BaseItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]): Promise<ItemResult<BaseItem[]>>
}

/**
 * Create localStorage-based item service
 */
export function createLocalStorageItemService(): ItemService {
  const ITEMS_KEY = 'tiko_items'

  const getStoredItems = (): BaseItem[] => {
    const stored = localStorage.getItem(ITEMS_KEY)
    return stored ? JSON.parse(stored) : []
  }

  const saveItems = (items: BaseItem[]) => {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items))
  }

  const applyFilters = (items: BaseItem[], filters?: ItemFilters): BaseItem[] => {
    if (!filters) return items

    let filtered = items

    if (filters.app_name) {
      filtered = filtered.filter(item => item.app_name === filters.app_name)
    }

    if (filters.type) {
      filtered = filtered.filter(item => item.type === filters.type)
    }

    if (filters.parent_id !== undefined) {
      filtered = filtered.filter(item => item.parent_id === filters.parent_id)
    }

    if (filters.is_favorite !== undefined) {
      filtered = filtered.filter(item => item.is_favorite === filters.is_favorite)
    }

    if (filters.is_completed !== undefined) {
      filtered = filtered.filter(item => item.is_completed === filters.is_completed)
    }

    if (filters.is_public !== undefined) {
      filtered = filtered.filter(item => item.is_public === filters.is_public)
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(item =>
        item.tags && filters.tags!.some(tag => item.tags!.includes(tag))
      )
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        (item.content && item.content.toLowerCase().includes(searchLower))
      )
    }

    return filtered
  }

  return {
    // CRUD operations
    async getItems(userId: string, filters?: ItemFilters): Promise<BaseItem[]> {
      const items = getStoredItems().filter(item => item.user_id === userId)
      const filtered = applyFilters(items, filters)
      return filtered.sort((a, b) => a.order_index - b.order_index)
    },

    async getItem(itemId: string): Promise<BaseItem | null> {
      return getStoredItems().find(item => item.id === itemId) || null
    },

    async createItem(userId: string, payload: CreateItemPayload): Promise<ItemResult<BaseItem>> {
      const items = getStoredItems()

      // Calculate order index if not provided
      let orderIndex = payload.order_index
      if (orderIndex === undefined) {
        const siblingItems = items.filter(item =>
          item.user_id === userId &&
          item.app_name === payload.app_name &&
          item.parent_id === payload.parent_id
        )
        orderIndex = siblingItems.length
      }

      const newItem: BaseItem = {
        id: crypto.randomUUID(),
        user_id: userId,
        app_name: payload.app_name,
        type: payload.type,
        name: payload.name,
        content: payload.content,
        metadata: payload.metadata,
        parent_id: payload.parent_id,
        order_index: orderIndex,
        is_favorite: payload.is_favorite,
        is_completed: payload.is_completed,
        is_public: payload.is_public,
        tags: payload.tags,
        icon: payload.icon,
        color: payload.color,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      items.push(newItem)
      saveItems(items)

      return { success: true, data: newItem }
    },

    async updateItem(itemId: string, payload: UpdateItemPayload): Promise<ItemResult<BaseItem>> {
      const items = getStoredItems()
      const index = items.findIndex(item => item.id === itemId)

      if (index === -1) {
        return { success: false, error: 'Item not found' }
      }

      items[index] = {
        ...items[index],
        ...payload,
        updated_at: new Date().toISOString()
      }

      saveItems(items)
      return { success: true, data: items[index] }
    },

    async deleteItem(itemId: string): Promise<ItemResult> {
      const items = getStoredItems()

      // Delete item and its children recursively
      const idsToDelete = new Set([itemId])
      let hasNewIds = true

      while (hasNewIds) {
        const currentSize = idsToDelete.size
        items.forEach(item => {
          if (item.parent_id && idsToDelete.has(item.parent_id)) {
            idsToDelete.add(item.id)
          }
        })
        hasNewIds = idsToDelete.size > currentSize
      }

      const filtered = items.filter(item => !idsToDelete.has(item.id))
      saveItems(filtered)

      return { success: true }
    },

    // Bulk operations
    async createItems(userId: string, payloads: CreateItemPayload[]): Promise<ItemResult<BaseItem[]>> {
      const newItems: BaseItem[] = []

      for (const payload of payloads) {
        const result = await this.createItem(userId, payload)
        if (result.success && result.data) {
          newItems.push(result.data)
        }
      }

      return { success: true, data: newItems }
    },

    async updateItems(payload: BulkUpdatePayload): Promise<ItemResult<BaseItem[]>> {
      const items = getStoredItems()
      const updatedItems: BaseItem[] = []
      const now = new Date().toISOString()

      payload.ids.forEach(id => {
        const index = items.findIndex(item => item.id === id)
        if (index !== -1) {
          items[index] = {
            ...items[index],
            ...payload.updates,
            updated_at: now
          }
          updatedItems.push(items[index])
        }
      })

      saveItems(items)
      return { success: true, data: updatedItems }
    },

    async deleteItems(itemIds: string[]): Promise<ItemResult> {
      for (const id of itemIds) {
        await this.deleteItem(id)
      }
      return { success: true }
    },

    // Specialized queries
    async getItemsByParent(parentId: string): Promise<BaseItem[]> {
      return getStoredItems()
        .filter(item => item.parent_id === parentId)
        .sort((a, b) => a.order_index - b.order_index)
    },

    async getPublicItems(filters?: ItemFilters): Promise<BaseItem[]> {
      const items = getStoredItems().filter(item => item.is_public)
      const filtered = applyFilters(items, filters)
      return filtered.sort((a, b) => a.order_index - b.order_index)
    },

    async searchItems(userId: string, query: string, filters?: ItemFilters): Promise<BaseItem[]> {
      const items = await this.getItems(userId, { ...filters, search: query })
      return items
    },

    // Ordering
    async reorderItems(itemIds: string[], startIndex = 0): Promise<ItemResult> {
      const items = getStoredItems()
      const now = new Date().toISOString()

      itemIds.forEach((id, index) => {
        const item = items.find(i => i.id === id)
        if (item) {
          item.order_index = startIndex + index
          item.updated_at = now
        }
      })

      saveItems(items)
      return { success: true }
    },

    async moveItem(itemId: string, newParentId: string | null, newIndex?: number): Promise<ItemResult<BaseItem>> {
      const items = getStoredItems()
      const item = items.find(i => i.id === itemId)

      if (!item) {
        return { success: false, error: 'Item not found' }
      }

      // Update parent
      item.parent_id = newParentId || undefined

      // Update order index
      if (newIndex !== undefined) {
        item.order_index = newIndex
      } else {
        // Place at end of siblings
        const siblings = items.filter(i =>
          i.user_id === item.user_id &&
          i.app_name === item.app_name &&
          i.parent_id === newParentId
        )
        item.order_index = siblings.length
      }

      item.updated_at = new Date().toISOString()

      saveItems(items)
      return { success: true, data: item }
    },

    // Statistics
    async getStats(userId: string, appName?: string): Promise<ItemStats> {
      const items = getStoredItems().filter(item =>
        item.user_id === userId &&
        (!appName || item.app_name === appName)
      )

      const stats: ItemStats = {
        total: items.length,
        by_app: {},
        by_type: {},
        favorites: items.filter(i => i.is_favorite).length,
        completed: items.filter(i => i.is_completed).length,
        public: items.filter(i => i.is_public).length
      }

      items.forEach(item => {
        stats.by_app[item.app_name] = (stats.by_app[item.app_name] || 0) + 1
        stats.by_type[item.type] = (stats.by_type[item.type] || 0) + 1
      })

      return stats
    },

    // Import/Export
    async exportItems(userId: string, filters?: ItemFilters): Promise<BaseItem[]> {
      return this.getItems(userId, filters)
    },

    async importItems(userId: string, items: Omit<BaseItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]): Promise<ItemResult<BaseItem[]>> {
      const now = new Date().toISOString()
      const newItems: BaseItem[] = items.map(item => ({
        ...item,
        id: crypto.randomUUID(),
        user_id: userId,
        created_at: now,
        updated_at: now
      }))

      const existingItems = getStoredItems()
      existingItems.push(...newItems)
      saveItems(existingItems)

      return { success: true, data: newItems }
    }
  }
}

// Default service instance
export const itemService: ItemService = createLocalStorageItemService()
