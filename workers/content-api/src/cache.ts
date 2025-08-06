import { Env, CacheEntry, ContentQuery } from './types';

export class CacheManager {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  /**
   * Generate a cache key from the query
   */
  generateCacheKey(query: ContentQuery): string {
    const baseKey = `${query.method}:${JSON.stringify(query.params)}`;
    const versionSuffix = query.deployedVersionId ? `:v${query.deployedVersionId}` : '';
    return `content${versionSuffix}:${this.hashString(baseKey)}`;
  }

  /**
   * Simple hash function for consistent cache keys
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cached content if available and not expired
   */
  async get(query: ContentQuery): Promise<CacheEntry | null> {
    if (query.noCache) {
      return null;
    }

    const cacheKey = this.generateCacheKey(query);
    
    try {
      const cached = await this.env.CONTENT_CACHE.get(cacheKey, 'json') as CacheEntry | null;
      
      if (!cached) {
        return null;
      }

      // Check if cache is still valid based on TTL
      const ttl = parseInt(this.env.CACHE_TTL) * 1000; // Convert to milliseconds
      const age = Date.now() - cached.timestamp;
      
      if (age > ttl) {
        // Cache expired, delete it
        await this.env.CONTENT_CACHE.delete(cacheKey);
        return null;
      }

      return cached;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Store content in cache
   */
  async set(query: ContentQuery, data: any): Promise<void> {
    const cacheKey = this.generateCacheKey(query);
    const etag = this.generateETag(data);
    
    const cacheEntry: CacheEntry = {
      data,
      timestamp: Date.now(),
      etag,
      queryHash: cacheKey
    };

    try {
      // Store with TTL
      const ttl = parseInt(this.env.CACHE_TTL);
      await this.env.CONTENT_CACHE.put(
        cacheKey, 
        JSON.stringify(cacheEntry),
        { expirationTtl: ttl }
      );
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await this.env.CONTENT_CACHE.list({ prefix: pattern });
      
      for (const key of keys.keys) {
        await this.env.CONTENT_CACHE.delete(key.name);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Generate ETag for response caching
   */
  private generateETag(data: any): string {
    const content = JSON.stringify(data);
    return `"${this.hashString(content)}"`;
  }

  /**
   * Clear all cache entries for a specific version
   */
  async clearVersion(versionId: string): Promise<void> {
    await this.invalidate(`content:v${versionId}:`);
  }
}