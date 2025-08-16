export interface CachedTranslation {
  translations: Record<string, string>
  timestamp: number
  ttl: number
}

export class TranslationCache {
  private kv: KVNamespace
  private defaultTTL: number = 60 * 60 * 24 * 30 // 30 days in seconds

  constructor(kv: KVNamespace) {
    this.kv = kv
  }

  /**
   * Generate a cache key based on text, languages, and context
   */
  private async generateKey(text: string, languages: string[], context?: string): Promise<string> {
    const sortedLanguages = [...languages].sort().join(',')
    const keyData = `${text}|${sortedLanguages}|${context || 'no-context'}`
    
    // Use Web Crypto API to create a hash
    const encoder = new TextEncoder()
    const data = encoder.encode(keyData)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    return `translation:${hashHex.substring(0, 16)}`
  }

  /**
   * Get cached translation if available and not expired
   */
  async get(text: string, languages: string[], context?: string): Promise<Record<string, string> | null> {
    try {
      const key = await this.generateKey(text, languages, context)
      const cached = await this.kv.get<CachedTranslation>(key, 'json')
      
      if (!cached) {
        return null
      }

      // Check if cache is still valid
      const now = Date.now()
      if (now > cached.timestamp + (cached.ttl * 1000)) {
        // Cache expired, delete it
        await this.kv.delete(key)
        return null
      }

      console.log(`Cache hit for key: ${key}`)
      return cached.translations
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Store translation in cache
   */
  async set(
    text: string, 
    languages: string[], 
    translations: Record<string, string>, 
    context?: string,
    ttl?: number
  ): Promise<void> {
    try {
      const key = await this.generateKey(text, languages, context)
      const cacheData: CachedTranslation = {
        translations,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTTL
      }

      await this.kv.put(key, JSON.stringify(cacheData), {
        expirationTtl: ttl || this.defaultTTL
      })

      console.log(`Cached translation for key: ${key}`)
    } catch (error) {
      console.error('Cache set error:', error)
      // Don't throw - caching errors shouldn't break the translation flow
    }
  }

  /**
   * Clear specific cache entry
   */
  async delete(text: string, languages: string[], context?: string): Promise<void> {
    try {
      const key = await this.generateKey(text, languages, context)
      await this.kv.delete(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }
}