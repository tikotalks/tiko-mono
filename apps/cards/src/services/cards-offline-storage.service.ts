/**
 * Cards Offline Storage Service
 * Wrapper around the generic offline storage service for cards-specific operations
 */

import { createOfflineStorage, type OfflineStorageService } from '@tiko/core'
import type { TCardTile as CardTile } from '@tiko/ui'

const CARDS_STORE = 'cards'
const METADATA_STORE = 'metadata'

interface StoredCards {
  key: string
  parentId?: string
  cards: CardTile[]
  locale: string
  timestamp: number
  userId: string
}

interface CardSyncMetadata {
  lastSync: number
  userId: string
  totalCards: number
}

class CardsOfflineStorageService {
  private storage: OfflineStorageService

  constructor() {
    this.storage = createOfflineStorage({
      dbName: 'tiko-cards-offline',
      dbVersion: 1,
      stores: [
        {
          name: CARDS_STORE,
          keyPath: 'key',
          indexes: [
            { name: 'userId', keyPath: 'userId' },
            { name: 'parentId', keyPath: 'parentId' },
            { name: 'locale', keyPath: 'locale' }
          ]
        },
        {
          name: METADATA_STORE,
          keyPath: 'userId'
        }
      ]
    })
  }

  /**
   * Generate a storage key for cards
   */
  private getCardsKey(userId: string, parentId?: string, locale: string = 'en'): string {
    return parentId 
      ? `cards_${userId}_${parentId}_${locale}`
      : `cards_${userId}_root_${locale}`
  }

  /**
   * Store cards data
   */
  async storeCards(
    userId: string, 
    cards: CardTile[], 
    parentId?: string, 
    locale: string = 'en'
  ): Promise<void> {
    const key = this.getCardsKey(userId, parentId, locale)
    const storedCards: StoredCards = {
      key,
      parentId,
      cards,
      locale,
      timestamp: Date.now(),
      userId
    }
    
    await this.storage.store(CARDS_STORE, key, storedCards)
  }

  /**
   * Retrieve cards data
   */
  async getCards(
    userId: string, 
    parentId?: string, 
    locale: string = 'en'
  ): Promise<CardTile[] | null> {
    const key = this.getCardsKey(userId, parentId, locale)
    const result = await this.storage.retrieve<StoredCards>(CARDS_STORE, key)
    return result?.data?.cards || null
  }

  /**
   * Store sync metadata
   */
  async updateSyncMetadata(userId: string, totalCards: number): Promise<void> {
    const metadata: CardSyncMetadata = {
      userId,
      lastSync: Date.now(),
      totalCards
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
    return metadata !== null && metadata.totalCards > 0
  }

  /**
   * Clear all data for a specific user
   */
  async clearUserData(userId: string): Promise<void> {
    // Get all cards for this user
    const allData = await this.storage.getAll<StoredCards>(CARDS_STORE)
    
    // Delete each card entry for this user
    for (const item of allData) {
      if (item.data.userId === userId) {
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
export const offlineStorageService = new CardsOfflineStorageService()