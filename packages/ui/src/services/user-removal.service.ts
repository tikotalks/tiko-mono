import { userMediaService } from '@tiko/core'

export interface UserRemovalProgress {
  step: string
  completed: number
  total: number
  message: string
}

export class UserRemovalService {
  private static instance: UserRemovalService
  
  public static getInstance(): UserRemovalService {
    if (!UserRemovalService.instance) {
      UserRemovalService.instance = new UserRemovalService()
    }
    return UserRemovalService.instance
  }

  /**
   * Completely removes a user and all their data from the system
   * This includes:
   * - All user items (sequences, cards, etc.) from all apps
   * - All user media files from storage
   * - User profile and settings data
   * - User authentication account
   */
  async removeUserAndAllData(
    userId: string,
    onProgress?: (progress: UserRemovalProgress) => void
  ): Promise<void> {
    const steps = [
      'Collecting user data...',
      'Removing user items...',
      'Removing user media...',
      'Removing user profile...',
      'Removing authentication account...'
    ]
    
    let currentStep = 0
    const reportProgress = (message: string, completed: number = 0, total: number = 1) => {
      onProgress?.({
        step: steps[currentStep],
        completed,
        total,
        message
      })
    }

    try {
      // Step 1: Collect all user data
      currentStep = 0
      reportProgress('Analyzing user data...')
      const userData = await this.collectUserData(userId)
      
      // Step 2: Remove user items from all apps
      currentStep = 1
      reportProgress('Removing user sequences and items...')
      await this.removeUserItems(userId, userData.items, reportProgress)
      
      // Step 3: Remove user media files
      currentStep = 2
      reportProgress('Removing user media files...')
      await this.removeUserMedia(userId, userData.media, reportProgress)
      
      // Step 4: Remove user profile and settings
      currentStep = 3
      reportProgress('Removing user profile data...')
      await this.removeUserProfile(userId)
      
      // Step 5: Remove authentication account
      currentStep = 4
      reportProgress('Removing authentication account...')
      await this.removeAuthAccount(userId)
      
      reportProgress('Account removal completed', 1, 1)
      
    } catch (error) {
      console.error('User removal failed:', error)
      throw new Error(`Failed to remove user account: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Collect all user data that needs to be removed
   */
  private async collectUserData(userId: string): Promise<{
    items: any[]
    media: any[]
    profile: any
  }> {
    try {
      // Get user items from all apps (this would need to be implemented per app)
      const items = await this.getUserItemsFromAllApps(userId)
      
      // Get user media
      const media = await userMediaService.getUserMedia(userId)
      
      // Get user profile
      const profile = await this.getUserProfile(userId)
      
      return { items, media, profile }
    } catch (error) {
      console.error('Failed to collect user data:', error)
      throw error
    }
  }

  /**
   * Remove all user items from all applications
   */
  private async removeUserItems(
    userId: string, 
    items: any[], 
    reportProgress: (message: string, completed: number, total: number) => void
  ): Promise<void> {
    if (items.length === 0) {
      reportProgress('No items to remove', 1, 1)
      return
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      reportProgress(`Removing ${item.type}: ${item.title}`, i, items.length)
      
      try {
        // Remove the item based on its type and app
        await this.removeItemByType(item)
      } catch (error) {
        console.warn(`Failed to remove item ${item.id}:`, error)
        // Continue with other items even if one fails
      }
    }
    
    reportProgress('All items removed', items.length, items.length)
  }

  /**
   * Remove all user media files from storage
   */
  private async removeUserMedia(
    userId: string, 
    mediaFiles: any[], 
    reportProgress: (message: string, completed: number, total: number) => void
  ): Promise<void> {
    if (mediaFiles.length === 0) {
      reportProgress('No media files to remove', 1, 1)
      return
    }

    for (let i = 0; i < mediaFiles.length; i++) {
      const media = mediaFiles[i]
      reportProgress(`Removing media: ${media.filename}`, i, mediaFiles.length)
      
      try {
        await userMediaService.removeUserMedia(media.id)
      } catch (error) {
        console.warn(`Failed to remove media file ${media.id}:`, error)
        // Continue with other files even if one fails
      }
    }
    
    reportProgress('All media files removed', mediaFiles.length, mediaFiles.length)
  }

  /**
   * Remove user profile and settings data
   */
  private async removeUserProfile(userId: string): Promise<void> {
    try {
      // This would call the appropriate service to remove user profile
      // For now, we'll just log what should happen
      console.log('Removing user profile data for:', userId)
      
      // Remove from user_profiles table
      await this.removeFromSupabaseTable('user_profiles', userId)
      
      // Remove from user_settings table  
      await this.removeFromSupabaseTable('user_settings', userId)
      
      // Remove from any other user-related tables
      await this.removeUserAppSettings(userId)
      
    } catch (error) {
      console.error('Failed to remove user profile:', error)
      throw error
    }
  }

  /**
   * Remove the authentication account and all data via secure backend
   */
  private async removeAuthAccount(userId: string): Promise<void> {
    try {
      // Get admin API key from environment or secure storage
      const adminKey = import.meta.env.VITE_USER_REMOVAL_ADMIN_KEY
      if (!adminKey) {
        throw new Error('Admin key not configured for user removal')
      }

      // Call the Cloudflare Worker for secure user removal
      const workerUrl = import.meta.env.VITE_USER_REMOVAL_WORKER_URL || 'https://tikoapi.org/user-removal'
      
      const response = await fetch(`${workerUrl}/remove-user`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId,
          adminKey 
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to remove user account`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'User removal failed')
      }
      
    } catch (error) {
      console.error('Failed to remove auth account:', error)
      throw error
    }
  }

  // Helper methods (these would need actual implementations)

  private async getUserItemsFromAllApps(userId: string): Promise<any[]> {
    // This would collect items from all apps
    // For now, return empty array - needs implementation per app
    return []
  }

  private async getUserProfile(userId: string): Promise<any> {
    // Get user profile from database
    return null
  }

  private async removeItemByType(item: any): Promise<void> {
    // Remove item based on its type and app
    // This would route to the appropriate service based on item.app and item.type
    console.log('Would remove item:', item)
  }

  private async removeFromSupabaseTable(tableName: string, userId: string): Promise<void> {
    // Remove records from Supabase table where user_id = userId
    console.log(`Would remove from ${tableName} where user_id = ${userId}`)
  }

  private async removeUserAppSettings(userId: string): Promise<void> {
    // Remove user settings from all apps
    console.log(`Would remove app settings for user: ${userId}`)
  }
}

export const userRemovalService = UserRemovalService.getInstance()