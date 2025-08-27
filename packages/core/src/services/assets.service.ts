import type { AssetRecord } from '../stores/assets.store'
import { getSupabase } from '../lib/supabase-lazy'

class AssetsService {

  /**
   * Get asset by ID
   */
  async getAsset(id: string): Promise<AssetRecord | null> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error(`[AssetsService] Failed to fetch asset ${id}:`, error)
      return null
    }

    return data as AssetRecord
  }

  /**
   * Get multiple assets by IDs
   */
  async getAssets(ids: string[]): Promise<AssetRecord[]> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .in('id', ids)

    if (error) {
      console.error(`[AssetsService] Failed to fetch assets:`, error)
      return []
    }

    return data as AssetRecord[]
  }

  /**
   * Search assets
   */
  async searchAssets(query: string): Promise<AssetRecord[]> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
      .eq('is_public', true)

    if (error) {
      console.error(`[AssetsService] Failed to search assets:`, error)
      return []
    }

    return data as AssetRecord[]
  }

  /**
   * Get all public assets
   */
  async getPublicAssets(limit: number = 100): Promise<AssetRecord[]> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error(`[AssetsService] Failed to fetch public assets:`, error)
      return []
    }

    return data as AssetRecord[]
  }
}

export const assetsService = new AssetsService()