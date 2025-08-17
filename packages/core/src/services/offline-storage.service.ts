/**
 * Generic Offline Storage Service
 * Handles persistent storage using IndexedDB for any app
 */

export interface StoredData<T = any> {
  key: string
  data: T
  timestamp: number
  userId?: string
  metadata?: Record<string, any>
}

export interface SyncMetadata {
  lastSync: number
  userId?: string
  totalItems?: number
  [key: string]: any
}

export interface OfflineStorageConfig {
  dbName: string
  dbVersion?: number
  stores: Array<{
    name: string
    keyPath?: string
    indexes?: Array<{
      name: string
      keyPath: string | string[]
      options?: IDBIndexParameters
    }>
  }>
}

export class OfflineStorageService {
  private db: IDBDatabase | null = null
  private dbPromise: Promise<IDBDatabase> | null = null
  private config: OfflineStorageConfig

  constructor(config: OfflineStorageConfig) {
    this.config = {
      dbVersion: 1,
      ...config
    }
  }

  /**
   * Initialize the IndexedDB database
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db
    if (this.dbPromise) return this.dbPromise

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.dbVersion)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log(`IndexedDB ${this.config.dbName} initialized successfully`)
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create stores based on config
        for (const storeConfig of this.config.stores) {
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            const store = db.createObjectStore(storeConfig.name, {
              keyPath: storeConfig.keyPath || 'key'
            })
            
            // Create indexes if specified
            if (storeConfig.indexes) {
              for (const index of storeConfig.indexes) {
                store.createIndex(index.name, index.keyPath, index.options)
              }
            }
          }
        }
      }
    })

    return this.dbPromise
  }

  /**
   * Store data in IndexedDB
   */
  async store<T>(storeName: string, key: string, data: T, metadata?: Record<string, any>): Promise<void> {
    const db = await this.initDB()
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)

    const storedData: StoredData<T> = {
      key,
      data,
      timestamp: Date.now(),
      metadata
    }

    return new Promise((resolve, reject) => {
      const request = store.put(storedData)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Retrieve data from IndexedDB
   */
  async retrieve<T>(storeName: string, key: string): Promise<StoredData<T> | null> {
    const db = await this.initDB()
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)

    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get all data from a store
   */
  async getAll<T>(storeName: string): Promise<StoredData<T>[]> {
    const db = await this.initDB()
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Clear all data from a store
   */
  async clearStore(storeName: string): Promise<void> {
    const db = await this.initDB()
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)

    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Delete specific data from a store
   */
  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.initDB()
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)

    return new Promise((resolve, reject) => {
      const request = store.delete(key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Check if data exists
   */
  async exists(storeName: string, key: string): Promise<boolean> {
    const data = await this.retrieve(storeName, key)
    return data !== null
  }

  /**
   * Get data count in a store
   */
  async count(storeName: string): Promise<number> {
    const db = await this.initDB()
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)

    return new Promise((resolve, reject) => {
      const request = store.count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      this.dbPromise = null
    }
  }
}

// Factory function for creating offline storage instances
export function createOfflineStorage(config: OfflineStorageConfig): OfflineStorageService {
  return new OfflineStorageService(config)
}