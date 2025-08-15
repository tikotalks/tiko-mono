import { useAuthStore } from '@tiko/core';
import { useI18n } from '@tiko/ui';
import type { ItemTranslation } from '../models/ItemTranslation.model';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface CardItem {
  id: string;
  user_id: string;
  app_name: string;
  type: string;
  name: string;
  content?: string;
  metadata?: any;
  parent_id?: string;
  order_index: number;
  icon?: string;
  color?: string;
  base_locale?: string;
  effective_locale?: string;
  created_at: string;
  updated_at: string;
}

class CardsSupabaseService {
  private getAuthToken(): string | null {
    const sessionData = localStorage.getItem('tiko_auth_session');
    if (!sessionData) return null;
    
    try {
      const session = JSON.parse(sessionData);
      return session.access_token;
    } catch {
      return null;
    }
  }

  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAuthToken();
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': token ? `Bearer ${token}` : '',
        'Prefer': 'return=representation',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`API request failed: ${JSON.stringify(errorData)}`);
    }

    return response.json();
  }

  async getCards(userId: string, parentId?: string): Promise<CardItem[]> {
    const params = new URLSearchParams();
    params.append('user_id', `eq.${userId}`);
    params.append('app_name', 'eq.cards');
    
    if (parentId === undefined || parentId === null) {
      params.append('parent_id', 'is.null');
    } else {
      params.append('parent_id', `eq.${parentId}`);
    }
    
    // Use correct PostgREST syntax for ordering
    params.append('order', 'order_index.asc');
    
    return this.apiRequest<CardItem[]>(`items?${params.toString()}`);
  }

  async createCard(data: Partial<CardItem>): Promise<CardItem> {
    const response = await this.apiRequest<CardItem[]>('items', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response[0];
  }

  async updateCard(id: string, data: Partial<CardItem>): Promise<CardItem> {
    const response = await this.apiRequest<CardItem[]>(`items?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return response[0];
  }

  async deleteCard(id: string): Promise<void> {
    await this.apiRequest(`items?id=eq.${id}`, {
      method: 'DELETE'
    });
  }

  async getCard(id: string): Promise<CardItem | null> {
    const params = new URLSearchParams();
    params.append('id', `eq.${id}`);
    
    const response = await this.apiRequest<CardItem[]>(`items?${params.toString()}`);
    return response[0] || null;
  }

  // Get cards with translations for the current locale
  async getCardsWithTranslations(userId: string, parentId?: string, locale?: string): Promise<CardItem[]> {
    // First get the cards
    const cards = await this.getCards(userId, parentId);
    
    if (cards.length === 0) return cards;
    
    // Get translations for all cards
    const cardIds = cards.map(c => c.id);
    const params = new URLSearchParams();
    params.append('item_id', `in.(${cardIds.join(',')})`);
    
    if (locale) {
      // Try to get translations for the specific locale
      params.append('locale', `eq.${locale}`);
    }
    
    const translations = await this.apiRequest<ItemTranslation[]>(`item_translations?${params.toString()}`);
    
    // Map translations to cards
    const translationMap = new Map<string, ItemTranslation>();
    translations.forEach(t => {
      translationMap.set(t.item_id, t);
    });
    
    // Apply translations to cards
    return cards.map(card => {
      const translation = translationMap.get(card.id);
      if (translation) {
        return {
          ...card,
          name: translation.name || card.name,
          content: translation.content || card.content,
          // When using a translation, the effective locale is the translation's locale
          effective_locale: translation.locale
        };
      }
      return card;
    });
  }

  // Translation methods
  async getItemTranslations(itemId: string): Promise<ItemTranslation[]> {
    const params = new URLSearchParams();
    params.append('item_id', `eq.${itemId}`);
    params.append('order', 'locale.asc');
    
    return this.apiRequest<ItemTranslation[]>(`item_translations?${params.toString()}`);
  }

  async getItemTranslation(itemId: string, locale: string): Promise<ItemTranslation | null> {
    const params = new URLSearchParams();
    params.append('item_id', `eq.${itemId}`);
    params.append('locale', `eq.${locale}`);
    
    const response = await this.apiRequest<ItemTranslation[]>(`item_translations?${params.toString()}`);
    return response[0] || null;
  }

  async saveItemTranslation(translation: ItemTranslation): Promise<ItemTranslation> {
    const { id, ...data } = translation;
    
    if (id) {
      // Update existing
      const response = await this.apiRequest<ItemTranslation[]>(`item_translations?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
      return response[0];
    } else {
      // Insert new
      const response = await this.apiRequest<ItemTranslation[]>('item_translations', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response[0];
    }
  }

  async deleteItemTranslation(id: string): Promise<void> {
    await this.apiRequest(`item_translations?id=eq.${id}`, {
      method: 'DELETE'
    });
  }

  async upsertItemTranslations(translations: Omit<ItemTranslation, 'id'>[]): Promise<ItemTranslation[]> {
    return this.apiRequest<ItemTranslation[]>('item_translations', {
      method: 'POST',
      headers: {
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(translations)
    });
  }

  // TTS Audio methods
  async getTTSAudio(textHash: string): Promise<any | null> {
    const params = new URLSearchParams();
    params.append('text_hash', `eq.${textHash}`);
    
    const response = await this.apiRequest<any[]>(`tts_audio?${params.toString()}`);
    return response[0] || null;
  }
}

export const cardsSupabaseService = new CardsSupabaseService();