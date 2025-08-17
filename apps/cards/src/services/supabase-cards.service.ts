import { useAuthStore } from '@tiko/core';
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
    
    // Try with app_name filter first
    params.append('app_name', 'eq.cards');
    
    if (parentId === undefined || parentId === null) {
      params.append('parent_id', 'is.null');
    } else {
      params.append('parent_id', `eq.${parentId}`);
    }
    
    // Use correct PostgREST syntax for ordering
    params.append('order', 'order_index.asc');
    
    const url = `items?${params.toString()}`;
    console.log('[getCards] Fetching from:', url);
    
    try {
      let result = await this.apiRequest<CardItem[]>(url);
      console.log('[getCards] Result with app_name filter:', result.length, 'cards found');
      
      // If no results with app_name filter, try without it (backwards compatibility)
      if (result.length === 0 && parentId) {
        console.log('[getCards] No cards found with app_name filter, trying without...');
        
        const fallbackParams = new URLSearchParams();
        fallbackParams.append('user_id', `eq.${userId}`);
        fallbackParams.append('parent_id', `eq.${parentId}`);
        fallbackParams.append('order', 'order_index.asc');
        
        const fallbackUrl = `items?${fallbackParams.toString()}`;
        console.log('[getCards] Fallback fetch from:', fallbackUrl);
        
        result = await this.apiRequest<CardItem[]>(fallbackUrl);
        console.log('[getCards] Fallback result:', result.length, 'cards found');
      }
      
      return result;
    } catch (error) {
      console.error('[getCards] Error fetching cards:', error);
      throw error;
    }
  }

  async getAllCards(userId: string): Promise<CardItem[]> {
    const params = new URLSearchParams();
    params.append('user_id', `eq.${userId}`);
    params.append('app_name', 'eq.cards');
    params.append('order', 'order_index.asc');
    
    const url = `items?${params.toString()}`;
    console.log('[getAllCards] Fetching ALL cards from:', url);
    
    try {
      const result = await this.apiRequest<CardItem[]>(url);
      console.log('[getAllCards] Found', result.length, 'total cards');
      return result;
    } catch (error) {
      console.error('[getAllCards] Error fetching all cards:', error);
      throw error;
    }
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
    console.log('[getCardsWithTranslations] Called with:', { userId, parentId, locale });
    
    // First get the cards
    const cards = await this.getCards(userId, parentId);
    console.log('[getCardsWithTranslations] Found cards:', cards.length, cards.map(c => ({ id: c.id, name: c.name })));
    
    if (cards.length === 0) return cards;
    
    // Get translations for all cards
    const cardIds = cards.map(c => c.id);
    let translations: ItemTranslation[] = [];
    
    if (locale) {
      // First try exact locale match (e.g., nl-nl)
      const exactParams = new URLSearchParams();
      exactParams.append('item_id', `in.(${cardIds.join(',')})`);
      exactParams.append('locale', `eq.${locale}`);
      console.log('[getCardsWithTranslations] Looking for exact locale match:', locale);
      
      const exactUrl = `item_translations?${exactParams.toString()}`;
      console.log('[getCardsWithTranslations] Exact translation request URL:', exactUrl);
      
      translations = await this.apiRequest<ItemTranslation[]>(exactUrl);
      console.log('[getCardsWithTranslations] Found exact locale translations:', translations.length, translations);
      
      // If no exact match and locale has region (e.g., nl-nl), try base language (e.g., nl)
      if (translations.length === 0 && locale.includes('-')) {
        const baseLanguage = locale.split('-')[0];
        const baseParams = new URLSearchParams();
        baseParams.append('item_id', `in.(${cardIds.join(',')})`);
        baseParams.append('locale', `eq.${baseLanguage}`);
        console.log('[getCardsWithTranslations] No exact match, trying base language:', baseLanguage);
        
        const baseUrl = `item_translations?${baseParams.toString()}`;
        console.log('[getCardsWithTranslations] Base language request URL:', baseUrl);
        
        translations = await this.apiRequest<ItemTranslation[]>(baseUrl);
        console.log('[getCardsWithTranslations] Found base language translations:', translations.length, translations);
        
        // If still no match, try with lowercase locale (e.g., nl-NL -> nl-nl)
        if (translations.length === 0) {
          const lowercaseLocale = locale.toLowerCase();
          const lowercaseParams = new URLSearchParams();
          lowercaseParams.append('item_id', `in.(${cardIds.join(',')})`);
          lowercaseParams.append('locale', `eq.${lowercaseLocale}`);
          console.log('[getCardsWithTranslations] No base language match, trying lowercase locale:', lowercaseLocale);
          
          const lowercaseUrl = `item_translations?${lowercaseParams.toString()}`;
          console.log('[getCardsWithTranslations] Lowercase locale request URL:', lowercaseUrl);
          
          translations = await this.apiRequest<ItemTranslation[]>(lowercaseUrl);
          console.log('[getCardsWithTranslations] Found lowercase locale translations:', translations.length, translations);
        }
      }
    } else {
      // Get all translations if no locale specified
      const allParams = new URLSearchParams();
      allParams.append('item_id', `in.(${cardIds.join(',')})`);
      translations = await this.apiRequest<ItemTranslation[]>(`item_translations?${allParams.toString()}`);
      console.log('[getCardsWithTranslations] Found all translations (no locale specified):', translations.length);
    }
    
    // Map translations to cards
    const translationMap = new Map<string, ItemTranslation>();
    translations.forEach(t => {
      translationMap.set(t.item_id, t);
      console.log('[getCardsWithTranslations] Mapping translation for item:', t.item_id, { name: t.name, content: t.content, locale: t.locale });
    });
    
    // Apply translations to cards
    const result = cards.map(card => {
      const translation = translationMap.get(card.id);
      if (translation) {
        console.log('[getCardsWithTranslations] Applying translation to card:', card.id, {
          original: { name: card.name, content: card.content },
          translation: { name: translation.name, content: translation.content, locale: translation.locale }
        });
        return {
          ...card,
          name: translation.name || card.name,
          content: translation.content || card.content,
          // When using a translation, the effective locale is the translation's locale
          effective_locale: translation.locale
        };
      }
      console.log('[getCardsWithTranslations] No translation found for card:', card.id, card.name);
      return card;
    });
    
    console.log('[getCardsWithTranslations] Final result:', result.map(c => ({ id: c.id, name: c.name, effective_locale: c.effective_locale })));
    return result;
  }

  // Get ALL cards with translations for the current locale
  async getAllCardsWithTranslations(userId: string, locale?: string): Promise<CardItem[]> {
    console.log('[getAllCardsWithTranslations] Called with:', { userId, locale });
    
    // First get ALL cards
    const cards = await this.getAllCards(userId);
    console.log('[getAllCardsWithTranslations] Found total cards:', cards.length);
    
    if (cards.length === 0) return cards;
    
    // Get translations for all cards
    const cardIds = cards.map(c => c.id);
    let translations: ItemTranslation[] = [];
    
    if (locale) {
      // Try to get translations for the locale with fallback logic
      const exactParams = new URLSearchParams();
      exactParams.append('item_id', `in.(${cardIds.join(',')})`);
      exactParams.append('locale', `eq.${locale}`);
      
      translations = await this.apiRequest<ItemTranslation[]>(`item_translations?${exactParams.toString()}`);
      
      // Try base language if no exact match
      if (translations.length === 0 && locale.includes('-')) {
        const baseLanguage = locale.split('-')[0];
        const baseParams = new URLSearchParams();
        baseParams.append('item_id', `in.(${cardIds.join(',')})`);
        baseParams.append('locale', `eq.${baseLanguage}`);
        
        translations = await this.apiRequest<ItemTranslation[]>(`item_translations?${baseParams.toString()}`);
      }
    }
    
    // Map translations to cards
    const translationMap = new Map<string, ItemTranslation>();
    translations.forEach(t => {
      translationMap.set(t.item_id, t);
    });
    
    // Apply translations to cards
    const result = cards.map(card => {
      const translation = translationMap.get(card.id);
      if (translation) {
        return {
          ...card,
          name: translation.name || card.name,
          content: translation.content || card.content,
          effective_locale: translation.locale
        };
      }
      return card;
    });
    
    console.log('[getAllCardsWithTranslations] Returning', result.length, 'cards with translations');
    return result;
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
  
  async upsertSingleTranslation(translation: Omit<ItemTranslation, 'id'>): Promise<ItemTranslation> {
    const response = await this.apiRequest<ItemTranslation[]>('item_translations', {
      method: 'POST',
      headers: {
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(translation)
    });
    return response[0];
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