import { useAuthStore } from '@tiko/core';
import { useI18n } from '@tiko/ui';
import type { CardTile } from '../components/CardTile/CardTile.model';
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
  async loadCards(parentId?: string): Promise<CardTile[]> {
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      if (!userId) {
        console.warn('No authenticated user found');
        return [];
      }
      
      // Get current locale from i18n
      const { currentLocale } = useI18n();
      const locale = currentLocale.value;
      console.log('[loadCards] Current locale from useI18n:', locale, typeof locale);
      console.log('[loadCards] Raw currentLocale object:', currentLocale);
      
      // Load cards with translations for current locale
      const items = await cardsSupabaseService.getCardsWithTranslations(userId, parentId, locale);
      console.log('[loadCards] Items returned from getCardsWithTranslations:', items.length, items.map(i => ({ 
        id: i.id, 
        name: i.name, 
        content: i.content,
        base_locale: i.base_locale,
        effective_locale: i.effective_locale 
      })));
      
      return items.map(item => {
        const metadata = item.metadata as CardMetadata;
        
        // If we have a translation (effective_locale is set), use the translated content for speech
        const speech = item.effective_locale && item.effective_locale !== item.base_locale
          ? item.content || metadata?.speech || ''  // Use translated content if available
          : metadata?.speech || item.content || ''; // Otherwise use metadata speech or base content
        
        console.log('[loadCards] Speech determination for card:', {
          id: item.id,
          name: item.name,
          effective_locale: item.effective_locale,
          base_locale: item.base_locale,
          item_content: item.content,
          metadata_speech: metadata?.speech,
          final_speech: speech,
          is_translated: item.effective_locale && item.effective_locale !== item.base_locale
        });
        
        const result = {
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
        };
        
        console.log('[loadCards] Card tile created:', {
          id: result.id,
          title: result.title,
          speech: result.speech,
          base_locale: result.base_locale,
          effective_locale: result.effective_locale
        });
        
        return result;
      });
    } catch (error) {
      console.error('Failed to load cards:', error);
      return [];
    }
  },

  async hasChildren(parentId: string): Promise<boolean> {
    // Check cache first
    if (childrenCache.has(parentId)) {
      return childrenCache.get(parentId)!;
    }
    
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      if (!userId) {
        return false;
      }
      
      const children = await cardsSupabaseService.getCards(userId, parentId);
      const hasChildren = children.length > 0;
      
      // Cache the result
      childrenCache.set(parentId, hasChildren);
      
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
      };

      let cardId: string;
      
      if (card.id && !card.id.startsWith('empty-')) {
        // Update existing card
        await cardsSupabaseService.updateCard(card.id, itemData);
        cardId = card.id;
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
          translationsToSave[t.locale] = {
            name: t.name,
            content: t.content
          };
        });
        
        await ItemTranslationService.saveMultipleTranslations(cardId, translationsToSave);
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
};