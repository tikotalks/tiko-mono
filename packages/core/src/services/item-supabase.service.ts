/**
 * Supabase Item Service Implementation
 *
 * @module services/item-supabase.service
 * @description
 * Supabase implementation of the ItemService interface.
 * Uses direct API calls to bypass SDK issues.
 */

import type {
  ItemService,
  BaseItem,
  ItemFilters,
  CreateItemPayload,
  UpdateItemPayload,
  BulkUpdatePayload,
  ItemResult,
  ItemStats
} from './item.service'

/**
 * Create a Supabase-based item service
 */
export class SupabaseItemService implements ItemService {
  private supabaseUrl: string
  private supabaseKey: string

  constructor() {
    this.supabaseUrl = import.meta.env['VITE_SUPABASE_URL']
    this.supabaseKey = import.meta.env?.VITE_SUPABASE_SECRET || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY

    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Supabase URL and secret/publishable key are required')
    }
  }

  /**
   * Get current auth token from localStorage
   */
  private getAuthToken(): string | null {
    const sessionData = localStorage.getItem('tiko_auth_session')
    if (!sessionData) return null

    try {
      const session = JSON.parse(sessionData)
      return session.access_token
    } catch {
      return null
    }
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken()

    const response = await fetch(`${this.supabaseUrl}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.supabaseKey,
        'Authorization': token ? `Bearer ${token}` : '',
        'Prefer': 'return=representation',
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API request failed: ${error}`)
    }

    return response.json()
  }

  /**
   * Apply filters to query string
   */
  private applyFiltersToQuery(filters?: ItemFilters): string {
    const params = new URLSearchParams()

    if (filters?.app_name) {
      params.append('app_name', `eq.${filters.app_name}`)
    }

    if (filters?.type) {
      params.append('type', `eq.${filters.type}`)
    }

    if (filters?.parent_id !== undefined) {
      if (filters.parent_id === null) {
        params.append('parent_id', 'is.null')
      } else {
        params.append('parent_id', `eq.${filters.parent_id}`)
      }
    }

    if (filters?.is_favorite !== undefined) {
      params.append('is_favorite', `eq.${filters.is_favorite}`)
    }

    if (filters?.is_completed !== undefined) {
      params.append('is_completed', `eq.${filters.is_completed}`)
    }

    if (filters?.is_public !== undefined) {
      params.append('is_public', `eq.${filters.is_public}`)
    }

    if (filters?.tags && filters.tags.length > 0) {
      params.append('tags', `cs.{${filters.tags.join(',')}}`)
    }

    if (filters?.search) {
      params.append('or', `(name.ilike.%${filters.search}%,content.ilike.%${filters.search}%)`)
    }

    return params.toString()
  }

  // CRUD operations
  async getItems(userId: string, filters?: ItemFilters): Promise<ItemResult<BaseItem[]>> {
    try {
      const queryParams = this.applyFiltersToQuery(filters)
      const userFilter = `user_id=eq.${userId}`
      const orderBy = 'order_index=asc'
      const fullQuery = queryParams ? `${userFilter}&${queryParams}&${orderBy}` : `${userFilter}&${orderBy}`

      const data = await this.apiRequest<BaseItem[]>(`items?${fullQuery}`)
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async getItem(itemId: string): Promise<BaseItem | null> {
    try {
      const items = await this.apiRequest<BaseItem[]>(`items?id=eq.${itemId}`)
      return items[0] || null
    } catch {
      return null
    }
  }

  async createItem(payload: CreateItemPayload): Promise<BaseItem> {
    const newItem = {
      ...payload,
      is_favorite: payload.is_favorite || false,
      is_completed: payload.is_completed || false,
      is_public: payload.is_public || false,
      tags: payload.tags || []
    }

    const result = await this.apiRequest<BaseItem[]>('items', {
      method: 'POST',
      body: JSON.stringify(newItem)
    })

    return result[0]
  }

  async updateItem(itemId: string, payload: UpdateItemPayload): Promise<BaseItem> {
    // Handle public/curated relationship: when making item non-public, also remove curated status
    const updatePayload = { ...payload }
    if (payload.is_public === false) {
      updatePayload.is_curated = false
    }

    const result = await this.apiRequest<BaseItem[]>(`items?id=eq.${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...updatePayload,
        updated_at: new Date().toISOString()
      })
    })

    if (result.length === 0) {
      throw new Error('Item not found')
    }

    return result[0]
  }

  async deleteItem(itemId: string): Promise<void> {
    // First get all children
    const children = await this.getItemChildren(itemId)
    const idsToDelete = [itemId, ...children.map(c => c.id)]

    // Delete all items
    await this.apiRequest(`items?id=in.(${idsToDelete.join(',')})`, {
      method: 'DELETE'
    })
  }

  // Helper to get all children recursively
  private async getItemChildren(parentId: string): Promise<BaseItem[]> {
    const directChildren = await this.apiRequest<BaseItem[]>(`items?parent_id=eq.${parentId}`)
    const allChildren = [...directChildren]

    for (const child of directChildren) {
      const grandChildren = await this.getItemChildren(child.id)
      allChildren.push(...grandChildren)
    }

    return allChildren
  }

  // Bulk operations
  async createItems(userId: string, payloads: CreateItemPayload[]): Promise<ItemResult<BaseItem[]>> {
    try {
      const items = await Promise.all(
        payloads.map(async (payload, index) => {
          let orderIndex = payload.order_index
          if (orderIndex === undefined) {
            orderIndex = index
          }

          return {
            user_id: userId,
            app_name: payload.app_name,
            type: payload.type,
            name: payload.name,
            content: payload.content,
            metadata: payload.metadata,
            parent_id: payload.parent_id,
            order_index: orderIndex,
            is_favorite: payload.is_favorite || false,
            is_completed: payload.is_completed || false,
            is_public: payload.is_public || false,
            tags: payload.tags || [],
            icon: payload.icon,
            color: payload.color
          }
        })
      )

      const result = await this.apiRequest<BaseItem[]>('items', {
        method: 'POST',
        body: JSON.stringify(items)
      })

      return { success: true, data: result }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create items'
      }
    }
  }

  async updateItems(payload: BulkUpdatePayload): Promise<ItemResult<BaseItem[]>> {
    try {
      // Handle public/curated relationship: when making items non-public, also remove curated status
      const updatePayload = { ...payload.updates }
      if (payload.updates.is_public === false) {
        updatePayload.is_curated = false
      }

      const result = await this.apiRequest<BaseItem[]>(
        `items?id=in.(${payload.ids.join(',')})`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            ...updatePayload,
            updated_at: new Date().toISOString()
          })
        }
      )

      return { success: true, data: result }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update items'
      }
    }
  }

  async deleteItems(itemIds: string[]): Promise<ItemResult> {
    try {
      // Get all items including children
      const allIdsToDelete = new Set(itemIds)

      for (const id of itemIds) {
        const children = await this.getItemChildren(id)
        children.forEach(child => allIdsToDelete.add(child.id))
      }

      await this.apiRequest(`items?id=in.(${Array.from(allIdsToDelete).join(',')})`, {
        method: 'DELETE'
      })

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete items'
      }
    }
  }

  // Specialized queries
  async getItemsByParent(parentId: string): Promise<BaseItem[]> {
    return this.apiRequest<BaseItem[]>(`items?parent_id=eq.${parentId}&order=order_index.asc`)
  }


  async searchItems(userId: string, query: string, filters?: ItemFilters): Promise<BaseItem[]> {
    const result = await this.getItems(userId, { ...filters, search: query })
    return result.success && result.data ? result.data : []
  }

  // Ordering
  async reorderItems(itemIds: string[]): Promise<ItemResult<void>> {
    try {
      const updates = itemIds.map((id, index) => ({
        id,
        order_index: index,
        updated_at: new Date().toISOString()
      }))

      // Update each item's order
      await Promise.all(
        updates.map(update =>
          this.apiRequest(`items?id=eq.${update.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              order_index: update.order_index,
              updated_at: update.updated_at
            })
          })
        )
      )

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reorder items'
      }
    }
  }

  async moveItem(itemId: string, newParentId: string | null, newIndex?: number): Promise<ItemResult<BaseItem>> {
    try {
      const item = await this.getItem(itemId)
      if (!item) {
        return { success: false, error: 'Item not found' }
      }

      // Calculate new index if not provided
      let orderIndex = newIndex
      if (orderIndex === undefined) {
        const siblings = await this.apiRequest<BaseItem[]>(
          `items?user_id=eq.${item.user_id}&app_name=eq.${item.app_name}&parent_id=${newParentId ? `eq.${newParentId}` : 'is.null'}`
        )
        orderIndex = siblings.length
      }

      const result = await this.apiRequest<BaseItem[]>(`items?id=eq.${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          parent_id: newParentId,
          order_index: orderIndex,
          updated_at: new Date().toISOString()
        })
      })

      return { success: true, data: result[0] }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to move item'
      }
    }
  }

  // Statistics
  async getStats(userId: string, appName?: string): Promise<ItemStats> {
    const filters: ItemFilters = appName ? { app_name: appName } : {}
    const result = await this.getItems(userId, filters)

    if (!result.success || !result.data) {
      return {
        total: 0,
        by_app: {},
        by_type: {},
        favorites: 0,
        completed: 0,
        public: 0
      }
    }

    const items = result.data
    const stats: ItemStats = {
      total: items.length,
      by_app: {},
      by_type: {},
      favorites: items.filter((i: BaseItem) => i.is_favorite).length,
      completed: items.filter((i: BaseItem) => i.is_completed).length,
      public: items.filter((i: BaseItem) => i.is_public).length
    }

    items.forEach((item: BaseItem) => {
      stats.by_app[item.app_name] = (stats.by_app[item.app_name] || 0) + 1
      stats.by_type[item.type] = (stats.by_type[item.type] || 0) + 1
    })

    return stats
  }

  // Import/Export
  async exportItems(userId: string, filters?: ItemFilters): Promise<BaseItem[]> {
    const result = await this.getItems(userId, filters)
    return result.success && result.data ? result.data : []
  }

  async importItems(userId: string, items: Omit<BaseItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]): Promise<ItemResult<BaseItem[]>> {
    const payloads: CreateItemPayload[] = items.map(item => ({
      app_name: item.app_name,
      type: item.type,
      name: item.name,
      content: item.content,
      metadata: item.metadata,
      parent_id: item.parent_id,
      order_index: item.order_index,
      is_favorite: item.is_favorite,
      is_completed: item.is_completed,
      is_public: item.is_public,
      tags: item.tags,
      icon: item.icon,
      color: item.color
    }))

    return this.createItems(userId, payloads)
  }

  // Admin methods for managing public items
  async getPublicItems(filters?: ItemFilters & { is_curated?: boolean }): Promise<BaseItem[]> {
    const params = new URLSearchParams()

    // Always filter for public items
    params.append('is_public', 'eq.true')

    if (filters?.app_name) {
      params.append('app_name', `eq.${filters.app_name}`)
    }

    if (filters?.type) {
      params.append('type', `eq.${filters.type}`)
    }

    if (filters?.is_curated !== undefined) {
      params.append('is_curated', `eq.${filters.is_curated}`)
    }

    if (filters?.search) {
      params.append('name', `ilike.*${filters.search}*`)
    }

    // Order by created date descending
    params.append('order', 'created_at.desc')

    const items = await this.apiRequest<BaseItem[]>(`items?${params.toString()}`)
    return items
  }

  async toggleItemCurated(itemId: string, isCurated: boolean): Promise<ItemResult<BaseItem>> {
    try {
      const result = await this.apiRequest<BaseItem[]>(`items?id=eq.${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          is_curated: isCurated,
          updated_at: new Date().toISOString()
        })
      })

      return { success: true, data: result[0] }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle curated status'
      }
    }
  }

  async bulkToggleCurated(itemIds: string[], isCurated: boolean): Promise<ItemResult<void>> {
    try {
      // Process in batches to avoid overwhelming the API
      const batchSize = 10
      for (let i = 0; i < itemIds.length; i += batchSize) {
        const batch = itemIds.slice(i, i + batchSize)
        await Promise.all(
          batch.map(id => this.toggleItemCurated(id, isCurated))
        )
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to bulk toggle curated status'
      }
    }
  }
}
