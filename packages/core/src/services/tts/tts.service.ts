import type {
  TTSConfig,
  TTSRequest,
  TTSResponse,
  AudioMetadata,
  OpenAIVoice
} from './types';
import {
  OPENAI_SUPPORTED_LANGUAGES,
  LANGUAGE_FALLBACKS,
  OPENAI_VOICES
} from './types';

class TTSService {
  private workerUrl: string;
  private cdnUrl: string;
  private browserVoicesCache: SpeechSynthesisVoice[] = [];
  private supabaseUrl: string;
  private supabaseKey: string;
  private audioMetadataCache: Map<string, { metadata: AudioMetadata | null; timestamp: number }>;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  constructor() {
    // Use the deployed worker URL as fallback
    this.workerUrl = import.meta.env.VITE_TTS_WORKER_URL || 'https://tts.tikoapi.org';
    this.cdnUrl = import.meta.env.VITE_TTS_CDN_URL || 'https://tts.tikocdn.org';
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseKey = import.meta.env?.VITE_SUPABASE_SECRET || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || '';
    this.audioMetadataCache = new Map();
    this.loadBrowserVoices();

    if (!import.meta.env.VITE_TTS_WORKER_URL) {
      console.warn('[TTSService] VITE_TTS_WORKER_URL not set, using default worker URL');
    }
  }

  private loadBrowserVoices() {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        this.browserVoicesCache = window.speechSynthesis.getVoices();
      };

      loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  private getAuthToken(): string | null {
    const sessionData = localStorage.getItem('tiko_auth_session');
    if (!sessionData) return null;

    try {
      const session = JSON.parse(sessionData);
      return session.access_token;
    } catch {
      return null;
    }
  }

  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAuthToken();

    const response = await fetch(`${this.supabaseUrl}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.supabaseKey,
        'Authorization': token ? `Bearer ${token}` : '',
        'Prefer': 'return=representation',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`API request failed: ${JSON.stringify(errorData)}`);
    }

    return response.json();
  }

  /**
   * Get the appropriate TTS configuration for the given text and language
   */
  getTTSConfig(text: string, language: string): TTSConfig {
    // Check if OpenAI supports this language
    if (OPENAI_SUPPORTED_LANGUAGES.includes(language)) {
      return {
        provider: 'openai',
        language,
        model: 'tts-1', // Default to faster model
        voice: 'nova' // Default voice
      };
    }

    // Check if browser supports this language
    const browserSupportsLanguage = this.browserVoicesCache.some(
      voice => voice.lang.toLowerCase().startsWith(language.toLowerCase())
    );

    if (browserSupportsLanguage) {
      return {
        provider: 'browser',
        language
      };
    }

    // Use fallback language with OpenAI
    const fallbackLanguage = LANGUAGE_FALLBACKS[language] || 'en';
    return {
      provider: 'openai',
      language: fallbackLanguage,
      originalLanguage: language,
      fallbackUsed: true,
      model: 'tts-1',
      voice: 'nova'
    };
  }

  /**
   * Generate a unique text hash for the audio
   */
  private generateTextHash(text: string, language: string, voice: string, model: string): string {
    const elements = [text, language, voice, model];
    const str = elements.join('|');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Convert a relative URL to CDN URL
   */
  private convertToCdnUrl(relativeUrl: string): string {
    // Extract the key from URLs like "/audio?key=audio%2F6asym0.mp3"
    const match = relativeUrl.match(/key=([^&]+)/);
    if (match) {
      const key = decodeURIComponent(match[1]);
      return `${this.cdnUrl}/${key}`;
    }
    // If it's already a full URL, return as is
    if (relativeUrl.startsWith('http')) {
      return relativeUrl;
    }
    // Otherwise, append to CDN URL
    return `${this.cdnUrl}${relativeUrl}`;
  }

  /**
   * Check if audio already exists in the database
   */
  async checkExistingAudio(textHash: string): Promise<AudioMetadata | null> {
    // Check cache first
    const cached = this.audioMetadataCache.get(textHash);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('[TTSService] Audio metadata found in cache for hash:', textHash);
      return cached.metadata;
    }

    try {
      const params = new URLSearchParams();
      params.append('text_hash', `eq.${textHash}`);

      console.log('[TTSService] Checking database for audio hash:', textHash);
      const response = await this.apiRequest<any[]>(`tts_audio?${params.toString()}`);
      const data = response[0];

      const metadata = data ? {
        url: data.audio_url,
        provider: data.provider as 'openai' | 'browser',
        language: data.language,
        voice: data.voice,
        model: data.model,
        generatedAt: data.created_at,
        size: data.file_size_bytes,
        duration: data.duration_seconds
      } : null;

      // Cache the result (even if null)
      this.audioMetadataCache.set(textHash, {
        metadata,
        timestamp: Date.now()
      });

      return metadata;
    } catch (error) {
      console.error('Error checking existing audio:', error);
      // Cache the null result to avoid repeated failing requests
      this.audioMetadataCache.set(textHash, {
        metadata: null,
        timestamp: Date.now()
      });
      return null;
    }
  }

  /**
   * Generate audio using OpenAI TTS via worker
   */
  async generateOpenAIAudio(request: TTSRequest, config: TTSConfig): Promise<TTSResponse> {
    if (!this.workerUrl) {
      return {
        success: false,
        error: 'TTS worker URL not configured'
      };
    }

    try {
      const response = await fetch(`${this.workerUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: request.text,
          voice: config.voice || 'nova',
          model: config.model || 'tts-1',
          language: config.language
        })
      });

      if (!response.ok) {
        throw new Error(`Worker responded with ${response.status}`);
      }

      const data = await response.json();

      // Convert the worker URL to CDN URL if successful
      if (data.success && data.audioUrl) {
        data.audioUrl = this.convertToCdnUrl(data.audioUrl);
      }

      return data;
    } catch (error) {
      console.error('Error generating OpenAI audio:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate audio'
      };
    }
  }

  /**
   * Main method to get audio for text
   */
  async getAudioForText(request: TTSRequest): Promise<TTSResponse> {
    try {
      // Get TTS configuration
      const config = this.getTTSConfig(request.text, request.language);

      // Generate text hash for deduplication
      const textHash = this.generateTextHash(request.text, config.language, config.voice || 'nova', config.model || 'tts-1');

      // Check if audio already exists
      const existingAudio = await this.checkExistingAudio(textHash);
      if (existingAudio) {
        // Convert the relative URL to CDN URL
        const audioUrl = existingAudio.url ? this.convertToCdnUrl(existingAudio.url) : undefined;
        return {
          success: true,
          audioUrl,
          metadata: existingAudio,
          cached: true
        };
      }

      // If OpenAI provider, generate audio
      if (config.provider === 'openai') {
        const result = await this.generateOpenAIAudio(request, config);
        return result;
      }

      // For browser provider, return config only
      return {
        success: true,
        metadata: {
          provider: 'browser',
          language: config.language,
          originalLanguage: config.originalLanguage,
          fallbackUsed: config.fallbackUsed
        },
        cached: false
      };
    } catch (error) {
      console.error('Error in getAudioForText:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Preload audio for multiple texts (batch operation)
   */
  async preloadAudioForTexts(texts: Array<{ text: string; language: string }>): Promise<void> {
    console.log(`[TTSService] Preloading audio for ${texts.length} texts`);
    
    const requests = texts.map(item => ({
      text: item.text,
      language: item.language
    }));

    // Process in parallel with concurrency limit
    const concurrency = 3;
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      await Promise.all(batch.map(req => this.getAudioForText(req)));
    }
    
    console.log(`[TTSService] Preloading complete. Cache size: ${this.audioMetadataCache.size}`);
  }

  /**
   * Clear the audio metadata cache
   */
  clearCache(): void {
    console.log('[TTSService] Clearing audio metadata cache');
    this.audioMetadataCache.clear();
  }

  /**
   * Get available voices for a language
   */
  getAvailableVoices(language: string): Array<{ value: string; label: string; provider: 'openai' | 'browser' }> {
    const voices: Array<{ value: string; label: string; provider: 'openai' | 'browser' }> = [];

    // Add OpenAI voices if language is supported
    if (OPENAI_SUPPORTED_LANGUAGES.includes(language)) {
      OPENAI_VOICES.forEach(voice => {
        voices.push({
          value: voice,
          label: `OpenAI ${voice.charAt(0).toUpperCase() + voice.slice(1)}`,
          provider: 'openai'
        });
      });
    }

    // Add browser voices
    const browserVoices = this.browserVoicesCache.filter(
      voice => voice.lang.toLowerCase().startsWith(language.toLowerCase())
    );

    browserVoices.forEach(voice => {
      voices.push({
        value: voice.name,
        label: `${voice.name} (Browser)`,
        provider: 'browser'
      });
    });

    return voices;
  }
}

export const ttsService = new TTSService();
