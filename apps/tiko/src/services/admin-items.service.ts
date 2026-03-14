import {
  adminItemsService as coreAdminItemsService,
  type AdminItemsFilter,
} from '@tiko/core'
import { useAuthStore } from '@tiko/core'

export type { AdminItemsFilter }

interface AdminCardTile {
  id: string
  title: string
  icon?: string
  color?: string
  type?: string
  image?: string
  speech?: string
  index?: number
  parentId?: string
  ownerId?: string
  isPublic?: boolean
  isCurated?: boolean
}

export interface AdminItemsResponse {
  items: AdminCardTile[]
  total: number
  page: number
  totalPages: number
}

class AdminItemsService {
  async isUserAdmin(): Promise<boolean> {
    const authStore = useAuthStore()
    const user = authStore.user

    if (!user) return false

    const role =
      (user as any).role || user.user_metadata?.role || user.app_metadata?.role || undefined

    return (
      role === 'admin' ||
      user.email?.endsWith('@admin.tiko.app') ||
      user.user_metadata?.role === 'admin' ||
      user.app_metadata?.role === 'admin'
    )
  }

  async getPublicItems(filter: AdminItemsFilter = {}): Promise<AdminCardTile[]> {
    const response = await this.loadPublicItems(filter)
    return response.items
  }

  async loadPublicItems(filter: AdminItemsFilter = {}): Promise<AdminItemsResponse> {
    const authStore = useAuthStore()
    const userId = authStore.user?.id
    if (!userId || !(await this.isUserAdmin())) {
      throw new Error('Unauthorized: Admin access required')
    }

    const page = filter.page || 1
    const limit = filter.limit || 50
    const items = await coreAdminItemsService.getPublicItems(filter)

    return {
      items: items.map(
        item =>
          ({
            id: item.id,
            title: item.title,
            icon: item.icon || '',
            color: item.color || 'primary',
            type: item.type as any,
            image: item.image || '',
            speech: '',
            index: 0,
            parentId: item.parent_id || undefined,
            ownerId: item.user_id,
            isPublic: item.isPublic || false,
            isCurated: item.isCurated || false,
          }) as AdminCardTile
      ),
      total: items.length,
      page,
      totalPages: Math.ceil(items.length / limit),
    }
  }

  async toggleCurated(itemId: string, isCurated: boolean): Promise<void> {
    if (!(await this.isUserAdmin())) {
      throw new Error('Unauthorized: Admin access required')
    }

    await coreAdminItemsService.toggleCurated(itemId, isCurated)
  }

  async toggleCuratedStatus(itemId: string, isCurated: boolean): Promise<void> {
    await coreAdminItemsService.toggleCurated(itemId, isCurated)
  }

  async bulkToggleCurated(itemIds: string[], isCurated: boolean): Promise<void> {
    if (!(await this.isUserAdmin())) {
      throw new Error('Unauthorized: Admin access required')
    }

    await coreAdminItemsService.bulkToggleCurated(itemIds, isCurated)
  }

  async getItemStats(): Promise<{
    total: number
    public: number
    curated: number
    byApp: Record<string, number>
  }> {
    return {
      total: 0,
      public: 0,
      curated: 0,
      byApp: {},
    }
  }
}

export const adminItemsService = new AdminItemsService()
