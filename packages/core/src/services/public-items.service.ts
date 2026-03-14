import type { BaseItem } from './item.service'

export interface PublicItemsFilter {
  appName: string
  userId: string
  type?: 'card' | 'sequence' | 'all'
  includeCurated?: boolean
}

export interface PublicItemSearchFilter extends PublicItemsFilter {
  query: string
}

class PublicItemsService {
  private getAuthToken(): string | null {
    const sessionData = localStorage.getItem('tiko_auth_session')
    if (!sessionData) return null

    try {
      const session = JSON.parse(sessionData)
      return session.access_token ?? null
    } catch {
      return null
    }
  }

  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey =
      import.meta.env?.VITE_SUPABASE_SECRET || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY
    const token = this.getAuthToken()

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials missing')
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: token ? `Bearer ${token}` : '',
        Prefer: 'return=representation',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Public item request failed: ${response.status} ${errorText}`)
    }

    return response.json()
  }

  async getPublicItems(filter: PublicItemsFilter): Promise<BaseItem[]> {
    const params = new URLSearchParams()
    params.append('app_name', `eq.${filter.appName}`)

    if (filter.includeCurated ?? true) {
      params.append('or', `(is_public.eq.true,is_curated.eq.true,user_id.eq.${filter.userId})`)
    } else {
      params.append('or', `(is_public.eq.true,user_id.eq.${filter.userId})`)
      params.append('is_curated', 'eq.false')
    }

    if (filter.type && filter.type !== 'all') {
      params.append('type', `eq.${filter.type}`)
    }

    params.append('select', '*,user_item_order!left(custom_index)')
    params.append('order', 'user_item_order(custom_index).asc.nullsfirst,order_index.asc')

    const items = await this.apiRequest<Array<BaseItem & { user_item_order?: Array<{ custom_index: number | null }> }>>(
      `items?${params.toString()}`
    )

    return items.map(item => ({
      ...item,
      custom_index: item.user_item_order?.[0]?.custom_index ?? undefined,
      owner_id: item.user_id,
    }))
  }

  async searchPublicItems(filter: PublicItemSearchFilter): Promise<BaseItem[]> {
    const params = new URLSearchParams()
    params.append('app_name', `eq.${filter.appName}`)

    if (filter.includeCurated ?? true) {
      params.append('or', `(is_public.eq.true,is_curated.eq.true)`)
    } else {
      params.append('is_public', 'eq.true')
      params.append('is_curated', 'eq.false')
    }

    params.append('name', `ilike.%${filter.query}%`)

    if (filter.type && filter.type !== 'all') {
      params.append('type', `eq.${filter.type}`)
    }

    params.append('select', '*,user_item_order!left(custom_index)')
    params.append('order', 'is_curated.desc,name.asc')

    const items = await this.apiRequest<Array<BaseItem & { user_item_order?: Array<{ custom_index: number | null }> }>>(
      `items?${params.toString()}`
    )

    return items.map(item => ({
      ...item,
      custom_index: item.user_item_order?.[0]?.custom_index ?? undefined,
      owner_id: item.user_id,
    }))
  }

  async updateItemVisibility(
    itemId: string,
    userId: string,
    isPublic: boolean,
    options: { cascadeChildren?: boolean } = {}
  ): Promise<void> {
    const updateData: Partial<BaseItem> = {
      is_public: isPublic,
      ...(isPublic ? {} : { is_curated: false }),
    }

    await this.apiRequest(`items?id=eq.${itemId}&user_id=eq.${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    })

    if (options.cascadeChildren) {
      await this.updateChildrenVisibility(itemId, userId, isPublic)
    }
  }

  async updateChildrenVisibility(parentId: string, userId: string, isPublic: boolean): Promise<void> {
    const updateData: Partial<BaseItem> = {
      is_public: isPublic,
      ...(isPublic ? {} : { is_curated: false }),
    }

    await this.apiRequest(`items?parent_id=eq.${parentId}&user_id=eq.${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    })
  }

  async saveUserItemOrder(userId: string, itemId: string, customIndex: number): Promise<void> {
    const params = new URLSearchParams()
    params.append('user_id', `eq.${userId}`)
    params.append('item_id', `eq.${itemId}`)

    const existingOrders = await this.apiRequest<Array<{ id: string }>>(
      `user_item_order?${params.toString()}`
    )

    if (existingOrders.length > 0) {
      await this.apiRequest(`user_item_order?id=eq.${existingOrders[0].id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          custom_index: customIndex,
          updated_at: new Date().toISOString(),
        }),
      })
      return
    }

    await this.apiRequest('user_item_order', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        item_id: itemId,
        custom_index: customIndex,
      }),
    })
  }
}

export const publicItemService = new PublicItemsService()
