/**
 * Sequence Offline Storage Service
 * Wrapper around the generic offline storage service for sequence-specific operations
 */

import { createOfflineStorage, type OfflineStorageService } from '@tiko/core'
import type { TCardTile as CardTile } from '@tiko/ui'

const CARDS_STORE = 'sequence'
const METADATA_STORE = 'metadata'

interface CardSyncMetadata {
  lastSync: number
  userId: string
  totalSequence: number
}

class SequenceOfflineStorageService {
  private storage: OfflineStorageService

  constructor() {
    this.storage = createOfflineStorage({
      dbName: 'tiko-sequence-offline',
      dbVersion: 1,
      stores: [
        {
          name: CARDS_STORE,
          keyPath: 'key'
        },
        {
          name: METADATA_STORE,
          keyPath: 'key'
        }
      ]
    })
  }

  /**
   * Generate a storage key for sequence
   */
  private getSequenceKey(userId: string, parentId?: string, locale: string = 'en'): string {
    return parentId
      ? `sequence_${userId}_${parentId}_${locale}`
      : `sequence_${userId}_root_${locale}`
  }

  /**
   * Store sequence data
   */
  async storeSequence(
    userId: string,
    sequence: CardTile[],
    parentId?: string,
    locale: string = 'en'
  ): Promise<void> {
    const key = this.getSequenceKey(userId, parentId, locale)

    // Store the sequence with metadata
    await this.storage.store(CARDS_STORE, key, sequence, {
      parentId,
      locale,
      userId
    })
  }

  /**
   * Retrieve sequence data
   */
  async getSequence(
    userId: string,
    parentId?: string,
    locale: string = 'en'
  ): Promise<CardTile[] | null> {
    const key = this.getSequenceKey(userId, parentId, locale)
    const result = await this.storage.retrieve<CardTile[]>(CARDS_STORE, key)
    // The sequence are stored directly as data
    return result?.data || null
  }

  /**
   * Store sync metadata
   */
  async updateSyncMetadata(userId: string, totalSequence: number): Promise<void> {
    const metadata: CardSyncMetadata = {
      userId,
      lastSync: Date.now(),
      totalSequence
    }
    await this.storage.store(METADATA_STORE, userId, metadata)
  }

  /**
   * Get sync metadata
   */
  async getSyncMetadata(userId: string): Promise<CardSyncMetadata | null> {
    const result = await this.storage.retrieve<CardSyncMetadata>(METADATA_STORE, userId)
    return result?.data || null
  }

  /**
   * Check if offline data exists for a user
   */
  async hasOfflineData(userId: string): Promise<boolean> {
    const metadata = await this.getSyncMetadata(userId)
    return metadata !== null && metadata.totalSequence > 0
  }

  /**
   * Clear all data for a specific user
   */
  async clearUserData(userId: string): Promise<void> {
    // Get all sequence for this user
    const allData = await this.storage.getAll<CardTile[]>(CARDS_STORE)

    // Delete each card entry for this user
    for (const item of allData) {
      if (item.metadata?.userId === userId) {
        await this.storage.delete(CARDS_STORE, item.key)
      }
    }

    // Delete metadata
    await this.storage.delete(METADATA_STORE, userId)
  }

  /**
   * Clear all offline data
   */
  async clearAll(): Promise<void> {
    await this.storage.clearStore(CARDS_STORE)
    await this.storage.clearStore(METADATA_STORE)
  }
}

// Export singleton instance
export const offlineStorageService = new SequenceOfflineStorageService()
