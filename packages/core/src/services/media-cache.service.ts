/**
 * Media Cache Service
 * 
 * Fetches public media from a Cloudflare Worker that caches the results
 * to reduce the number of direct Supabase calls.
 */

import { logger } from '../utils/logger';
import type { Media } from '../types/media.types';

interface CachedMediaResponse {
  media: Media[];
  cachedAt: string;
  deploymentVersion: string;
}

class MediaCacheService {
  private workerUrl: string;
  private fallbackToSupabase: boolean = true;

  constructor() {
    // Get worker URL from environment or use default
    this.workerUrl = import.meta.env.VITE_MEDIA_CACHE_WORKER_URL || 'https://tikoapi.org/media/cache';
  }

  /**
   * Fetch all public media items from the cache worker
   * Falls back to direct Supabase fetch if the worker fails
   */
  async getPublicMedia(forceRefresh: boolean = false): Promise<Media[]> {
    try {
      const url = new URL(this.workerUrl);
      if (forceRefresh) {
        url.searchParams.set('refresh', 'true');
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Worker responded with ${response.status}`);
      }

      const data: CachedMediaResponse = await response.json();
      
      logger.debug('[MediaCacheService] Fetched media from cache worker', {
        count: data.media.length,
        cachedAt: data.cachedAt,
        deploymentVersion: data.deploymentVersion,
        cacheStatus: response.headers.get('X-Cache-Status'),
      });

      return data.media;
    } catch (error) {
      logger.error('[MediaCacheService] Failed to fetch from cache worker:', error);
      
      if (this.fallbackToSupabase) {
        logger.info('[MediaCacheService] Falling back to direct Supabase fetch');
        // Import dynamically to avoid circular dependencies
        const { mediaService } = await import('./media-supabase.service');
        return mediaService.getPublicMediaList();
      }
      
      throw error;
    }
  }

  /**
   * Check if the media cache worker is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(this.workerUrl, {
        method: 'OPTIONS',
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get the deployment version from the cache
   */
  async getDeploymentVersion(): Promise<string | null> {
    try {
      const response = await fetch(this.workerUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const deploymentVersion = response.headers.get('X-Deployment-Version');
      return deploymentVersion;
    } catch {
      return null;
    }
  }
}

export const mediaCacheService = new MediaCacheService();