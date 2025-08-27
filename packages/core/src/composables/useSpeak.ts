import { ref, onUnmounted, computed } from 'vue';
import { useTextToSpeech } from './useTextToSpeech';
import { ttsService } from '../services/tts/tts.service';
import { useAuthStore } from '../stores/auth';
import { useSpeechStore } from '../stores/speech';
import type { AudioMetadata } from '../services/tts/types';

export interface SpeakOptions {
  voice?: string;
  model?: 'tts-1' | 'tts-1-hd';
  language?: string;
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
  const speechStore = useSpeechStore();
  
  // Log to verify store is created
  console.log('[useSpeak] Speech store initialized:', {
    cacheSize: speechStore.cacheSize,
    cachedKeys: speechStore.cachedKeys
  });
  
  // Get user's language, convert from 'en-GB' format to 'en' for TTS
  const userLanguage = computed(() => {
    const lang = authStore.currentLanguage || 'en-GB';
    return lang.split('-')[0]; // Convert 'en-GB' to 'en'
  });
  
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const currentAudio = ref<HTMLAudioElement | null>(null);
  const currentMetadata = ref<AudioMetadata | null>(null);
  
  const isPlaying = computed(() => {
    return currentAudio.value ? !currentAudio.value.paused && !currentAudio.value.ended : false;
  });

  const speak = async (text: string, options: SpeakOptions = {}) => {
    const startTime = Date.now();
    console.log('[useSpeak] Starting speak for text:', text.substring(0, 50) + '...');
    
    try {
      isLoading.value = true;
      error.value = null;
      
      // Stop any currently playing audio
      stop();

      // Use provided language or user's language
      const language = options.language || userLanguage.value;

      // Get TTS configuration
      const configStart = Date.now();
      const config = ttsService.getTTSConfig(text, language);
      console.log(`[useSpeak] getTTSConfig took ${Date.now() - configStart}ms`);
      
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

      // Use speech store to get or create audio
      // This handles all caching, preloading, and audio element creation
      const { audio, metadata } = await speechStore.getOrCreateAudio(text, language);
      
      // Store metadata
      currentMetadata.value = metadata || null;
      
      if (!audio) {
        console.warn('Failed to get audio from speech store, falling back to browser TTS');
        browserSpeak(text, { 
          rate: 1.1,
          volume: 1.0,
          pitch: 1.0 
        });
        return;
      }
      
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
      }, { once: true });

      audio.addEventListener('loadeddata', () => {
        isLoading.value = false;
      }, { once: true });

      // Store current audio reference
      currentAudio.value = audio;
      
      // Play audio
      try {
        const playStart = Date.now();
        await audio.play();
        console.log(`[useSpeak] Audio play started in ${Date.now() - playStart}ms, total time: ${Date.now() - startTime}ms`);
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

    console.log(`[useSpeak] preloadAudio called with ${texts.length} texts`);
    
    const textsWithLanguage = texts.map(item => ({
      text: item.text,
      language: item.language || userLanguage.value
    }));
    
    // Use speech store to preload
    await speechStore.preloadMultiple(textsWithLanguage);
    
    console.log('[useSpeak] preloadAudio completed');
  };

  const clearCache = () => {
    speechStore.clearCache();
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
    currentMetadata,
    currentAudio,
    isPlaying
  };
}