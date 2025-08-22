// ItemService provides a unified interface for all item operations
// This replaces direct database calls from individual apps

export interface BaseItem {
  id: string
  user_id: string
  app_name: string
  type: string
  name: string
  content?: string
  metadata?: any
  parent_id?: string | null
  order_index: number
  icon?: string
  color?: string
  base_locale?: string
  effective_locale?: string
  created_at: string
  updated_at: string

  // Public item fields
  owner_id?: string
  is_public?: boolean
  is_curated?: boolean
  custom_index?: number

  // Additional item properties
  is_favorite?: boolean
  is_completed?: boolean
  tags?: string[]

  // Children loaded automatically
  children?: BaseItem[]
}

export interface ItemFilters {
  type?: string
  parent_id?: string | null
  is_favorite?: boolean
  is_completed?: boolean
  is_public?: boolean
  tags?: string[]
  app_name?: string
  search?: string
}

export interface CreateItemPayload extends Omit<BaseItem, 'id' | 'created_at' | 'updated_at' | 'user_id'> {}

export interface UpdateItemPayload extends Partial<Omit<BaseItem, 'id' | 'created_at' | 'updated_at' | 'user_id'>> {}

export interface BulkUpdatePayload {
  ids: string[]
  updates: Partial<BaseItem>
}

export interface ItemResult<T = BaseItem> {
  success: boolean
  data?: T
  error?: string
}

export interface ItemStats {
  total: number
  by_type: Record<string, number>
  by_app: Record<string, number>
  favorites: number
  completed: number
  public: number
}

export interface ItemLoadOptions {
  includeCurated?: boolean
  includeChildren?: boolean
  locale?: string
}

export interface ItemService {
  getItems(userId: string, filters?: ItemFilters): Promise<ItemResult<BaseItem[]>>
  createItem(payload: CreateItemPayload): Promise<BaseItem>
  updateItem(itemId: string, payload: UpdateItemPayload): Promise<BaseItem>
  deleteItem(itemId: string): Promise<void>
  reorderItems(itemIds: string[]): Promise<ItemResult<void>>
  moveItem(itemId: string, newParentId: string | null, newIndex?: number): Promise<ItemResult<BaseItem>>
  getStats(userId: string, appName: string): Promise<ItemStats>
}

class ItemServiceImpl {
  private async getAuthToken(): Promise<string | null> {
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
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const token = await this.getAuthToken();

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials missing');
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
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

  /**
   * Load a single item by ID with automatic children loading
   */
  async loadItemById(itemId: string, options: ItemLoadOptions = {}): Promise<BaseItem | null> {
    const {
      includeChildren = true,
      locale = 'en-GB'
    } = options;

    try {
      console.log('[ItemService] Loading item by ID:', itemId);

      // Load the main item
      const params = new URLSearchParams();
      params.append('id', `eq.${itemId}`);

      const items = await this.apiRequest<BaseItem[]>(`items?${params.toString()}`);

      if (items.length === 0) {
        console.log('[ItemService] Item not found:', itemId);
        return null;
      }

      const item = items[0];
      console.log('[ItemService] Item loaded:', item.name);

      // Load children if requested
      if (includeChildren) {
        const children = await this.loadItemChildren(itemId, options);
        item.children = children;
        console.log('[ItemService] Loaded', children.length, 'children for item:', item.name);
      }

      return item;
    } catch (error) {
      console.error('[ItemService] Error loading item by ID:', error);
      throw error;
    }
  }

  /**
   * Load items by user and app with automatic children loading
   */
  async loadItemsByUserAndApp(
    userId: string,
    appName: string,
    options: ItemLoadOptions = {}
  ): Promise<BaseItem[]> {
    const {
      includeCurated = true,
      includeChildren = true,
      locale = 'en-GB'
    } = options;

    try {
      console.log('[ItemService] Loading items for user:', userId, 'app:', appName);

      // Build query for user items
      let userItems: BaseItem[] = [];
      if (userId) {
        const userParams = new URLSearchParams();
        userParams.append('user_id', `eq.${userId}`);
        userParams.append('app_name', `eq.${appName}`);
        userParams.append('order', 'order_index.asc,created_at.asc');

        userItems = await this.apiRequest<BaseItem[]>(`items?${userParams.toString()}`);
        console.log('[ItemService] Loaded', userItems.length, 'user items');
      }

      // Load curated public items if requested
      let curatedItems: BaseItem[] = [];
      if (includeCurated) {
        const curatedParams = new URLSearchParams();
        curatedParams.append('app_name', `eq.${appName}`);
        curatedParams.append('is_curated', 'eq.true');
        curatedParams.append('is_public', 'eq.true');
        curatedParams.append('order', 'order_index.asc,created_at.asc');

        curatedItems = await this.apiRequest<BaseItem[]>(`items?${curatedParams.toString()}`);
        console.log('[ItemService] Loaded', curatedItems.length, 'curated items');
      }

      // Combine and deduplicate items
      const allItems = [...userItems, ...curatedItems];
      const deduplicatedItems = allItems.filter((item, index, arr) =>
        arr.findIndex(i => i.id === item.id) === index
      );

      console.log('[ItemService] Total items after deduplication:', deduplicatedItems.length);

      // Load children for all items if requested
      if (includeChildren) {
        console.log('[ItemService] Loading children for all items...');

        await Promise.all(
          deduplicatedItems.map(async (item) => {
            const children = await this.loadItemChildren(item.id, options);
            item.children = children;
          })
        );

        const totalChildren = deduplicatedItems.reduce((sum, item) => sum + (item.children?.length || 0), 0);
        console.log('[ItemService] Loaded', totalChildren, 'children total across all items');
      }

      return deduplicatedItems;
    } catch (error) {
      console.error('[ItemService] Error loading items by user and app:', error);
      throw error;
    }
  }

  /**
   * Load children of a specific item
   */
  async loadItemChildren(parentId: string, options: ItemLoadOptions = {}): Promise<BaseItem[]> {
    try {
      const params = new URLSearchParams();
      params.append('parent_id', `eq.${parentId}`);
      params.append('order', 'order_index.asc,created_at.asc');

      const children = await this.apiRequest<BaseItem[]>(`items?${params.toString()}`);

      // Recursively load children of children if they exist
      if (options.includeChildren !== false) {
        await Promise.all(
          children.map(async (child) => {
            const grandchildren = await this.loadItemChildren(child.id, options);
            child.children = grandchildren;
          })
        );
      }

      return children;
    } catch (error) {
      console.error('[ItemService] Error loading item children:', error);
      return [];
    }
  }

  /**
   * Load items by parent ID (alias for loadItemChildren for consistency)
   */
  async loadItemsByParentId(parentId: string, options: ItemLoadOptions = {}): Promise<BaseItem[]> {
    return this.loadItemChildren(parentId, options);
  }

  /**
   * Create a new item
   */
  async createItem(itemData: Partial<BaseItem>): Promise<BaseItem> {
    try {
      console.log('[ItemService] Creating new item:', itemData.name);

      const response = await this.apiRequest<BaseItem[]>('items', {
        method: 'POST',
        body: JSON.stringify([itemData]) // Supabase expects an array for POST
      });

      const createdItem = response[0];
      console.log('[ItemService] Item created:', createdItem.name, 'ID:', createdItem.id);
      return createdItem;
    } catch (error) {
      console.error('[ItemService] Error creating item:', error);
      throw error;
    }
  }

  /**
   * Update an existing item
   */
  async updateItem(itemId: string, updates: Partial<BaseItem>): Promise<BaseItem> {
    try {
      console.log('[ItemService] Updating item:', itemId, updates);

      const params = new URLSearchParams();
      params.append('id', `eq.${itemId}`);

      const response = await this.apiRequest<BaseItem[]>(`items?${params.toString()}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });

      if (response.length === 0) {
        throw new Error('Item not found or update failed');
      }

      const updatedItem = response[0];
      console.log('[ItemService] Item updated:', updatedItem.name);
      return updatedItem;
    } catch (error) {
      console.error('[ItemService] Error updating item:', error);
      throw error;
    }
  }

  /**
   * Delete an item
   */
  async deleteItem(itemId: string): Promise<void> {
    try {
      console.log('[ItemService] Deleting item:', itemId);

      const params = new URLSearchParams();
      params.append('id', `eq.${itemId}`);

      await this.apiRequest(`items?${params.toString()}`, {
        method: 'DELETE'
      });

      console.log('[ItemService] Item deleted:', itemId);
    } catch (error) {
      console.error('[ItemService] Error deleting item:', error);
      throw error;
    }
  }

  /**
   * Update item order indices for a set of items
   */
  async updateItemOrder(itemUpdates: Array<{ id: string; order_index: number }>): Promise<void> {
    try {
      console.log('[ItemService] Updating order for', itemUpdates.length, 'items');

      // Update each item's order_index
      await Promise.all(
        itemUpdates.map(update =>
          this.updateItem(update.id, { order_index: update.order_index })
        )
      );

      console.log('[ItemService] Order updated for all items');
    } catch (error) {
      console.error('[ItemService] Error updating item order:', error);
      throw error;
    }
  }

  /**
   * Duplicate an item (and optionally its children)
   */
  async duplicateItem(itemId: string, includeChildren = true): Promise<BaseItem> {
    try {
      console.log('[ItemService] Duplicating item:', itemId, 'includeChildren:', includeChildren);

      // Load the original item with its children
      const originalItem = await this.loadItemById(itemId, { includeChildren });
      if (!originalItem) {
        throw new Error('Original item not found');
      }

      // Create the duplicate (without children first)
      const duplicateData: Partial<BaseItem> = {
        ...originalItem,
        id: undefined, // Let the database generate a new ID
        name: `${originalItem.name} (Copy)`,
        created_at: undefined,
        updated_at: undefined,
        children: undefined // Don't include children in the create request
      };

      const duplicatedItem = await this.createItem(duplicateData);

      // If including children, recursively duplicate them
      if (includeChildren && originalItem.children && originalItem.children.length > 0) {
        const duplicatedChildren = await Promise.all(
          originalItem.children.map(async (child) => {
            const duplicatedChild = await this.duplicateItem(child.id, true);
            // Update the parent_id to point to the new parent
            return await this.updateItem(duplicatedChild.id, { parent_id: duplicatedItem.id });
          })
        );

        duplicatedItem.children = duplicatedChildren;
      }

      console.log('[ItemService] Item duplicated:', duplicatedItem.name);
      return duplicatedItem;
    } catch (error) {
      console.error('[ItemService] Error duplicating item:', error);
      throw error;
    }
  }

  /**
   * Search items by name or content
   */
  async searchItems(
    userId: string,
    appName: string,
    searchQuery: string,
    options: ItemLoadOptions = {}
  ): Promise<BaseItem[]> {
    try {
      console.log('[ItemService] Searching items:', searchQuery);

      const params = new URLSearchParams();
      params.append('user_id', `eq.${userId}`);
      params.append('app_name', `eq.${appName}`);
      params.append('or', `name.ilike.*${searchQuery}*,content.ilike.*${searchQuery}*`);
      params.append('order', 'name.asc');

      const items = await this.apiRequest<BaseItem[]>(`items?${params.toString()}`);

      // Load children if requested
      if (options.includeChildren) {
        await Promise.all(
          items.map(async (item) => {
            const children = await this.loadItemChildren(item.id, options);
            item.children = children;
          })
        );
      }

      console.log('[ItemService] Found', items.length, 'items matching search');
      return items;
    } catch (error) {
      console.error('[ItemService] Error searching items:', error);
      throw error;
    }
  }

  /**
   * Load all root-level items (items without a parent) for a user and app
   */
  async loadRootItems(userId: string, appName: string, options: ItemLoadOptions = {}): Promise<BaseItem[]> {
    const {
      includeCurated = true,
      includeChildren = true,
      locale = 'en-GB'
    } = options;

    try {
      console.log('[ItemService] Loading root items for user:', userId, 'app:', appName);

      // Build query for user root items
      let userItems: BaseItem[] = [];
      if (userId) {
        const userParams = new URLSearchParams();
        userParams.append('user_id', `eq.${userId}`);
        userParams.append('app_name', `eq.${appName}`);
        userParams.append('parent_id', 'is.null');
        userParams.append('order', 'order_index.asc,created_at.asc');

        userItems = await this.apiRequest<BaseItem[]>(`items?${userParams.toString()}`);
      }

      // Load curated public root items if requested
      let curatedItems: BaseItem[] = [];
      if (includeCurated) {
        const curatedParams = new URLSearchParams();
        curatedParams.append('app_name', `eq.${appName}`);
        curatedParams.append('is_curated', 'eq.true');
        curatedParams.append('is_public', 'eq.true');
        curatedParams.append('parent_id', 'is.null');
        curatedParams.append('order', 'order_index.asc,created_at.asc');

        curatedItems = await this.apiRequest<BaseItem[]>(`items?${curatedParams.toString()}`);
      }

      // Combine and deduplicate
      const allItems = [...userItems, ...curatedItems];
      const deduplicatedItems = allItems.filter((item, index, arr) =>
        arr.findIndex(i => i.id === item.id) === index
      );

      // Load children if requested
      if (includeChildren) {
        await Promise.all(
          deduplicatedItems.map(async (item) => {
            const children = await this.loadItemChildren(item.id, options);
            item.children = children;
          })
        );
      }

      console.log('[ItemService] Loaded', deduplicatedItems.length, 'root items');
      return deduplicatedItems;
    } catch (error) {
      console.error('[ItemService] Error loading root items:', error);
      throw error;
    }
  }

  /**
   * Get items with filters (implements ItemService interface)
   */
  async getItems(userId: string, filters: ItemFilters = {}): Promise<ItemResult<BaseItem[]>> {
    try {
      const params = new URLSearchParams();
      params.append('user_id', `eq.${userId}`);

      if (filters.type) {
        params.append('type', `eq.${filters.type}`);
      }

      if (filters.parent_id !== undefined) {
        if (filters.parent_id === null) {
          params.append('parent_id', 'is.null');
        } else {
          params.append('parent_id', `eq.${filters.parent_id}`);
        }
      }

      if (filters.is_favorite !== undefined) {
        params.append('is_favorite', `eq.${filters.is_favorite}`);
      }

      if (filters.is_completed !== undefined) {
        params.append('is_completed', `eq.${filters.is_completed}`);
      }

      if (filters.is_public !== undefined) {
        params.append('is_public', `eq.${filters.is_public}`);
      }

      params.append('order', 'order_index.asc,created_at.asc');

      const items = await this.apiRequest<BaseItem[]>(`items?${params.toString()}`);

      return {
        success: true,
        data: items
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Reorder items (implements ItemService interface)
   */
  async reorderItems(itemIds: string[]): Promise<ItemResult<void>> {
    try {
      const updates = itemIds.map((id, index) => ({ id, order_index: index }));
      await this.updateItemOrder(updates);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Move item to new parent (implements ItemService interface)
   */
  async moveItem(itemId: string, newParentId: string | null, newIndex?: number): Promise<ItemResult<BaseItem>> {
    try {
      const updates: Partial<BaseItem> = { parent_id: newParentId };

      if (newIndex !== undefined) {
        updates.order_index = newIndex;
      }

      const item = await this.updateItem(itemId, updates);

      return {
        success: true,
        data: item
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get item statistics (implements ItemService interface)
   */
  async getStats(userId: string, appName: string): Promise<ItemStats> {
    try {
      const params = new URLSearchParams();
      params.append('user_id', `eq.${userId}`);
      params.append('app_name', `eq.${appName}`);

      const items = await this.apiRequest<BaseItem[]>(`items?${params.toString()}`);

      const stats: ItemStats = {
        total: items.length,
        by_type: {},
        by_app: {},
        favorites: items.filter(i => i.is_favorite).length,
        completed: items.filter(i => i.is_completed).length,
        public: items.filter(i => i.is_public).length
      };

      // Count by type
      items.forEach(item => {
        stats.by_type[item.type] = (stats.by_type[item.type] || 0) + 1;
        stats.by_app[item.app_name] = (stats.by_app[item.app_name] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('[ItemService] Error getting stats:', error);
      return {
        total: 0,
        by_type: {},
        by_app: {},
        favorites: 0,
        completed: 0,
        public: 0
      };
    }
  }
}

// Export singleton instance
export const unifiedItemService = new ItemServiceImpl();

// Also export as itemService for backwards compatibility
export const itemService = unifiedItemService;
