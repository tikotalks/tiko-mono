import { useAuthStore } from '@tiko/core';
import { useI18n } from '@tiko/ui';
import type { TCardTile as CardTile } from '@tiko/ui';
import { cardsSupabaseService } from './supabase-cards.service';
import { ItemTranslationService } from './item-translation.service';
import type { ItemTranslation } from '../models/ItemTranslation.model';

const APP_NAME = 'cards';

interface CardMetadata {
  icon?: string;
  color?: string;
  image?: string;
  speech?: string;
}

// Cache for hasChildren checks
const childrenCache = new Map<string, boolean>();

export const cardsService = {
  async loadCards(parentId?: string, includeCurated = false, locale?: string): Promise<CardTile[]> {
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      if (!userId) {
        console.warn('No authenticated user found');
        return [];
      }
      
      // Get current locale from i18n or use provided locale
      const { currentLocale } = useI18n();
      const effectiveLocale = locale || currentLocale.value;
      console.log('[loadCards] Current locale from useI18n:', effectiveLocale, 'includeCurated:', includeCurated);
      
      // Load cards with translations for current locale
      // If includeCurated is true, we need to get both user and curated cards for the parent
      let items;
      if (includeCurated) {
        // Get cards with curated items and translations
        items = await cardsSupabaseService.getCardsWithCuratedAndTranslations(userId, parentId, effectiveLocale);
        console.log('[loadCards] Found cards with curated and translations:', items.length);
      } else {
        // Standard loading for user cards only
        items = await cardsSupabaseService.getCardsWithTranslations(userId, parentId, effectiveLocale);
      }
      
      console.log('[loadCards] Items to process:', items.length);
      
      return items.map(item => {
        const metadata = item.metadata as CardMetadata;
        
        // If we have a translation (effective_locale is set), use the translated content for speech
        const speech = item.effective_locale && item.effective_locale !== item.base_locale
          ? item.content || metadata?.speech || ''  // Use translated content if available
          : metadata?.speech || item.content || ''; // Otherwise use metadata speech or base content
        
        const result = {
          id: item.id,
          title: item.name, // This will already be the translated name
          type: item.type as any,
          icon: metadata?.icon || item.icon || 'square',
          color: metadata?.color || item.color || 'primary',
          image: metadata?.image || '',
          speech: speech,
          index: item.order_index ?? 0,
          parentId: item.parent_id || undefined,
          base_locale: item.base_locale || 'en',
          effective_locale: item.effective_locale || item.base_locale || 'en',
          isPublic: item.is_public || false,
          isCurated: item.is_curated || false,
          ownerId: item.user_id, // Add ownerId for ownership checks
          user_id: item.user_id // Add user_id for ownership checks
        };
        
        return result;
      });
    } catch (error) {
      console.error('Failed to load cards:', error);
      return [];
    }
  },

  async loadAllCards(includeCurated = false): Promise<CardTile[]> {
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      if (!userId) {
        console.warn('No authenticated user found');
        return [];
      }
      
      // Get current locale from i18n
      const { currentLocale } = useI18n();
      const effectiveLocale = currentLocale.value;
      console.log('[loadAllCards] Loading ALL cards with locale:', effectiveLocale, 'includeCurated:', includeCurated);
      
      // Load ALL cards with translations for current locale
      const items = await cardsSupabaseService.getAllCardsWithTranslations(userId, effectiveLocale, includeCurated);
      console.log('[loadAllCards] Total items loaded:', items.length);
      
      return items.map(item => {
        const metadata = item.metadata as CardMetadata;
        
        // If we have a translation (effective_locale is set), use the translated content for speech
        const speech = item.effective_locale && item.effective_locale !== item.base_locale
          ? item.content || metadata?.speech || ''  // Use translated content if available
          : metadata?.speech || item.content || ''; // Otherwise use metadata speech or base content
        
        return {
          id: item.id,
          title: item.name, // This will already be the translated name from getCardsWithTranslations
          type: item.type as any,
          icon: metadata?.icon || item.icon || 'square',
          color: metadata?.color || item.color || 'primary',
          image: metadata?.image || '',
          speech: speech,
          index: item.order_index ?? 0,
          parentId: item.parent_id || undefined,
          base_locale: item.base_locale || 'en',
          effective_locale: item.effective_locale || item.base_locale || 'en',
          isPublic: item.is_public || false,
          isCurated: item.is_curated || false,
          ownerId: item.user_id, // Add ownerId for ownership checks
          user_id: item.user_id // Add user_id for ownership checks
        };
      });
    } catch (error) {
      console.error('Failed to load all cards:', error);
      return [];
    }
  },

  async hasChildren(parentId: string, includeCurated = false): Promise<boolean> {
    // Check cache first - use different cache keys for curated vs non-curated
    const cacheKey = includeCurated ? `${parentId}_curated` : parentId;
    if (childrenCache.has(cacheKey)) {
      return childrenCache.get(cacheKey)!;
    }
    
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      if (!userId) {
        return false;
      }
      
      // Use getCardsWithCurated if includeCurated is true
      const children = includeCurated 
        ? await cardsSupabaseService.getCardsWithCurated(userId, parentId)
        : await cardsSupabaseService.getCards(userId, parentId);
      
      const hasChildren = children.length > 0;
      
      // Cache the result
      childrenCache.set(cacheKey, hasChildren);
      
      return hasChildren;
    } catch (error) {
      console.error('Failed to check children:', error);
      return false;
    }
  },

  async saveCard(card: Partial<CardTile>, parentId?: string, index?: number, translations?: ItemTranslation[]): Promise<string | null> {
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      if (!userId) {
        console.error('No authenticated user found');
        return null;
      }

      const metadata: CardMetadata = {
        icon: card.icon,
        color: card.color,
        image: card.image,
        speech: card.speech,
      };

      const isPublic = card.isPublic || false;
      
      const itemData = {
        user_id: userId,
        app_name: APP_NAME,
        type: card.type || 'card',
        name: card.title || 'Untitled',
        content: card.speech || '',
        metadata,
        parent_id: card.parentId !== undefined ? card.parentId : (parentId || null),
        icon: card.icon,
        color: card.color,
        order_index: index ?? card.index ?? 0,
        base_locale: card.base_locale,
        is_public: isPublic,
        // When making something non-public, also remove curated status
        // since curated items should always be public
        is_curated: isPublic ? undefined : false
      };

      let cardId: string;
      
      if (card.id && !card.id.startsWith('empty-')) {
        // Update existing card
        await cardsSupabaseService.updateCard(card.id, itemData);
        cardId = card.id;
        
        // If this is a group being updated and public status changed, cascade to children
        if (!parentId && typeof card.isPublic === 'boolean') {
          try {
            await this.updateGroupChildrenVisibility(cardId, userId, card.isPublic);
          } catch (error) {
            console.warn('Failed to update children visibility:', error);
          }
        }
        
        // Clear cache for parent if card moved
        if (parentId) childrenCache.delete(parentId);
      } else {
        // Create new card
        const newItem = await cardsSupabaseService.createCard(itemData);
        cardId = newItem?.id || '';
        // Clear cache for parent since we added a child
        if (parentId) childrenCache.delete(parentId);
      }
      
      // Save translations if provided
      if (cardId && translations && translations.length > 0) {
        const translationsToSave: Record<string, { name?: string; content?: string }> = {};
        
        translations.forEach(t => {
          // Only include translations that have actual content
          if (t.locale && (t.name || t.content)) {
            translationsToSave[t.locale] = {
              name: t.name,
              content: t.content
            };
          }
        });
        
        // Only save if we have translations with content
        if (Object.keys(translationsToSave).length > 0) {
          await ItemTranslationService.saveMultipleTranslations(cardId, translationsToSave);
        }
      }
      
      return cardId
    } catch (error) {
      console.error('Failed to save card:', error);
      return null;
    }
  },

  async deleteCard(cardId: string): Promise<boolean> {
    try {
      await cardsSupabaseService.deleteCard(cardId);
      // Clear all cache on delete (we don't know the parent)
      childrenCache.clear();
      return true;
    } catch (error) {
      console.error('Failed to delete card:', error);
      return false;
    }
  },

  async reorderCards(cardIds: string[]): Promise<boolean> {
    try {
      // Update order_index for each card
      const updatePromises = cardIds.map((id, index) => 
        cardsSupabaseService.updateCard(id, { order_index: index })
      );
      
      await Promise.all(updatePromises);
      return true;
    } catch (error) {
      console.error('Failed to reorder cards:', error);
      return false;
    }
  },

  async getCard(cardId: string): Promise<CardTile | null> {
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      if (!userId) {
        console.warn('No authenticated user found');
        return null;
      }
      
      const item = await cardsSupabaseService.getCard(cardId);
      if (!item) return null;
      
      return {
        id: item.id,
        title: item.name,
        type: item.type as any,
        icon: (item.metadata as CardMetadata)?.icon || item.icon || 'square',
        color: (item.metadata as CardMetadata)?.color || item.color || 'primary',
        image: (item.metadata as CardMetadata)?.image || '',
        speech: (item.metadata as CardMetadata)?.speech || '',
        index: item.order_index ?? 0,
        parentId: item.parent_id || undefined,
      };
    } catch (error) {
      console.error('Failed to get card:', error);
      return null;
    }
  },

  async getCardPath(cardId: string): Promise<Array<{ id: string; title: string }>> {
    const path: Array<{ id: string; title: string }> = [];
    let currentId: string | null = cardId;
    
    while (currentId) {
      const card = await this.getCard(currentId);
      if (!card) break;
      
      path.unshift({ id: card.id, title: card.title });
      currentId = card.parentId || null;
    }
    
    return path;
  },

  async updateGroupChildrenVisibility(groupId: string, userId: string, isPublic: boolean): Promise<void> {
    try {
      // Get all children of this group
      const children = await cardsSupabaseService.getCards(userId, groupId);
      
      // Update each child's visibility
      const updatePromises = children.map(child => 
        cardsSupabaseService.updateCard(child.id, {
          is_public: isPublic,
          // When making items non-public, also remove curated status
          is_curated: isPublic ? undefined : false
        })
      );
      
      await Promise.all(updatePromises);
      
      // Clear cache for this group
      childrenCache.delete(groupId);
    } catch (error) {
      console.error('Failed to update children visibility:', error);
      throw error;
    }
  },
};