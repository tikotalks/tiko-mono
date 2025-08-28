import { useAuthStore, unifiedItemService, type BaseItem, type ItemLoadOptions } from '@tiko/core';
import { useI18n } from '@tiko/core';
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

// Helper function to convert BaseItem to CardTile
function baseItemToCardTile(item: BaseItem): CardTile {
  const metadata = item.metadata as CardMetadata;
  
  return {
    id: item.id,
    title: item.name,
    type: item.type as any,
    icon: metadata?.icon || item.icon || 'square',
    color: metadata?.color || item.color || 'primary',
    image: metadata?.image || '',
    speech: metadata?.speech || item.content || '',
    index: item.order_index ?? 0,
    parentId: item.parent_id || undefined,
    base_locale: item.base_locale || 'en',
    effective_locale: item.effective_locale || item.base_locale || 'en',
    isPublic: item.is_public || false,
    isCurated: item.is_curated || false,
    ownerId: item.user_id,
    user_id: item.user_id,
    has_children: item.has_children || false,
    updated_at: item.updated_at
  };
}

export const cardsService = {
  async loadCards(parentId?: string, includeCurated = false, locale?: string): Promise<CardTile[]> {
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      const isSkipAuth = sessionStorage.getItem('tiko_skip_auth') === 'true';
      
      // If no user and not in skip auth mode, return empty
      if (!userId && !isSkipAuth) {
        console.warn('[CardsService] No authenticated user found and not in skip auth mode');
        return [];
      }
      
      // Get current locale from i18n or use provided locale
      const { currentLocale } = useI18n();
      const effectiveLocale = locale || currentLocale.value;
      
      // In skip auth mode, force includeCurated to true
      const effectiveIncludeCurated = isSkipAuth ? true : includeCurated;
      
      console.log('[CardsService] loadCards - userId:', userId, 'isSkipAuth:', isSkipAuth, 'parentId:', parentId, 'includeCurated:', effectiveIncludeCurated, 'locale:', effectiveLocale);
      
      let items: BaseItem[];
      
      if (isSkipAuth && !userId) {
        // Skip auth mode: Load only curated cards
        if (parentId) {
          // Load children of specific parent
          items = await unifiedItemService.loadItemsByParentId(parentId, {
            includeCurated: true,
            includeChildren: false,
            locale: effectiveLocale
          });
        } else {
          // Load root level curated cards - pass empty string for userId to skip user items
          items = await unifiedItemService.loadRootItems('', APP_NAME, {
            includeCurated: true,
            includeChildren: false,
            locale: effectiveLocale
          });
        }
      } else if (parentId) {
        // Normal mode: Load children of specific parent
        items = await unifiedItemService.loadItemsByParentId(parentId, {
          includeCurated: effectiveIncludeCurated,
          includeChildren: false,
          locale: effectiveLocale
        });
      } else {
        // Normal mode: Load root level cards
        items = await unifiedItemService.loadRootItems(userId, APP_NAME, {
          includeCurated: effectiveIncludeCurated,
          includeChildren: false,
          locale: effectiveLocale
        });
      }
      
      console.log('[CardsService] Loaded', items.length, 'items from ItemService');
      
      // Convert BaseItem to CardTile
      return items.map(baseItemToCardTile);
    } catch (error) {
      console.error('[CardsService] Failed to load cards:', error);
      return [];
    }
  },

  async loadAllCards(includeCurated = false): Promise<CardTile[]> {
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      const isSkipAuth = sessionStorage.getItem('tiko_skip_auth') === 'true';
      
      // If no user and not in skip auth mode, return empty
      if (!userId && !isSkipAuth) {
        console.warn('[CardsService] No authenticated user found and not in skip auth mode');
        return [];
      }
      
      // Get current locale from i18n
      const { currentLocale } = useI18n();
      const effectiveLocale = currentLocale.value;
      
      // In skip auth mode, force includeCurated to true
      const effectiveIncludeCurated = isSkipAuth ? true : includeCurated;
      
      console.log('[CardsService] loadAllCards - userId:', userId, 'isSkipAuth:', isSkipAuth, 'includeCurated:', effectiveIncludeCurated, 'locale:', effectiveLocale);
      
      let items: BaseItem[];
      
      if (isSkipAuth && !userId) {
        // Skip auth mode: Load only curated cards - use empty string for userId
        items = await unifiedItemService.loadItemsByUserAndApp('', APP_NAME, {
          includeCurated: true,
          includeChildren: true,
          locale: effectiveLocale
        });
      } else {
        // Normal mode: Load ALL cards (user + curated) with children automatically loaded
        items = await unifiedItemService.loadItemsByUserAndApp(userId, APP_NAME, {
          includeCurated: effectiveIncludeCurated,
          includeChildren: true,
          locale: effectiveLocale
        });
      }
      
      console.log('[CardsService] Loaded', items.length, 'total items from ItemService (including children)');
      
      // Flatten the hierarchy - convert all items and their children to a flat array
      const allItems: BaseItem[] = [];
      const seenIds = new Set<string>(); // Track seen IDs to prevent duplicates
      
      function collectAllItems(items: BaseItem[]) {
        for (const item of items) {
          // Only add if we haven't seen this ID before
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            allItems.push(item);
          }
          if (item.children && item.children.length > 0) {
            collectAllItems(item.children);
          }
        }
      }
      
      collectAllItems(items);
      console.log('[CardsService] Flattened to', allItems.length, 'total unique items (deduplicated)');
      
      // Convert BaseItem to CardTile
      return allItems.map(baseItemToCardTile);
    } catch (error) {
      console.error('[CardsService] Failed to load all cards:', error);
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
      const isSkipAuth = sessionStorage.getItem('tiko_skip_auth') === 'true';
      
      if (!userId && !isSkipAuth) {
        return false;
      }
      
      // First try to get the item and check has_children flag
      try {
        const item = await unifiedItemService.loadItemById(parentId, { includeChildren: false });
        if (item && item.has_children !== undefined) {
          // For performance, trust the has_children flag
          // Only do the full check if includeCurated is true and has_children is true
          if (!includeCurated || !item.has_children) {
            childrenCache.set(cacheKey, item.has_children);
            return item.has_children;
          }
        }
      } catch (error) {
        console.warn('Failed to check has_children flag:', error);
      }
      
      // Fallback to loading children (or if we need to check curated items)
      let children: any[] = [];
      
      // Use unified item service for checking children
      if (isSkipAuth && !userId) {
        // In skip auth mode without user, only check for curated items
        if (includeCurated) {
          children = await unifiedItemService.loadItemsByParentId(parentId, {
            includeCurated: true,
            includeChildren: false,
            locale: 'en' // Default locale for existence check
          });
        }
      } else {
        // Normal mode with user authentication
        children = await unifiedItemService.loadItemsByParentId(parentId, {
          includeCurated,
          includeChildren: false,
          locale: 'en' // Default locale for existence check
        });
      }
      
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