/**
 * File Storage Service
 * 
 * @module services/file.service
 * @description
 * Service for managing file uploads and storage.
 * Provides abstraction over the backend implementation.
 */

/**
 * File upload result
 */
export interface FileUploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * File service interface
 */
export interface FileService {
  uploadAvatar(userId: string, file: File): Promise<FileUploadResult>
  deleteAvatar(userId: string): Promise<{ success: boolean; error?: string }>
  getAvatarUrl(userId: string): Promise<string | null>
}

/**
 * Create localStorage-based file service
 * Stores files as data URLs in localStorage
 */
export function createLocalStorageFileService(): FileService {
  const AVATAR_PREFIX = 'tiko_avatar_'
  
  return {
    async uploadAvatar(userId: string, file: File): Promise<FileUploadResult> {
      try {
        // Validate file
        if (!file.type.startsWith('image/')) {
          return { success: false, error: 'File must be an image' }
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          return { success: false, error: 'File size must be less than 5MB' }
        }
        
        // Convert to data URL
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        
        // Store in localStorage
        localStorage.setItem(`${AVATAR_PREFIX}${userId}`, dataUrl)
        
        return { success: true, url: dataUrl }
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to upload file' 
        }
      }
    },
    
    async deleteAvatar(userId: string): Promise<{ success: boolean; error?: string }> {
      try {
        localStorage.removeItem(`${AVATAR_PREFIX}${userId}`)
        return { success: true }
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to delete avatar' 
        }
      }
    },
    
    async getAvatarUrl(userId: string): Promise<string | null> {
      return localStorage.getItem(`${AVATAR_PREFIX}${userId}`)
    }
  }
}

// Default service instance
export const fileService: FileService = createLocalStorageFileService()