/**
 * Offline Storage Service
 * Handles persistent storage of cards data using IndexedDB
 */

import type { TCardTile as CardTile } from '@tiko/ui'

const DB_NAME = 'tiko-cards-offline'
const DB_VERSION = 1
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

interface SyncMetadata {
  lastSync: number
  userId: string
  totalCards: number
}

class OfflineStorageService {
  private db: IDBDatabase | null = null
  private dbPromise: Promise<IDBDatabase> | null = null

  /**
   * Initialize the IndexedDB database
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db
    if (this.dbPromise) return this.dbPromise

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('IndexedDB initialized successfully')
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create cards store
        if (!db.objectStoreNames.contains(CARDS_STORE)) {
          const cardsStore = db.createObjectStore(CARDS_STORE, { keyPath: 'key' })
          cardsStore.createIndex('userId', 'userId', { unique: false })
          cardsStore.createIndex('parentId', 'parentId', { unique: false })
          cardsStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Create metadata store
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: 'userId' })
        }
      }
    })

    return this.dbPromise
  }

  /**
   * Generate storage key for cards
   */
  private getStorageKey(userId: string, parentId?: string, locale?: string): string {
    return `${userId}_${parentId || 'root'}_${locale || 'default'}`
  }

  /**
   * Store cards in IndexedDB
   */
  async storeCards(
    userId: string,
    cards: CardTile[],
    parentId?: string,
    locale?: string
  ): Promise<void> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([CARDS_STORE], 'readwrite')
      const store = transaction.objectStore(CARDS_STORE)

      const data: StoredCards = {
        key: this.getStorageKey(userId, parentId, locale),
        parentId,
        cards,
        locale: locale || 'default',
        timestamp: Date.now(),
        userId
      }

      await new Promise<void>((resolve, reject) => {
        const request = store.put(data)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      console.log(`[OfflineStorage] Stored ${cards.length} cards for ${data.key}`)
    } catch (error) {
      console.error('[OfflineStorage] Failed to store cards:', error)
      throw error
    }
  }

  /**
   * Retrieve cards from IndexedDB
   */
  async getCards(
    userId: string,
    parentId?: string,
    locale?: string
  ): Promise<CardTile[] | null> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([CARDS_STORE], 'readonly')
      const store = transaction.objectStore(CARDS_STORE)
      const key = this.getStorageKey(userId, parentId, locale)

      const data = await new Promise<StoredCards | null>((resolve, reject) => {
        const request = store.get(key)
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      })

      if (data) {
        console.log(`[OfflineStorage] Retrieved ${data.cards.length} cards for ${key}`)
        return data.cards
      }

      return null
    } catch (error) {
      console.error('[OfflineStorage] Failed to retrieve cards:', error)
      return null
    }
  }

  /**
   * Get all stored cards for a user
   */
  async getAllCardsForUser(userId: string): Promise<StoredCards[]> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([CARDS_STORE], 'readonly')
      const store = transaction.objectStore(CARDS_STORE)
      const index = store.index('userId')

      const cards = await new Promise<StoredCards[]>((resolve, reject) => {
        const request = index.getAll(userId)
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      })

      console.log(`[OfflineStorage] Retrieved ${cards.length} card groups for user ${userId}`)
      return cards
    } catch (error) {
      console.error('[OfflineStorage] Failed to get all cards:', error)
      return []
    }
  }

  /**
   * Update sync metadata
   */
  async updateSyncMetadata(userId: string, totalCards: number): Promise<void> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([METADATA_STORE], 'readwrite')
      const store = transaction.objectStore(METADATA_STORE)

      const metadata: SyncMetadata = {
        lastSync: Date.now(),
        userId,
        totalCards
      }

      await new Promise<void>((resolve, reject) => {
        const request = store.put(metadata)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      console.log(`[OfflineStorage] Updated sync metadata for user ${userId}`)
    } catch (error) {
      console.error('[OfflineStorage] Failed to update sync metadata:', error)
    }
  }

  /**
   * Get sync metadata
   */
  async getSyncMetadata(userId: string): Promise<SyncMetadata | null> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([METADATA_STORE], 'readonly')
      const store = transaction.objectStore(METADATA_STORE)

      const metadata = await new Promise<SyncMetadata | null>((resolve, reject) => {
        const request = store.get(userId)
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      })

      return metadata
    } catch (error) {
      console.error('[OfflineStorage] Failed to get sync metadata:', error)
      return null
    }
  }

  /**
   * Clear all data for a user
   */
  async clearUserData(userId: string): Promise<void> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([CARDS_STORE, METADATA_STORE], 'readwrite')
      
      // Clear cards
      const cardsStore = transaction.objectStore(CARDS_STORE)
      const cardsIndex = cardsStore.index('userId')
      const cardsRequest = cardsIndex.getAllKeys(userId)
      
      cardsRequest.onsuccess = () => {
        const keys = cardsRequest.result
        keys.forEach(key => cardsStore.delete(key))
      }

      // Clear metadata
      const metadataStore = transaction.objectStore(METADATA_STORE)
      metadataStore.delete(userId)

      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      })

      console.log(`[OfflineStorage] Cleared all data for user ${userId}`)
    } catch (error) {
      console.error('[OfflineStorage] Failed to clear user data:', error)
    }
  }

  /**
   * Check if we have offline data for a user
   */
  async hasOfflineData(userId: string): Promise<boolean> {
    const metadata = await this.getSyncMetadata(userId)
    return metadata !== null && metadata.totalCards > 0
  }

  /**
   * Get storage size estimate
   */
  async getStorageInfo(): Promise<{ usage: number; quota: number } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0
        }
      } catch (error) {
        console.error('[OfflineStorage] Failed to get storage estimate:', error)
      }
    }
    return null
  }
}

export const offlineStorageService = new OfflineStorageService()