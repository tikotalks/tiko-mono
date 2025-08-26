import { defineStore } from 'pinia';
import { ref, reactive, computed } from 'vue';
import { ttsService } from '../services/tts/tts.service';
import type { AudioMetadata } from '../services/tts/types';

interface AudioCacheEntry {
  url: string;
  audio?: HTMLAudioElement;
  metadata?: AudioMetadata;
  loading: boolean;
  error?: string;
  timestamp: number;
}

// Simple hash function for generating cache keys
function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export const useSpeechStore = defineStore('speech', () => {
  // Cache for audio URLs and elements - using reactive instead of ref for better Map support
  const audioCache = reactive(new Map<string, AudioCacheEntry>());
  
  console.log('[SpeechStore] Store initialized');
  
  // Get cache key for text and language
  const getCacheKey = (text: string, language: string) => {
    const key = `${hashText(text)}_${language}`;
    console.log('[SpeechStore] Cache key generated:', {
      text: text.substring(0, 50) + '...',
      language,
      hash: hashText(text),
      fullKey: key
    });
    return key;
  };
  
  // Check if audio exists in cache
  const hasAudio = (text: string, language: string): boolean => {
    const cacheKey = getCacheKey(text, language);
    const entry = audioCache.get(cacheKey);
    return !!(entry && entry.url && !entry.error);
  };
  
  // Get audio from cache
  const getAudio = (text: string, language: string): AudioCacheEntry | null => {
    const cacheKey = getCacheKey(text, language);
    return audioCache.get(cacheKey) || null;
  };
  
  // Preload audio for a single text
  const preloadAudio = async (text: string, language: string): Promise<AudioCacheEntry | null> => {
    const cacheKey = getCacheKey(text, language);
    
    // Check if already cached
    const existing = audioCache.get(cacheKey);
    if (existing && existing.url && !existing.error) {
      console.log('[SpeechStore] Audio already cached for:', cacheKey);
      return existing;
    }
    
    // Mark as loading
    const entry: AudioCacheEntry = {
      url: '',
      loading: true,
      timestamp: Date.now()
    };
    audioCache.set(cacheKey, entry);
    
    try {
      // Get TTS configuration
      const config = ttsService.getTTSConfig(text, language);
      
      // Skip browser-only TTS
      if (config.provider === 'browser') {
        entry.loading = false;
        entry.error = 'Browser TTS only';
        return null;
      }
      
      // Get audio URL from TTS service
      console.log('[SpeechStore] Fetching audio URL for:', cacheKey);
      const response = await ttsService.getAudioForText({
        text,
        language
      });
      
      if (!response.success || !response.audioUrl) {
        entry.loading = false;
        entry.error = response.error || 'Failed to get audio URL';
        return null;
      }
      
      // Update cache entry with URL
      entry.url = response.audioUrl;
      entry.metadata = response.metadata;
      
      // Create audio element
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = response.audioUrl;
      
      // Wait for audio to load
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Audio load timeout'));
        }, 10000);
        
        audio.addEventListener('canplaythrough', () => {
          clearTimeout(timeout);
          resolve(undefined);
        }, { once: true });
        
        audio.addEventListener('error', (e) => {
          clearTimeout(timeout);
          reject(e);
        }, { once: true });
        
        // Start loading
        audio.load();
      });
      
      // Update entry with loaded audio
      entry.audio = audio;
      entry.loading = false;
      console.log('[SpeechStore] Successfully preloaded audio for:', cacheKey);
      
      return entry;
    } catch (err) {
      console.error('[SpeechStore] Failed to preload audio:', err);
      entry.loading = false;
      entry.error = err instanceof Error ? err.message : 'Unknown error';
      return null;
    }
  };
  
  // Preload multiple texts
  const preloadMultiple = async (
    texts: Array<{ text: string; language: string }>
  ) => {
    console.log(`[SpeechStore] preloadMultiple called with ${texts.length} texts`);
    console.log('[SpeechStore] Texts to preload:', texts.map(t => t.text.substring(0, 30) + '...'));
    
    // Process in batches to avoid overwhelming the browser
    const batchSize = 3;
    const promises: Promise<AudioCacheEntry | null>[] = [];
    
    for (const { text, language } of texts) {
      promises.push(preloadAudio(text, language));
    }
    
    // Process in batches
    for (let i = 0; i < promises.length; i += batchSize) {
      const batch = promises.slice(i, i + batchSize);
      await Promise.all(batch);
    }
    
    console.log('[SpeechStore] Batch preloading complete');
  };
  
  // Get or create audio for text
  const getOrCreateAudio = async (
    text: string, 
    language: string
  ): Promise<{ audio: HTMLAudioElement | null; url: string; metadata?: AudioMetadata }> => {
    const cacheKey = getCacheKey(text, language);
    let entry = audioCache.get(cacheKey);
    
    console.log('[SpeechStore] getOrCreateAudio called for:', cacheKey);
    console.log('[SpeechStore] Current cache size:', audioCache.size);
    console.log('[SpeechStore] Cached keys:', Array.from(audioCache.keys()));
    console.log('[SpeechStore] Entry found:', !!entry);
    
    // If not cached or had error, try to load it
    if (!entry || entry.error) {
      console.log('[SpeechStore] Audio not cached or has error, loading:', cacheKey);
      entry = await preloadAudio(text, language);
    } else {
      console.log('[SpeechStore] Using cached audio for:', cacheKey);
    }
    
    // Wait for loading to complete if in progress
    if (entry && entry.loading) {
      console.log('[SpeechStore] Audio is loading, waiting...', cacheKey);
      // Poll until loading is complete
      while (entry.loading) {
        await new Promise(resolve => setTimeout(resolve, 100));
        entry = audioCache.get(cacheKey);
        if (!entry) break;
      }
    }
    
    if (!entry || !entry.url) {
      return { audio: null, url: '' };
    }
    
    // If we have URL but no audio element, create one
    if (!entry.audio && entry.url) {
      console.log('[SpeechStore] Creating audio element for cached URL:', cacheKey);
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = entry.url;
      entry.audio = audio;
    }
    
    return {
      audio: entry.audio || null,
      url: entry.url,
      metadata: entry.metadata
    };
  };
  
  // Clear all cached audio
  const clearCache = () => {
    audioCache.forEach(entry => {
      if (entry.audio) {
        entry.audio.pause();
        entry.audio.src = '';
      }
    });
    audioCache.clear();
    console.log('[SpeechStore] Cache cleared');
  };
  
  // Clean up old entries (older than 1 hour)
  const cleanupOldEntries = () => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const toDelete: string[] = [];
    
    audioCache.forEach((entry, key) => {
      if (entry.timestamp < oneHourAgo) {
        if (entry.audio) {
          entry.audio.pause();
          entry.audio.src = '';
        }
        toDelete.push(key);
      }
    });
    
    toDelete.forEach(key => audioCache.delete(key));
    
    if (toDelete.length > 0) {
      console.log(`[SpeechStore] Cleaned up ${toDelete.length} old entries`);
    }
  };
  
  // Expose cache size as a computed for devtools
  const cacheSize = computed(() => audioCache.size);
  const cachedKeys = computed(() => Array.from(audioCache.keys()));
  
  return {
    // State
    cacheSize,
    cachedKeys,
    
    // Methods
    getCacheKey,
    hasAudio,
    getAudio,
    preloadAudio,
    preloadMultiple,
    getOrCreateAudio,
    clearCache,
    cleanupOldEntries
  };
});