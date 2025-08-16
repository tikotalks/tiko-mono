import { ref, onUnmounted, computed } from 'vue';
import { useTextToSpeech } from '@tiko/ui';
import { ttsService } from '../services/tts/tts.service';
import { useAuthStore } from '../stores/auth';
import type { AudioMetadata } from '../services/tts/types';

export interface SpeakOptions {
  voice?: string;
  model?: 'tts-1' | 'tts-1-hd';
  language?: string;
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

/**
 * Simple speak composable with automatic audio generation and caching
 * 
 * Usage:
 * const { speak } = useSpeak();
 * speak('Hello world');
 */
export function useSpeak() {
  const { speak: browserSpeak, stop: browserStop, pause: browserPause, resume: browserResume } = useTextToSpeech();
  const authStore = useAuthStore();
  
  // Get user's language, convert from 'en-GB' format to 'en' for TTS
  const userLanguage = computed(() => {
    const lang = authStore.currentLanguage || 'en-GB';
    return lang.split('-')[0]; // Convert 'en-GB' to 'en'
  });
  
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const currentAudio = ref<HTMLAudioElement | null>(null);
  const currentMetadata = ref<AudioMetadata | null>(null);
  const audioCache = new Map<string, HTMLAudioElement>();

  const speak = async (text: string, options: SpeakOptions = {}) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // Stop any currently playing audio
      stop();

      // Use provided language or user's language
      const language = options.language || userLanguage.value;

      // Get TTS configuration
      const config = ttsService.getTTSConfig(text, language);
      
      // If browser provider or fallback is used and no OpenAI preference
      if (config.provider === 'browser' || config.fallbackUsed) {
        // Show warning if using fallback language
        if (config.fallbackUsed && config.originalLanguage) {
          console.warn(`Language ${config.originalLanguage} not supported, using ${config.language} instead`);
        }
        
        browserSpeak(text, { 
          rate: 1.1,
          volume: 1.0,
          pitch: 1.0 
        });
        return;
      }

      // Try to get OpenAI audio
      const response = await ttsService.getAudioForText({
        text,
        language,
        voice: options.voice,
        model: options.model
      });

      if (!response.success || !response.audioUrl) {
        // Fallback to browser TTS
        console.warn('Failed to get OpenAI audio, falling back to browser TTS:', response.error);
        browserSpeak(text, { 
          rate: 1.1,
          volume: 1.0,
          pitch: 1.0 
        });
        return;
      }

      // Store metadata
      currentMetadata.value = response.metadata || null;

      // Check cache first
      const cacheKey = `${hashText(text)}_${language}`;
      let audio = audioCache.get(cacheKey);

      if (!audio) {
        // Create new audio element
        audio = new Audio();
        audio.preload = 'auto';
        
        // Build full URL
        const workerUrl = import.meta.env.VITE_TTS_WORKER_URL || '';
        
        // If audioUrl is already a full URL, use it as is
        if (response.audioUrl.startsWith('http://') || response.audioUrl.startsWith('https://')) {
          audio.src = response.audioUrl;
        } else {
          // Ensure proper URL joining
          const baseUrl = workerUrl.endsWith('/') ? workerUrl.slice(0, -1) : workerUrl;
          const path = response.audioUrl.startsWith('/') ? response.audioUrl : '/' + response.audioUrl;
          audio.src = baseUrl + path;
        }
        
        console.log('[useSpeak] Audio URL:', audio.src);
        
        // Add to cache
        audioCache.set(cacheKey, audio);
        
        // Handle audio events
        audio.addEventListener('error', (e) => {
          console.error('Audio playback error:', e);
          error.value = 'Failed to play audio';
          
          // Fallback to browser TTS
          browserSpeak(text, { 
            rate: 1.1,
            volume: 1.0,
            pitch: 1.0 
          });
        });

        audio.addEventListener('loadeddata', () => {
          isLoading.value = false;
        });
      }

      // Store current audio reference
      currentAudio.value = audio;
      
      // Play audio
      try {
        await audio.play();
      } catch (playError) {
        console.error('Failed to play audio:', playError);
        
        // Fallback to browser TTS
        browserSpeak(text, { 
          rate: 1.1,
          volume: 1.0,
          pitch: 1.0 
        });
      }
    } catch (err) {
      console.error('TTS error:', err);
      error.value = err instanceof Error ? err.message : 'Unknown error';
      
      // Final fallback to browser TTS
      browserSpeak(text, { 
        rate: 1.1,
        volume: 1.0,
        pitch: 1.0 
      });
    } finally {
      isLoading.value = false;
    }
  };

  const stop = () => {
    // Stop browser TTS
    browserStop();
    
    // Stop audio element if playing
    if (currentAudio.value) {
      currentAudio.value.pause();
      currentAudio.value.currentTime = 0;
    }
  };

  const pause = () => {
    // Pause browser TTS
    browserPause();
    
    // Pause audio element if playing
    if (currentAudio.value) {
      currentAudio.value.pause();
    }
  };

  const resume = () => {
    // Resume browser TTS
    browserResume();
    
    // Resume audio element if paused
    if (currentAudio.value && currentAudio.value.paused) {
      currentAudio.value.play();
    }
  };

  const preloadAudio = async (
    texts: Array<{ text: string; language?: string }>
  ) => {
    if (texts.length === 0) {
      return;
    }

    try {
      const textsWithLanguage = texts.map(item => ({
        text: item.text,
        language: item.language || userLanguage.value
      }));
      
      await ttsService.preloadAudioForTexts(textsWithLanguage);
    } catch (err) {
      console.error('Failed to preload audio:', err);
    }
  };

  const clearCache = () => {
    audioCache.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    audioCache.clear();
  };

  // Cleanup on unmount
  onUnmounted(() => {
    stop();
    clearCache();
  });

  return {
    speak,
    stop,
    pause,
    resume,
    preloadAudio,
    clearCache,
    isLoading,
    error,
    currentMetadata
  };
}