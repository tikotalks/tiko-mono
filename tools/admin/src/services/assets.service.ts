// Assets service for managing file assets

export interface Asset {
  id: string
  title: string
  description?: string
  filename: string
  original_filename: string
  file_path: string
  file_size: number
  mime_type: string
  file_extension: string
  categories: string[]
  tags: string[]
  width?: number
  height?: number
  duration?: number
  is_public: boolean
  user_id?: string
  created_at: string
  updated_at: string
}

export interface UploadAssetData {
  file: File
  title?: string
  description?: string
  categories?: string[]
  tags?: string[]
  isPublic?: boolean
}

export interface UpdateAssetData {
  title?: string
  description?: string
  categories?: string[]
  tags?: string[]
  isPublic?: boolean
}

export interface ListAssetsOptions {
  page?: number
  limit?: number
  search?: string
  category?: string
  tag?: string
  mimeType?: string
  isPublic?: boolean
  userId?: string
}

export interface ListAssetsResponse {
  assets: Asset[]
  total: number
  page: number
  limit: number
}

const ASSETS_API_BASE = import.meta.env.VITE_ASSETS_API_URL || 'https://assets.tikoapi.org'

class AssetsService {
  /**
   * Get the public URL for an asset
   */
  getAssetUrl(asset: Asset | string): string {
    if (typeof asset === 'string') {
      // Assume it's an asset ID, construct the URL
      return `https://assets.tikocdn.org/assets/${asset}`
    }
    return `https://assets.tikocdn.org/${asset.file_path}`
  }

  /**
   * Get optimized asset URL with transformations
   */
  getOptimizedUrl(asset: Asset | string, options?: {
    width?: number
    height?: number
    format?: 'webp' | 'jpeg' | 'png'
    quality?: number
  }): string {
    const baseUrl = this.getAssetUrl(asset)
    if (!options) return baseUrl
    
    const params = new URLSearchParams()
    if (options.width) params.append('width', options.width.toString())
    if (options.height) params.append('height', options.height.toString())
    if (options.format) params.append('format', options.format)
    if (options.quality) params.append('quality', options.quality.toString())
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl
  }

  /**
   * Upload a new asset
   */
  async uploadAsset(data: UploadAssetData): Promise<Asset> {
    const formData = new FormData()
    formData.append('file', data.file)
    
    if (data.title) formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)
    if (data.categories) formData.append('categories', JSON.stringify(data.categories))
    if (data.tags) formData.append('tags', JSON.stringify(data.tags))
    if (data.isPublic !== undefined) formData.append('isPublic', data.isPublic.toString())
    
    // Get current user ID from localStorage (admin app stores user info there)
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.id) {
          formData.append('userId', user.id)
        }
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e)
      }
    }

    const response = await fetch(`${ASSETS_API_BASE}/upload`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Upload failed with status ${response.status}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Upload failed')
    }

    // Convert response to Asset format
    return {
      id: result.id,
      title: result.title,
      description: result.description,
      filename: result.filename,
      original_filename: result.originalFilename,
      file_path: result.filePath,
      file_size: result.fileSize,
      mime_type: result.mimeType,
      file_extension: result.fileExtension,
      categories: result.categories,
      tags: result.tags,
      width: result.width,
      height: result.height,
      duration: result.duration,
      is_public: result.isPublic,
      user_id: user?.id,
      created_at: result.createdAt,
      updated_at: result.createdAt
    }
  }

  /**
   * Get asset by ID
   */
  async getAsset(id: string): Promise<Asset> {
    const response = await fetch(`${ASSETS_API_BASE}/assets/${id}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Asset not found')
      }
      throw new Error(`Failed to get asset: ${response.status}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Failed to get asset')
    }

    return result.asset
  }

  /**
   * List assets with pagination and filtering
   */
  async listAssets(options: ListAssetsOptions = {}): Promise<ListAssetsResponse> {
    const params = new URLSearchParams()
    
    if (options.page) params.append('page', options.page.toString())
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.search) params.append('search', options.search)
    if (options.category) params.append('category', options.category)
    if (options.tag) params.append('tag', options.tag)
    if (options.mimeType) params.append('type', options.mimeType)
    if (options.isPublic !== undefined) params.append('public', options.isPublic.toString())
    if (options.userId) params.append('userId', options.userId)

    const url = `${ASSETS_API_BASE}/assets${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to list assets: ${response.status}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Failed to list assets')
    }

    return {
      assets: result.assets,
      total: result.total,
      page: result.page,
      limit: result.limit
    }
  }

  /**
   * Update asset metadata
   */
  async updateAsset(id: string, data: UpdateAssetData): Promise<Asset> {
    const response = await fetch(`${ASSETS_API_BASE}/assets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Asset not found')
      }
      throw new Error(`Failed to update asset: ${response.status}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Failed to update asset')
    }

    return result.asset
  }

  /**
   * Delete asset
   */
  async deleteAsset(id: string): Promise<void> {
    const response = await fetch(`${ASSETS_API_BASE}/assets/${id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Asset not found')
      }
      throw new Error(`Failed to delete asset: ${response.status}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete asset')
    }
  }

  /**
   * Get asset categories from all assets
   */
  async getCategories(): Promise<string[]> {
    try {
      // Get all assets and extract unique categories
      const { assets } = await this.listAssets({ limit: 1000 })
      const allCategories = assets.flatMap(item => item.categories || [])
      return [...new Set(allCategories)].sort()
    } catch (error) {
      console.error('Failed to get categories:', error)
      return []
    }
  }

  /**
   * Get asset tags from all assets
   */
  async getTags(): Promise<string[]> {
    try {
      // Get all assets and extract unique tags
      const { assets } = await this.listAssets({ limit: 1000 })
      const allTags = assets.flatMap(item => item.tags || [])
      return [...new Set(allTags)].sort()
    } catch (error) {
      console.error('Failed to get tags:', error)
      return []
    }
  }

  /**
   * Get file type statistics
   */
  async getFileTypeStats(): Promise<Array<{ mimeType: string; count: number }>> {
    try {
      // Get all assets and calculate stats
      const { assets } = await this.listAssets({ limit: 1000 })
      
      const stats = assets.reduce((acc, item) => {
        const type = item.mime_type.split('/')[0] // Get main type (image, video, audio, etc.)
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return Object.entries(stats).map(([mimeType, count]) => ({ mimeType, count }))
    } catch (error) {
      console.error('Failed to get file type stats:', error)
      return []
    }
  }
}

export const assetsService = new AssetsService()