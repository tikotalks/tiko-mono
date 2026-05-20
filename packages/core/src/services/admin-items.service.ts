/**
 * Admin Items Service
 *
 * Administrative item operations are now routed through Worker APIs. The core
 * package keeps this thin facade so admin UI imports stay stable.
 */

export interface AdminItemsFilter {
  app?: string
  type?: 'card' | 'sequence' | 'all'
  visibility?: 'all' | 'curated' | 'public-only'
  search?: string
  page?: number
  limit?: number
}

export interface AdminItem {
  id: string
  title: string
  type: string
  app_name: string
  parent_id?: string | null
  icon?: string
  color?: string
  image?: string
  isPublic?: boolean
  isCurated?: boolean
  user_id: string
  created_at?: string
  updated_at?: string
  user_email?: string
}

class AdminItemsService {
  private readonly apiUrl = stripTrailingSlash((import.meta as any).env?.VITE_CONTENT_API_URL || 'https://content.tikoapi.org')

  async getPublicItems(filter: AdminItemsFilter = {}): Promise<AdminItem[]> {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined) params.set(key, String(value))
    })
    return this.request<AdminItem[]>(`/admin/items?${params}`)
  }

  async toggleCurated(itemId: string, isCurated: boolean): Promise<void> {
    await this.request<void>(`/admin/items/${encodeURIComponent(itemId)}/curated`, {
      method: 'PATCH',
      body: JSON.stringify({ isCurated })
    })
  }

  async bulkToggleCurated(itemIds: string[], isCurated: boolean): Promise<void> {
    await this.request<void>('/admin/items/curated', {
      method: 'PATCH',
      body: JSON.stringify({ itemIds, isCurated })
    })
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers || {})
    if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json')
    const response = await fetch(`${this.apiUrl}${path}`, { ...init, headers, credentials: 'include' })
    if (!response.ok) throw new Error(`Admin items request failed: ${response.status}`)
    if (response.status === 204) return undefined as T
    const data = await response.json()
    return (data.items || data) as T
  }
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

export const adminItemsService = new AdminItemsService()
