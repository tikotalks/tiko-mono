/**
 * Admin Items Service
 * 
 * Provides administrative functions for managing public items
 * Uses the core item service for all operations
 */

import { SupabaseItemService } from './item-supabase.service'
import { SupabaseUserService } from './user-supabase.service'
import type { BaseItem, ItemFilters } from './item.service'

export interface AdminItemsFilter {
  app?: string;
  type?: 'card' | 'sequence' | 'all';
  visibility?: 'all' | 'curated' | 'public-only';
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminItem {
  id: string;
  title: string;
  type: string;
  app_name: string;
  icon?: string;
  color?: string;
  image?: string;
  isPublic?: boolean;
  isCurated?: boolean;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  user_email?: string;
}

class AdminItemsService {
  private itemService = new SupabaseItemService()
  private userService = new SupabaseUserService()

  async getPublicItems(filter: AdminItemsFilter = {}): Promise<AdminItem[]> {
    try {
      // Build filters for the core item service
      const itemFilters: ItemFilters & { is_curated?: boolean } = {
        is_public: true
      }
      
      if (filter.app && filter.app !== 'all') {
        itemFilters.app_name = filter.app
      }
      
      if (filter.type && filter.type !== 'all') {
        itemFilters.type = filter.type
      }
      
      if (filter.visibility === 'curated') {
        itemFilters.is_curated = true
      } else if (filter.visibility === 'public-only') {
        itemFilters.is_curated = false
      }
      
      if (filter.search) {
        itemFilters.search = filter.search
      }

      // Get public items using the core service
      const items = await this.itemService.getPublicItems(itemFilters)
      
      // Get unique user IDs
      const userIds = [...new Set(items.map(item => item.user_id).filter(Boolean))]
      
      // Fetch user profiles for these items
      let userMap = new Map<string, string>()
      if (userIds.length > 0) {
        try {
          // Use the user service to get users by their IDs
          const userProfiles = await this.userService.getUsersByIds(userIds)
          
          // Create a map of user IDs to emails
          userProfiles.forEach(user => {
            userMap.set(user.id, user.email) // user.id is already mapped from user_id in the service
          })
        } catch (error) {
          console.error('Failed to fetch user profiles:', error)
        }
      }
      
      // Map the items to our admin format
      return items.map((item: BaseItem): AdminItem => ({
        id: item.id,
        title: item.name || 'Untitled',
        type: item.type,
        app_name: item.app_name,
        icon: item.icon,
        color: item.color,
        image: item.metadata?.image,
        isPublic: item.is_public,
        isCurated: item.is_curated,
        user_id: item.user_id,
        user_email: userMap.get(item.user_id) || undefined,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }))
    } catch (error) {
      console.error('Error loading public items:', error)
      throw error
    }
  }
  
  async toggleCurated(itemId: string, isCurated: boolean): Promise<void> {
    try {
      const result = await this.itemService.toggleItemCurated(itemId, isCurated)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to toggle curated status')
      }
    } catch (error) {
      console.error('Error toggling curated status:', error)
      throw error
    }
  }
  
  async bulkToggleCurated(itemIds: string[], isCurated: boolean): Promise<void> {
    try {
      const result = await this.itemService.bulkToggleCurated(itemIds, isCurated)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to bulk toggle curated status')
      }
    } catch (error) {
      console.error('Error bulk toggling curated status:', error)
      throw error
    }
  }
}

export const adminItemsService = new AdminItemsService()