import { useAuthStore } from '@tiko/core'
import { sequenceSupabaseService } from './supabase-sequence.service'
import type { TCardTile as CardTile } from '@tiko/ui'

export interface AdminItemsFilter {
  app?: string
  type?: 'card' | 'sequence' | 'all'
  visibility?: 'all' | 'curated' | 'public-only' // 'all' means all public items (including curated)
  search?: string
  page?: number
  limit?: number
}

export interface AdminItemsResponse {
  items: CardTile[]
  total: number
  page: number
  totalPages: number
}

class AdminItemsService {
  async isUserAdmin(): Promise<boolean> {
    const authStore = useAuthStore()
    const user = authStore.user

    if (!user) return false

    // Check if user has admin role
    // Check multiple possible locations for the role
    const role = user.role || user.user_metadata?.role || authStore.userRole
    console.log('[AdminItemsService] Checking admin access - user role:', role, 'user:', user)

    return (
      role === 'admin' ||
      user.email?.endsWith('@admin.tiko.app') ||
      user.user_metadata?.role === 'admin' ||
      authStore.userRole === 'admin'
    )
  }

  async getPublicItems(filter: AdminItemsFilter = {}): Promise<CardTile[]> {
    const response = await this.loadPublicItems(filter)
    return response.items
  }

  async loadPublicItems(filter: AdminItemsFilter = {}): Promise<AdminItemsResponse> {
    try {
      const authStore = useAuthStore()
      const userId = authStore.user?.id

      if (!userId || !(await this.isUserAdmin())) {
        throw new Error('Unauthorized: Admin access required')
      }

      const {
        app = 'sequence',
        type = 'all',
        visibility = 'all', // 'all' means all public items
        search = '',
        page = 1,
        limit = 50,
      } = filter

      const items = await sequenceSupabaseService.getAdminPublicItems({
        app,
        type,
        visibility,
        search,
        page,
        limit,
      })

      // Calculate pagination
      const total = items.length // This should come from the API
      const totalPages = Math.ceil(total / limit)

      return {
        items: items.map(item => ({
          id: item.id,
          title: item.name,
          icon: item.icon || '',
          color: item.color || 'primary',
          type: item.type as any,
          image: (item.metadata as any)?.image || '',
          speech: item.content || '',
          index: item.order_index,
          parentId: item.parent_id || undefined,
          ownerId: item.user_id,
          isPublic: item.is_public || false,
          isCurated: item.is_curated || false,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        })),
        total,
        page,
        totalPages,
      }
    } catch (error) {
      console.error('Error loading admin public items:', error)
      throw error
    }
  }

  async toggleCurated(itemId: string, isCurated: boolean): Promise<void> {
    return this.toggleCuratedStatus(itemId, isCurated)
  }

  async toggleCuratedStatus(itemId: string, isCurated: boolean): Promise<void> {
    try {
      const authStore = useAuthStore()
      const userId = authStore.user?.id

      if (!userId || !(await this.isUserAdmin())) {
        throw new Error('Unauthorized: Admin access required')
      }

      await sequenceSupabaseService.updateItemCuratedStatus(itemId, isCurated)
    } catch (error) {
      console.error('Error toggling curated status:', error)
      throw error
    }
  }

  async bulkToggleCurated(itemIds: string[], isCurated: boolean): Promise<void> {
    try {
      const authStore = useAuthStore()
      const userId = authStore.user?.id

      if (!userId || !(await this.isUserAdmin())) {
        throw new Error('Unauthorized: Admin access required')
      }

      // Process in parallel but with a limit to avoid overwhelming the API
      const batchSize = 5
      for (let i = 0; i < itemIds.length; i += batchSize) {
        const batch = itemIds.slice(i, i + batchSize)
        await Promise.all(batch.map(id => this.toggleCuratedStatus(id, isCurated)))
      }
    } catch (error) {
      console.error('Error bulk toggling curated status:', error)
      throw error
    }
  }

  async getItemStats(): Promise<{
    total: number
    public: number
    curated: number
    byApp: Record<string, number>
  }> {
    try {
      const authStore = useAuthStore()
      const userId = authStore.user?.id

      if (!userId || !(await this.isUserAdmin())) {
        throw new Error('Unauthorized: Admin access required')
      }

      // This should be implemented with a proper API endpoint
      // For now, return mock data
      return {
        total: 0,
        public: 0,
        curated: 0,
        byApp: {},
      }
    } catch (error) {
      console.error('Error getting item stats:', error)
      throw error
    }
  }
}

export const adminItemsService = new AdminItemsService()
