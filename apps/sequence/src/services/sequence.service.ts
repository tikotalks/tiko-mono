import { itemService } from '@tiko/core'
import type { ItemCreatePayload, ItemUpdatePayload } from '@tiko/core'

export interface Sequence {
  id: string
  title: string
  color?: string
  imageUrl?: string
  speech?: string
  orderIndex: number
  itemCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface SequenceItem {
  id: string
  sequenceId: string
  title: string
  color?: string
  imageUrl?: string
  speech?: string
  orderIndex: number
  createdAt?: string
  updatedAt?: string
}

class SequenceService {
  /**
   * Load all sequences for a user
   */
  async loadSequences(userId: string): Promise<Sequence[]> {
    const items = await itemService.loadItems({
      user_id: userId,
      app_name: 'sequence',
      parent_id: null,
      order: 'order_index.asc'
    })

    return items.map(item => ({
      id: item.id,
      title: item.title,
      color: item.color,
      imageUrl: item.image_url,
      speech: item.speech,
      orderIndex: item.order_index,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }))
  }

  /**
   * Load a single sequence
   */
  async loadSequence(sequenceId: string): Promise<Sequence | null> {
    const item = await itemService.loadItem(sequenceId)
    if (!item) return null

    return {
      id: item.id,
      title: item.title,
      color: item.color,
      imageUrl: item.image_url,
      speech: item.speech,
      orderIndex: item.order_index,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }
  }

  /**
   * Load all items for a sequence
   */
  async loadSequenceItems(sequenceId: string): Promise<SequenceItem[]> {
    const items = await itemService.loadItems({
      parent_id: sequenceId,
      app_name: 'sequence',
      order: 'order_index.asc'
    })

    return items.map(item => ({
      id: item.id,
      sequenceId: item.parent_id!,
      title: item.title,
      color: item.color,
      imageUrl: item.image_url,
      speech: item.speech,
      orderIndex: item.order_index,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }))
  }

  /**
   * Create a new sequence
   */
  async createSequence(userId: string, sequence: Partial<Sequence>): Promise<Sequence> {
    const payload: ItemCreatePayload = {
      user_id: userId,
      app_name: 'sequence',
      title: sequence.title || 'New Sequence',
      color: sequence.color,
      image_url: sequence.imageUrl,
      speech: sequence.speech,
      order_index: sequence.orderIndex ?? 0,
      parent_id: null
    }

    const created = await itemService.createItem(payload)
    
    return {
      id: created.id,
      title: created.title,
      color: created.color,
      imageUrl: created.image_url,
      speech: created.speech,
      orderIndex: created.order_index,
      createdAt: created.created_at,
      updatedAt: created.updated_at
    }
  }

  /**
   * Update a sequence
   */
  async updateSequence(sequenceId: string, updates: Partial<Sequence>): Promise<Sequence> {
    const payload: ItemUpdatePayload = {
      title: updates.title,
      color: updates.color,
      image_url: updates.imageUrl,
      speech: updates.speech,
      order_index: updates.orderIndex
    }

    const updated = await itemService.updateItem(sequenceId, payload)
    
    return {
      id: updated.id,
      title: updated.title,
      color: updated.color,
      imageUrl: updated.image_url,
      speech: updated.speech,
      orderIndex: updated.order_index,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    }
  }

  /**
   * Delete a sequence and all its items
   */
  async deleteSequence(sequenceId: string): Promise<boolean> {
    // First delete all items in the sequence
    const items = await this.loadSequenceItems(sequenceId)
    for (const item of items) {
      await itemService.deleteItem(item.id)
    }

    // Then delete the sequence itself
    return await itemService.deleteItem(sequenceId)
  }

  /**
   * Create a new sequence item
   */
  async createSequenceItem(sequenceId: string, item: Partial<SequenceItem>): Promise<SequenceItem> {
    const payload: ItemCreatePayload = {
      app_name: 'sequence',
      parent_id: sequenceId,
      title: item.title || 'New Item',
      color: item.color,
      image_url: item.imageUrl,
      speech: item.speech,
      order_index: item.orderIndex ?? 0
    }

    const created = await itemService.createItem(payload)
    
    return {
      id: created.id,
      sequenceId: created.parent_id!,
      title: created.title,
      color: created.color,
      imageUrl: created.image_url,
      speech: created.speech,
      orderIndex: created.order_index,
      createdAt: created.created_at,
      updatedAt: created.updated_at
    }
  }

  /**
   * Update a sequence item
   */
  async updateSequenceItem(itemId: string, updates: Partial<SequenceItem>): Promise<SequenceItem> {
    const payload: ItemUpdatePayload = {
      title: updates.title,
      color: updates.color,
      image_url: updates.imageUrl,
      speech: updates.speech,
      order_index: updates.orderIndex
    }

    const updated = await itemService.updateItem(itemId, payload)
    
    return {
      id: updated.id,
      sequenceId: updated.parent_id!,
      title: updated.title,
      color: updated.color,
      imageUrl: updated.image_url,
      speech: updated.speech,
      orderIndex: updated.order_index,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    }
  }

  /**
   * Delete a sequence item
   */
  async deleteSequenceItem(itemId: string): Promise<boolean> {
    return await itemService.deleteItem(itemId)
  }

  /**
   * Reorder sequence items
   */
  async reorderSequenceItems(sequenceId: string, itemIds: string[]): Promise<void> {
    // Update order_index for each item
    for (let i = 0; i < itemIds.length; i++) {
      await itemService.updateItem(itemIds[i], { order_index: i })
    }
  }
}

export const sequenceService = new SequenceService()