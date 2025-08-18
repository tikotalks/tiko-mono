import { createClient } from '@supabase/supabase-js'
import type { AssetRecord } from '../stores/assets.store'

class AssetsService {
  private supabase

  constructor() {
    const supabaseUrl = (import.meta as any)?.env?.VITE_SUPABASE_URL || 
                        (typeof window !== 'undefined' && (window as any).__VITE_SUPABASE_URL__)
    const supabaseKey = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY || 
                        (typeof window !== 'undefined' && (window as any).__VITE_SUPABASE_ANON_KEY__)
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing')
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Get asset by ID
   */
  async getAsset(id: string): Promise<AssetRecord | null> {
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
      .from('assets')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)

    if (error) {
      console.error(`[AssetsService] Failed to search assets:`, error)
      return []
    }

    return data as AssetRecord[]
  }
}

export const assetsService = new AssetsService()