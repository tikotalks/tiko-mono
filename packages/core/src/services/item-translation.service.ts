import { coreApiRequest, getServiceBaseUrl } from './internal-api'
import type { BaseItem } from './item.service'

export interface ItemTranslation {
  id?: string
  item_id: string
  locale: string
  name?: string
  content?: string
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
}

type ItemWithTranslationFields = Pick<
  BaseItem,
  'id' | 'name' | 'content' | 'base_locale' | 'effective_locale'
>

class ItemTranslationService {
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
    const baseUrl = getServiceBaseUrl('VITE_ITEMS_API_URL', 'https://items.tikoapi.org')
    const token = this.getAuthToken()
    const headers = new Headers(options.headers || {})

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    if (!headers.has('Prefer')) {
      headers.set('Prefer', 'return=representation')
    }

    return coreApiRequest<T>(baseUrl, `/rest/v1/${endpoint}`, {
      ...options,
      headers,
    })
  }

  private buildLocaleFallbacks(locale?: string): string[] {
    if (!locale) return []

    const fallbacks = [locale]
    if (locale.includes('-')) {
      fallbacks.push(locale.split('-')[0])
    }

    const lowercaseLocale = locale.toLowerCase()
    if (!fallbacks.includes(lowercaseLocale)) {
      fallbacks.push(lowercaseLocale)
    }

    return fallbacks
  }

  async getTranslations(itemId: string): Promise<ItemTranslation[]> {
    const params = new URLSearchParams()
    params.append('item_id', `eq.${itemId}`)
    params.append('order', 'locale.asc')

    return this.apiRequest<ItemTranslation[]>(`item_translations?${params.toString()}`)
  }

  async getTranslation(itemId: string, locale: string): Promise<ItemTranslation | null> {
    const translations = await this.getTranslationsForItems([itemId], locale)
    return translations[0] || null
  }

  async getTranslationsForItems(itemIds: string[], locale?: string): Promise<ItemTranslation[]> {
    if (itemIds.length === 0) {
      return []
    }

    const itemIdList = itemIds.join(',')
    const localeFallbacks = this.buildLocaleFallbacks(locale)

    if (localeFallbacks.length === 0) {
      const params = new URLSearchParams()
      params.append('item_id', `in.(${itemIdList})`)
      params.append('order', 'locale.asc')

      return this.apiRequest<ItemTranslation[]>(`item_translations?${params.toString()}`)
    }

    for (const currentLocale of localeFallbacks) {
      const params = new URLSearchParams()
      params.append('item_id', `in.(${itemIdList})`)
      params.append('locale', `eq.${currentLocale}`)

      const translations = await this.apiRequest<ItemTranslation[]>(
        `item_translations?${params.toString()}`
      )

      if (translations.length > 0) {
        return translations
      }
    }

    return []
  }

  applyTranslations<T extends ItemWithTranslationFields>(
    items: T[],
    translations: ItemTranslation[]
  ): T[] {
    const translationMap = new Map(translations.map(translation => [translation.item_id, translation]))

    return items.map(item => {
      const translation = translationMap.get(item.id)
      if (!translation) {
        return item
      }

      return {
        ...item,
        name: translation.name || item.name,
        content: translation.content || item.content,
        effective_locale: translation.locale,
      }
    })
  }

  async getItemsWithTranslations<T extends ItemWithTranslationFields>(
    items: T[],
    locale?: string
  ): Promise<T[]> {
    const translations = await this.getTranslationsForItems(
      items.map(item => item.id),
      locale
    )

    return this.applyTranslations(items, translations)
  }

  async saveTranslation(translation: ItemTranslation): Promise<ItemTranslation> {
    const { id, ...translationData } = translation

    if (id) {
      const response = await this.apiRequest<ItemTranslation[]>(`item_translations?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(translationData),
      })

      return response[0]
    }

    return this.upsertSingleTranslation(translationData)
  }

  async deleteTranslation(id: string): Promise<void> {
    await this.apiRequest(`item_translations?id=eq.${id}`, {
      method: 'DELETE',
    })
  }

  async upsertTranslations(translations: Omit<ItemTranslation, 'id'>[]): Promise<ItemTranslation[]> {
    if (translations.length === 0) {
      return []
    }

    return this.apiRequest<ItemTranslation[]>('item_translations', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(translations),
    })
  }

  async upsertSingleTranslation(
    translation: Omit<ItemTranslation, 'id'>
  ): Promise<ItemTranslation> {
    const response = await this.upsertTranslations([translation])
    return response[0]
  }
}

export const itemTranslationService = new ItemTranslationService()
