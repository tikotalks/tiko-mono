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
  // Public sequence fields
  owner_id?: string;
  is_public?: boolean;
  is_curated?: boolean;
  custom_index?: number; // From user_sequence_order join
}

interface UserSequenceOrder {
  id: string;
  user_id: string;
  sequence_id: string;
  custom_index: number;
  created_at: string;
  updated_at: string;
}

class SequenceSupabaseService {
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

  async getSequence(userId: string, parentId?: string): Promise<CardItem[]> {
    const params = new URLSearchParams();
    params.append('user_id', `eq.${userId}`);

    // Try with app_name filter first
    params.append('app_name', 'eq.sequence');

    if (parentId === undefined || parentId === null) {
      params.append('parent_id', 'is.null');
      // When loading top level, only get sequences
      params.append('type', 'eq.sequence');
    } else {
      params.append('parent_id', `eq.${parentId}`);
      // When loading children, only get sequence-items
      // Temporarily commenting out type filter to debug
      // params.append('type', 'eq.sequence-item');
    }

    // Use correct PostgREST syntax for ordering
    params.append('order', 'order_index.asc');

    const url = `items?${params.toString()}`;
    console.log('[getSequence] Fetching from:', url);

    try {
      let result = await this.apiRequest<CardItem[]>(url);
      console.log('[getSequence] Result with app_name filter:', result.length, 'items found');
      if (result.length > 0) {
        console.log('[getSequence] First few results:', result.slice(0, 3).map(r => ({
          id: r.id,
          name: r.name,
          type: r.type,
          parent_id: r.parent_id,
          app_name: r.app_name
        })));
      }

      // If no results with app_name filter, try without it (backwards compatibility)
      if (result.length === 0 && parentId) {
        console.log('[getSequence] No sequence found with app_name filter, trying without...');

        const fallbackParams = new URLSearchParams();
        fallbackParams.append('user_id', `eq.${userId}`);
        fallbackParams.append('parent_id', `eq.${parentId}`);
        // fallbackParams.append('type', 'eq.sequence-item');
        fallbackParams.append('order', 'order_index.asc');

        const fallbackUrl = `items?${fallbackParams.toString()}`;
        console.log('[getSequence] Fallback fetch from:', fallbackUrl);

        result = await this.apiRequest<CardItem[]>(fallbackUrl);
        console.log('[getSequence] Fallback result:', result.length, 'sequence found');
      }

      return result;
    } catch (error) {
      console.error('[getSequence] Error fetching sequence:', error);
      throw error;
    }
  }

  async getAllSequence(userId: string, includeCurated = false): Promise<CardItem[]> {
    // If includeCurated is true, we need to fetch both user's items and curated public items
    if (includeCurated) {
      console.log('[getAllSequence] Fetching user sequences AND curated public sequences');
      
      // Fetch user's own sequences
      const userParams = new URLSearchParams();
      userParams.append('user_id', `eq.${userId}`);
      userParams.append('app_name', 'eq.sequence');
      userParams.append('order', 'order_index.asc');
      
      // Fetch curated public sequences (not owned by user)
      const curatedParams = new URLSearchParams();
      curatedParams.append('app_name', 'eq.sequence');
      curatedParams.append('is_public', 'eq.true');
      curatedParams.append('is_curated', 'eq.true');
      curatedParams.append('user_id', `neq.${userId}`); // Exclude user's own items
      curatedParams.append('order', 'order_index.asc');
      
      try {
        // Fetch both in parallel
        const [userSequences, curatedSequences] = await Promise.all([
          this.apiRequest<CardItem[]>(`items?${userParams.toString()}`),
          this.apiRequest<CardItem[]>(`items?${curatedParams.toString()}`)
        ]);
        
        console.log('[getAllSequence] Found', userSequences.length, 'user sequences');
        console.log('[getAllSequence] Found', curatedSequences.length, 'curated public sequences');
        
        // Combine and return all sequences
        const allSequences = [...userSequences, ...curatedSequences];
        console.log('[getAllSequence] Total sequences:', allSequences.length);
        
        return allSequences;
      } catch (error) {
        console.error('[getAllSequence] Error fetching sequences:', error);
        throw error;
      }
    } else {
      // Original behavior - only user's sequences
      const params = new URLSearchParams();
      params.append('user_id', `eq.${userId}`);
      params.append('app_name', 'eq.sequence');
      params.append('order', 'order_index.asc');

      const url = `items?${params.toString()}`;
      console.log('[getAllSequence] Fetching ALL sequence from:', url);

      try {
        const result = await this.apiRequest<CardItem[]>(url);
        console.log('[getAllSequence] Found', result.length, 'total sequence');
        return result;
      } catch (error) {
        console.error('[getAllSequence] Error fetching all sequence:', error);
        throw error;
      }
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

  // Get sequence with translations for the current locale
  async getSequenceWithTranslations(userId: string, parentId?: string, locale?: string): Promise<CardItem[]> {
    console.log('[getSequenceWithTranslations] Called with:', { userId, parentId, locale });

    // First get the sequence
    const sequence = await this.getSequence(userId, parentId);
    console.log('[getSequenceWithTranslations] Found sequence:', sequence.length, sequence.map(c => ({ id: c.id, name: c.name })));

    if (sequence.length === 0) return sequence;

    // Get translations for all sequence
    const cardIds = sequence.map(c => c.id);
    let translations: ItemTranslation[] = [];

    if (locale) {
      // First try exact locale match (e.g., nl-nl)
      const exactParams = new URLSearchParams();
      exactParams.append('item_id', `in.(${cardIds.join(',')})`);
      exactParams.append('locale', `eq.${locale}`);
      console.log('[getSequenceWithTranslations] Looking for exact locale match:', locale);

      const exactUrl = `item_translations?${exactParams.toString()}`;
      console.log('[getSequenceWithTranslations] Exact translation request URL:', exactUrl);

      translations = await this.apiRequest<ItemTranslation[]>(exactUrl);
      console.log('[getSequenceWithTranslations] Found exact locale translations:', translations.length, translations);

      // If no exact match and locale has region (e.g., nl-nl), try base language (e.g., nl)
      if (translations.length === 0 && locale.includes('-')) {
        const baseLanguage = locale.split('-')[0];
        const baseParams = new URLSearchParams();
        baseParams.append('item_id', `in.(${cardIds.join(',')})`);
        baseParams.append('locale', `eq.${baseLanguage}`);
        console.log('[getSequenceWithTranslations] No exact match, trying base language:', baseLanguage);

        const baseUrl = `item_translations?${baseParams.toString()}`;
        console.log('[getSequenceWithTranslations] Base language request URL:', baseUrl);

        translations = await this.apiRequest<ItemTranslation[]>(baseUrl);
        console.log('[getSequenceWithTranslations] Found base language translations:', translations.length, translations);

        // If still no match, try with lowercase locale (e.g., nl-NL -> nl-nl)
        if (translations.length === 0) {
          const lowercaseLocale = locale.toLowerCase();
          const lowercaseParams = new URLSearchParams();
          lowercaseParams.append('item_id', `in.(${cardIds.join(',')})`);
          lowercaseParams.append('locale', `eq.${lowercaseLocale}`);
          console.log('[getSequenceWithTranslations] No base language match, trying lowercase locale:', lowercaseLocale);

          const lowercaseUrl = `item_translations?${lowercaseParams.toString()}`;
          console.log('[getSequenceWithTranslations] Lowercase locale request URL:', lowercaseUrl);

          translations = await this.apiRequest<ItemTranslation[]>(lowercaseUrl);
          console.log('[getSequenceWithTranslations] Found lowercase locale translations:', translations.length, translations);
        }
      }
    } else {
      // Get all translations if no locale specified
      const allParams = new URLSearchParams();
      allParams.append('item_id', `in.(${cardIds.join(',')})`);
      translations = await this.apiRequest<ItemTranslation[]>(`item_translations?${allParams.toString()}`);
      console.log('[getSequenceWithTranslations] Found all translations (no locale specified):', translations.length);
    }

    // Map translations to sequence
    const translationMap = new Map<string, ItemTranslation>();
    translations.forEach(t => {
      translationMap.set(t.item_id, t);
      console.log('[getSequenceWithTranslations] Mapping translation for item:', t.item_id, { name: t.name, content: t.content, locale: t.locale });
    });

    // Apply translations to sequence
    const result = sequence.map(card => {
      const translation = translationMap.get(card.id);
      if (translation) {
        console.log('[getSequenceWithTranslations] Applying translation to card:', card.id, {
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
      console.log('[getSequenceWithTranslations] No translation found for card:', card.id, card.name);
      return card;
    });

    console.log('[getSequenceWithTranslations] Final result:', result.map(c => ({ id: c.id, name: c.name, effective_locale: c.effective_locale })));
    return result;
  }

  // Get ALL sequence with translations for the current locale
  async getAllSequenceWithTranslations(userId: string, locale?: string, includeCurated = false): Promise<CardItem[]> {
    console.log('[getAllSequenceWithTranslations] Called with:', { userId, locale, includeCurated });

    // First get ALL sequence
    const sequence = await this.getAllSequence(userId, includeCurated);
    console.log('[getAllSequenceWithTranslations] Found total sequence:', sequence.length);

    if (sequence.length === 0) return sequence;

    // Get translations for all sequence
    const cardIds = sequence.map(c => c.id);
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

    // Map translations to sequence
    const translationMap = new Map<string, ItemTranslation>();
    translations.forEach(t => {
      translationMap.set(t.item_id, t);
    });

    // Apply translations to sequence
    const result = sequence.map(card => {
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

    console.log('[getAllSequenceWithTranslations] Returning', result.length, 'sequence with translations');
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

  async getItemById(userId: string, itemId: string): Promise<CardItem | null> {
    const params = new URLSearchParams();
    params.append('id', `eq.${itemId}`);
    params.append('user_id', `eq.${userId}`);

    const response = await this.apiRequest<CardItem[]>(`items?${params.toString()}`);
    return response[0] || null;
  }

  // Public item methods
  async getPublicItems(userId: string, locale: string, type?: 'card' | 'sequence' | 'all', includeCurated: boolean = true): Promise<CardItem[]> {
    try {
      const params = new URLSearchParams();
      params.append('app_name', 'eq.sequence');
      
      // Build the OR clause based on includeCurated
      if (includeCurated) {
        params.append('or', `(is_public.eq.true,is_curated.eq.true,user_id.eq.${userId})`);
      } else {
        params.append('or', `(is_public.eq.true,user_id.eq.${userId})`);
        params.append('is_curated', 'eq.false');
      }
      
      // Filter by type if specified
      if (type && type !== 'all') {
        params.append('type', `eq.${type}`);
      }
      
      params.append('select', '*,user_item_order!left(custom_index)');
      params.append('order', 'user_item_order(custom_index).asc.nullsfirst,order_index.asc');

      const response = await this.apiRequest<any[]>(`items?${params.toString()}`);
      
      // Map the response to include custom_index from the join
      return response.map(item => ({
        ...item,
        custom_index: item.user_item_order?.[0]?.custom_index || null,
        owner_id: item.user_id
      }));
    } catch (error) {
      console.error('Error fetching public items:', error);
      return [];
    }
  }

  async searchPublicItems(query: string, locale: string, userId: string, type?: 'card' | 'sequence' | 'all', includeCurated: boolean = true): Promise<CardItem[]> {
    try {
      const params = new URLSearchParams();
      params.append('app_name', 'eq.sequence');
      
      // Build the OR clause based on includeCurated
      if (includeCurated) {
        params.append('or', `(is_public.eq.true,is_curated.eq.true)`);
      } else {
        params.append('is_public', 'eq.true');
        params.append('is_curated', 'eq.false');
      }
      
      params.append('name', `ilike.%${query}%`);
      
      // Filter by type if specified
      if (type && type !== 'all') {
        params.append('type', `eq.${type}`);
      }
      
      params.append('select', '*,user_item_order!left(custom_index)');
      params.append('order', 'is_curated.desc,name.asc');

      const response = await this.apiRequest<any[]>(`items?${params.toString()}`);
      
      return response.map(item => ({
        ...item,
        custom_index: item.user_item_order?.[0]?.custom_index || null,
        owner_id: item.user_id
      }));
    } catch (error) {
      console.error('Error searching public items:', error);
      return [];
    }
  }

  // Public sequence methods
  async getPublicSequences(userId: string, locale: string): Promise<CardItem[]> {
    try {
      // Get public sequences with custom ordering if exists
      const params = new URLSearchParams();
      params.append('app_name', 'eq.sequence');
      params.append('or', `(is_public.eq.true,is_curated.eq.true,user_id.eq.${userId})`);
      params.append('parent_id', 'is.null');
      params.append('select', '*,user_sequence_order!left(custom_index)');
      params.append('order', 'user_sequence_order(custom_index).asc.nullsfirst,order_index.asc');

      const response = await this.apiRequest<any[]>(`items?${params.toString()}`);
      
      // Map the response to include custom_index from the join
      return response.map(item => ({
        ...item,
        custom_index: item.user_item_order?.[0]?.custom_index || null,
        owner_id: item.user_id // Map user_id to owner_id for clarity
      }));
    } catch (error) {
      console.error('Error fetching public sequences:', error);
      return [];
    }
  }

  async searchPublicSequences(query: string, locale: string, userId: string): Promise<CardItem[]> {
    try {
      const params = new URLSearchParams();
      params.append('app_name', 'eq.sequence');
      params.append('or', `(is_public.eq.true,is_curated.eq.true)`);
      params.append('name', `ilike.%${query}%`);
      params.append('select', '*,user_sequence_order!left(custom_index)');
      params.append('order', 'is_curated.desc,name.asc');

      const response = await this.apiRequest<any[]>(`items?${params.toString()}`);
      
      return response.map(item => ({
        ...item,
        custom_index: item.user_item_order?.[0]?.custom_index || null,
        owner_id: item.user_id
      }));
    } catch (error) {
      console.error('Error searching public sequences:', error);
      return [];
    }
  }

  async updateSequenceVisibility(sequenceId: string, userId: string, isPublic: boolean): Promise<void> {
    try {
      await this.apiRequest(`items?id=eq.${sequenceId}&user_id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_public: isPublic })
      });
    } catch (error) {
      console.error('Error updating sequence visibility:', error);
      throw error;
    }
  }

  async saveUserSequenceOrder(userId: string, sequenceId: string, customIndex: number): Promise<void> {
    try {
      // First check if an order record exists
      const existingParams = new URLSearchParams();
      existingParams.append('user_id', `eq.${userId}`);
      existingParams.append('sequence_id', `eq.${sequenceId}`);
      
      const existing = await this.apiRequest<UserSequenceOrder[]>(`user_sequence_order?${existingParams.toString()}`);
      
      if (existing.length > 0) {
        // Update existing order
        await this.apiRequest(`user_item_order?id=eq.${existing[0].id}`, {
          method: 'PATCH',
          body: JSON.stringify({ custom_index: customIndex, updated_at: new Date().toISOString() })
        });
      } else {
        // Create new order
        await this.apiRequest('user_item_order', {
          method: 'POST',
          body: JSON.stringify({
            user_id: userId,
            item_id: itemId,
            custom_index: customIndex
          })
        });
      }
    } catch (error) {
      console.error('Error saving user item order:', error);
      throw error;
    }
  }

  // Admin methods - ONLY show public items for security
  async getAdminPublicItems(filter: {
    app: string;
    type: 'card' | 'sequence' | 'all';
    visibility: 'all' | 'curated' | 'public-only';
    search: string;
    page: number;
    limit: number;
  }): Promise<CardItem[]> {
    try {
      const params = new URLSearchParams();
      params.append('app_name', `eq.${filter.app}`);
      
      // ALWAYS filter by public items only - no access to private items
      if (filter.visibility === 'public-only') {
        // Public but not curated
        params.append('is_public', 'eq.true');
        params.append('is_curated', 'eq.false');
      } else if (filter.visibility === 'curated') {
        // Curated only (which are always public)
        params.append('is_curated', 'eq.true');
      } else {
        // 'all' means all public items (including curated)
        params.append('is_public', 'eq.true');
      }
      
      // Filter by type
      if (filter.type !== 'all') {
        params.append('type', `eq.${filter.type}`);
      }
      
      // Search
      if (filter.search) {
        params.append('name', `ilike.%${filter.search}%`);
      }
      
      // Order and pagination
      params.append('order', 'is_curated.desc,created_at.desc');
      params.append('limit', filter.limit.toString());
      params.append('offset', ((filter.page - 1) * filter.limit).toString());
      
      const response = await this.apiRequest<CardItem[]>(`items?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching admin public items:', error);
      return [];
    }
  }

  async updateItemCuratedStatus(itemId: string, isCurated: boolean): Promise<void> {
    try {
      // When making an item curated, it must be public
      // When removing curated status, public status remains unchanged
      const updateData: any = { is_curated: isCurated };
      
      if (isCurated) {
        // Ensure item is public when making it curated
        updateData.is_public = true;
      }
      
      await this.apiRequest(`items?id=eq.${itemId}&is_public=eq.true`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
    } catch (error) {
      console.error('Error updating item curated status:', error);
      throw error;
    }
  }
}

export const sequenceSupabaseService = new SequenceSupabaseService();
