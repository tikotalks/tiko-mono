import { useAuthStore, unifiedItemService } from '@tiko/core';
import { useI18n } from '@tiko/core';
import type { TCardTile as BaseCardTile } from '@tiko/ui';

// Extend CardTile to include sequence-specific fields
type CardTile = BaseCardTile & {
  rewardAnimation?: string;
};
import { sequenceSupabaseService } from './supabase-sequence.service';
import { ItemTranslationService } from './item-translation.service';
import type { ItemTranslation } from '../models/ItemTranslation.model';
import type { PublicItem, UserItemOrder } from '../models/PublicItem.model';

const APP_NAME = 'sequence';

interface CardMetadata {
  icon?: string;
  color?: string;
  image?: string;
  speech?: string;
  rewardAnimation?: string;
}

// Cache for hasChildren checks
const childrenCache = new Map<string, boolean>();

export const sequenceService = {
  async loadSequence(parentId?: string): Promise<typeof CardTile[]> {
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      const isSkipAuth = sessionStorage.getItem('tiko_skip_auth') === 'true';
      
      // If no user and not in skip auth mode, return empty
      if (!userId && !isSkipAuth) {
        console.warn('[SequenceService] No authenticated user found and not in skip auth mode');
        return [];
      }

      // Get current locale from i18n
      const { currentLocale } = useI18n();
      const locale = currentLocale.value;
      
      let items: any[];
      
      if (isSkipAuth && !userId) {
        // Skip auth mode: Load only curated sequences using unified service
        const baseItems = parentId 
          ? await unifiedItemService.loadItemsByParentId(parentId, {
              includeCurated: true,
              includeChildren: false,
              locale
            })
          : await unifiedItemService.loadRootItems('', APP_NAME, {
              includeCurated: true,
              includeChildren: false,
              locale
            });
        
        // Convert BaseItem to the format expected by sequence service
        items = baseItems.map(item => ({
          ...item,
          metadata: item.metadata || {},
          effective_locale: item.effective_locale || item.base_locale || 'en'
        }));
      } else {
        // Normal mode: Load sequence with translations for current locale
        items = await sequenceSupabaseService.getSequenceWithTranslations(userId, parentId, locale);
      }

      return items.map(item => {
        const metadata = item.metadata as CardMetadata;
        

        // If we have a translation (effective_locale is set), use the translated content for speech
        const speech = item.effective_locale && item.effective_locale !== item.base_locale
          ? item.content || metadata?.speech || ''  // Use translated content if available
          : metadata?.speech || item.content || ''; // Otherwise use metadata speech or base content

        const image = metadata?.image || '';
        
        const result = {
          id: item.id,
          title: item.name, // This will already be the translated name from getSequenceWithTranslations
          type: item.type as any,
          icon: metadata?.icon || item.icon || 'square',
          color: metadata?.color || item.color || 'primary',
          image: image,
          speak: speech, // Changed from 'speech' to 'speak' to match what the store expects
          index: item.order_index ?? 0,
          parentId: item.parent_id || undefined,
          base_locale: item.base_locale || 'en',
          effective_locale: item.effective_locale || item.base_locale || 'en',
          isPublic: item.is_public || false,
          isCurated: item.is_curated || false,
          ownerId: item.user_id, // Add ownerId for ownership checks
          user_id: item.user_id, // Add user_id for ownership checks
          rewardAnimation: metadata?.rewardAnimation
        } as CardTile;


        return result;
      });
    } catch (error) {
      console.error('Failed to load sequence:', error);
      return [];
    }
  },

  async loadAllSequence(includeCurated = false): Promise<typeof CardTile[]> {
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
      console.log('[loadAllSequence] Loading ALL sequence with locale:', locale, 'includeCurated:', includeCurated);

      // Load ALL sequence with translations for current locale
      const items = await sequenceSupabaseService.getAllSequenceWithTranslations(userId, locale, includeCurated);
      console.log('[loadAllSequence] Total items loaded:', items.length);

      return items.map(item => {
        const metadata = item.metadata as CardMetadata;

        // If we have a translation (effective_locale is set), use the translated content for speech
        const speech = item.effective_locale && item.effective_locale !== item.base_locale
          ? item.content || metadata?.speech || ''  // Use translated content if available
          : metadata?.speech || item.content || ''; // Otherwise use metadata speech or base content

        return {
          id: item.id,
          title: item.name, // This will already be the translated name from getSequenceWithTranslations
          type: item.type as any,
          icon: metadata?.icon || item.icon || 'square',
          color: metadata?.color || item.color || 'primary',
          image: metadata?.image || '',
          speak: speech, // Changed from 'speech' to 'speak' to match what the store expects
          index: item.order_index ?? 0,
          parentId: item.parent_id || undefined,
          base_locale: item.base_locale || 'en',
          effective_locale: item.effective_locale || item.base_locale || 'en',
          isPublic: item.is_public || false,
          isCurated: item.is_curated || false,
          ownerId: item.user_id, // Add ownerId for ownership checks
          user_id: item.user_id, // Add user_id for ownership checks
          rewardAnimation: metadata?.rewardAnimation
        };
      });
    } catch (error) {
      console.error('Failed to load all sequence:', error);
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

      const children = await sequenceSupabaseService.getSequence(userId, parentId);
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
        rewardAnimation: card.rewardAnimation === '' ? undefined : card.rewardAnimation,
      };
      
      console.log('[saveCard] Saving card with metadata:', {
        cardId: card.id,
        cardType: card.type,
        image: card.image,
        rewardAnimation: card.rewardAnimation,
        metadata: metadata,
        metadataString: JSON.stringify(metadata)
      });

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

      if (card.id && !card.id.startsWith('empty-') && !card.id.startsWith('temp-')) {
        // Update existing card
        await sequenceSupabaseService.updateCard(card.id, itemData);
        cardId = card.id;
        
        // If this is a sequence being updated, cascade visibility to children
        if (card.type === 'sequence') {
          try {
            await sequenceSupabaseService.updateSequenceChildrenVisibility(cardId, userId, itemData.is_public || false);
          } catch (error) {
            console.warn('Failed to update children visibility:', error);
          }
        }
        
        // Clear cache for parent if card moved
        if (parentId) childrenCache.delete(parentId);
      } else {
        // Create new card
        const newItem = await sequenceSupabaseService.createCard(itemData);
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
      await sequenceSupabaseService.deleteCard(cardId);
      // Clear all cache on delete (we don't know the parent)
      childrenCache.clear();
      return true;
    } catch (error) {
      console.error('Failed to delete card:', error);
      return false;
    }
  },

  async reorderSequence(cardIds: string[]): Promise<boolean> {
    try {
      // Update order_index for each card
      const updatePromises = cardIds.map((id, index) =>
        sequenceSupabaseService.updateCard(id, { order_index: index })
      );

      await Promise.all(updatePromises);
      return true;
    } catch (error) {
      console.error('Failed to reorder sequence:', error);
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

      const item = await sequenceSupabaseService.getCard(cardId);
      if (!item) return null;

      const metadata = item.metadata as CardMetadata;
      return {
        id: item.id,
        title: item.name,
        type: item.type as any,
        icon: metadata?.icon || item.icon || 'square',
        color: metadata?.color || item.color || 'primary',
        image: metadata?.image || '',
        speak: metadata?.speech || '', // Changed from 'speech' to 'speak'
        index: item.order_index ?? 0,
        parentId: item.parent_id || undefined,
        isPublic: item.is_public || false,
        isCurated: item.is_curated || false,
        ownerId: item.user_id,
        user_id: item.user_id,
        rewardAnimation: metadata?.rewardAnimation,
      } as CardTile;
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

  async createSequence(sequenceData: {
    title: string;
    color: string;
    image?: { url: string; alt: string } | null;
    isPublic?: boolean;
    rewardAnimation?: string;
    items: Array<{
      title: string;
      color: string;
      image?: { url: string; alt: string } | null;
      speak?: string;
      orderIndex: number;
    }>;
  }, parentId?: string, index?: number): Promise<string | null> {
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      if (!userId) {
        console.error('No authenticated user found');
        return null;
      }

      // First create the sequence
      const sequenceCard: Partial<CardTile> = {
        title: sequenceData.title,
        color: sequenceData.color,
        image: sequenceData.image?.url || '',
        type: 'sequence',
        index: index || 0,
        isPublic: sequenceData.isPublic || false,
        rewardAnimation: sequenceData.rewardAnimation === '' ? undefined : sequenceData.rewardAnimation
      };

      const sequenceId = await this.saveCard(sequenceCard, parentId, index);
      if (!sequenceId) {
        throw new Error('Failed to create sequence');
      }

      // Then create all the sequence items - inherit public status from parent sequence
      const parentIsPublic = sequenceData.isPublic || false;
      
      for (const item of sequenceData.items) {
        const itemCard: Partial<CardTile> = {
          title: item.title,
          color: item.color,
          image: item.image?.url || '',
          speak: item.speak,
          speech: item.speak,
          type: 'sequence-item',
          parentId: sequenceId,
          index: item.orderIndex,
          isPublic: parentIsPublic // Inherit public status from parent sequence
        };

        await this.saveCard(itemCard, sequenceId, item.orderIndex);
      }

      return sequenceId;
    } catch (error) {
      console.error('Error creating sequence:', error);
      throw error;
    }
  },

  async updateSequence(sequenceId: string, sequenceData: {
    title: string;
    color: string;
    image?: { url: string; alt: string } | null;
    isPublic?: boolean;
    rewardAnimation?: string;
    items: Array<{
      id?: string;
      title: string;
      color: string;
      image?: { url: string; alt: string } | null;
      speak?: string;
      orderIndex: number;
    }>;
  }): Promise<void> {
    try {
      // Update the sequence itself (preserve existing index and parent)
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      if (!userId) {
        throw new Error('No authenticated user found');
      }

      // Get the existing sequence to preserve index and parent
      const existingSequence = await sequenceSupabaseService.getItemById(userId, sequenceId);
      
      const sequenceCard: Partial<CardTile> = {
        id: sequenceId,
        title: sequenceData.title,
        color: sequenceData.color,
        image: sequenceData.image?.url || '',
        type: 'sequence',
        index: existingSequence?.order_index, // Preserve existing index
        parentId: existingSequence?.parent_id, // Preserve existing parent
        isPublic: sequenceData.isPublic ?? existingSequence?.is_public ?? false,
        rewardAnimation: sequenceData.rewardAnimation === '' ? undefined : sequenceData.rewardAnimation
      };

      await this.saveCard(sequenceCard, existingSequence?.parent_id, existingSequence?.order_index);

      // Get existing items
      const existingItems = await this.loadSequence(sequenceId);
      const existingItemsMap = new Map(existingItems.map(item => [item.id, item]));
      const newItemIds = new Set(sequenceData.items.filter(item => item.id && !item.id.startsWith('temp-')).map(item => item.id));

      // Update or create items - inherit public status from parent sequence
      const parentIsPublic = sequenceData.isPublic ?? existingSequence?.is_public ?? false;
      
      for (const item of sequenceData.items) {
        // Check if this is a new item
        if (!item.id || item.id.startsWith('temp-')) {
          // Create new item
          const itemCard: Partial<CardTile> = {
            title: item.title,
            color: item.color,
            image: item.image?.url || '',
            speak: item.speak,
            speech: item.speak,
            type: 'sequence-item',
            parentId: sequenceId,
            index: item.orderIndex,
            isPublic: parentIsPublic
          };
          
          console.log('[updateSequence] Creating new item:', item.title);
          await this.saveCard(itemCard, sequenceId, item.orderIndex);
        } else {
          // Check if existing item has changed
          const existingItem = existingItemsMap.get(item.id);
          
          const hasChanged = !existingItem || 
            existingItem.title !== item.title ||
            existingItem.color !== item.color ||
            existingItem.image !== (item.image?.url || '') ||
            existingItem.speak !== item.speak ||
            existingItem.index !== item.orderIndex ||
            existingItem.isPublic !== parentIsPublic;
          
          if (hasChanged) {
            // Update existing item only if it changed
            const itemCard: Partial<CardTile> = {
              id: item.id,
              title: item.title,
              color: item.color,
              image: item.image?.url || '',
              speak: item.speak,
              speech: item.speak,
              type: 'sequence-item',
              parentId: sequenceId,
              index: item.orderIndex,
              isPublic: parentIsPublic
            };
            
            console.log('[updateSequence] Updating changed item:', item.id, item.title);
            await this.saveCard(itemCard, sequenceId, item.orderIndex);
          } else {
            console.log('[updateSequence] Skipping unchanged item:', item.id, item.title);
          }
        }
      }

      // Delete removed items
      const deletedIds = [...existingItemsMap.keys()].filter(id => !newItemIds.has(id));
      for (const deletedId of deletedIds) {
        console.log('[updateSequence] Deleting removed item:', deletedId);
        await this.deleteCard(deletedId);
      }
    } catch (error) {
      console.error('Error updating sequence:', error);
      throw error;
    }
  },

  // Public Item Methods
  async loadPublicItems(type?: 'card' | 'sequence' | 'all', includeCurated: boolean = true): Promise<CardTile[]> {
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      if (!userId) {
        console.warn('No authenticated user found');
        return [];
      }

      const { currentLocale } = useI18n();
      const locale = currentLocale.value;

      // Load public items with custom ordering
      const publicItems = await sequenceSupabaseService.getPublicItems(userId, locale, type, includeCurated);
      
      return publicItems.map(item => {
        const metadata = item.metadata as CardMetadata;
        // Use custom_index if available, otherwise use original order_index
        const orderIndex = item.custom_index ?? item.order_index;
        
        return {
          id: item.id,
          title: item.name,
          icon: metadata?.icon || item.icon || '',
          color: metadata?.color || item.color || 'primary',
          type: item.type as any,
          image: metadata?.image || '',
          speech: metadata?.speech || item.content || '',
          speak: metadata?.speech || item.content || '',
          index: orderIndex,
          parentId: item.parent_id || undefined,
          parent_id: item.parent_id || undefined,
          // Add ownership info
          ownerId: item.owner_id,
          isOwner: item.owner_id === userId,
          isPublic: item.is_public,
          isCurated: item.is_curated,
          rewardAnimation: metadata?.rewardAnimation,
        };
      });
    } catch (error) {
      console.error('Error loading public sequences:', error);
      return [];
    }
  },

  async saveCustomOrder(itemId: string, customIndex: number): Promise<void> {
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      if (!userId) {
        throw new Error('No authenticated user');
      }

      await sequenceSupabaseService.saveUserItemOrder(userId, itemId, customIndex);
    } catch (error) {
      console.error('Error saving custom order:', error);
      throw error;
    }
  },

  async toggleItemVisibility(itemId: string, isPublic: boolean): Promise<void> {
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      if (!userId) {
        throw new Error('No authenticated user');
      }

      await sequenceSupabaseService.updateSequenceVisibility(itemId, userId, isPublic);
    } catch (error) {
      console.error('Error toggling item visibility:', error);
      throw error;
    }
  },

  async searchPublicItems(query: string, type?: 'card' | 'sequence' | 'all', locale?: string, includeCurated: boolean = true): Promise<CardTile[]> {
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      if (!userId) {
        return [];
      }

      const { currentLocale } = useI18n();
      const searchLocale = locale || currentLocale.value;

      const results = await sequenceSupabaseService.searchPublicItems(query, searchLocale, userId, type, includeCurated);
      
      return results.map(item => {
        const metadata = item.metadata as CardMetadata;
        const orderIndex = item.custom_index ?? item.order_index;
        
        return {
          id: item.id,
          title: item.name,
          icon: metadata?.icon || item.icon || '',
          color: metadata?.color || item.color || 'primary',
          type: item.type as any,
          image: metadata?.image || '',
          speech: metadata?.speech || item.content || '',
          speak: metadata?.speech || item.content || '',
          index: orderIndex,
          parentId: item.parent_id || undefined,
          parent_id: item.parent_id || undefined,
          ownerId: item.owner_id,
          isOwner: item.owner_id === userId,
          isPublic: item.is_public,
          isCurated: item.is_curated,
          rewardAnimation: metadata?.rewardAnimation,
        };
      });
    } catch (error) {
      console.error('Error searching public items:', error);
      return [];
    }
  }
};
