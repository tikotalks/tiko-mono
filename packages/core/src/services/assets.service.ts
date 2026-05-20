import type { AssetRecord } from '../stores/assets.store'

class AssetsService {
  private readonly apiUrl = stripTrailingSlash((import.meta as any).env?.VITE_ASSETS_API_URL || 'https://assets.tikoapi.org')

  async getAsset(id: string): Promise<AssetRecord | null> {
    try {
      return await this.request<AssetRecord>(`/assets/${encodeURIComponent(id)}`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) return null
      throw error
    }
  }

  async getAssets(ids: string[]): Promise<AssetRecord[]> {
    if (ids.length === 0) return []
    return this.request<AssetRecord[]>(`/assets?ids=${encodeURIComponent(ids.join(','))}`)
  }

  async searchAssets(query: string): Promise<AssetRecord[]> {
    return this.request<AssetRecord[]>(`/assets?search=${encodeURIComponent(query)}&public=true`)
  }

  async getPublicAssets(limit: number = 100): Promise<AssetRecord[]> {
    return this.request<AssetRecord[]>(`/assets?public=true&limit=${limit}`)
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.apiUrl}${path}`, { credentials: 'include' })
    if (!response.ok) throw new Error(`Assets request failed: ${response.status}`)
    const data = await response.json()
    return (data.assets || data.asset || data) as T
  }
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

export const assetsService = new AssetsService()
