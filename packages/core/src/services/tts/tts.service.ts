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
import {
  AZURE_SUPPORTED_LANGUAGES,
  AZURE_VOICE_MAP,
  isAzureLanguageSupported,
  getDefaultAzureVoice
} from './azure-languages';

class TTSService {
  private workerUrl: string;
  private azureWorkerUrl: string;
  private cdnUrl: string;
  private browserVoicesCache: SpeechSynthesisVoice[] = [];
  private supabaseUrl: string;
  private supabaseKey: string;
  private audioMetadataCache: Map<string, { metadata: AudioMetadata | null; timestamp: number }>;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  private preferredProvider: 'openai' | 'azure' | 'auto' = 'openai';

  constructor() {
    // Use the deployed worker URLs as fallback
    this.workerUrl = import.meta.env.VITE_TTS_WORKER_URL || 'https://tts.tikoapi.org';
    this.azureWorkerUrl = import.meta.env.VITE_AZURE_TTS_WORKER_URL || 'https://azure-tts.tikoapi.org';
    this.cdnUrl = import.meta.env.VITE_TTS_CDN_URL || 'https://tts.tikocdn.org';
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseKey = import.meta.env?.VITE_SUPABASE_SECRET || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || '';
    this.audioMetadataCache = new Map();
    this.loadBrowserVoices();

    if (!import.meta.env.VITE_TTS_WORKER_URL) {
      console.warn('[TTSService] VITE_TTS_WORKER_URL not set, using default worker URL');
    }
    if (!import.meta.env.VITE_AZURE_TTS_WORKER_URL) {
      console.warn('[TTSService] VITE_AZURE_TTS_WORKER_URL not set, using default Azure worker URL');
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
   * Set the preferred TTS provider
   */
  setPreferredProvider(provider: 'openai' | 'azure' | 'auto') {
    this.preferredProvider = provider;
    console.log(`[TTSService] Preferred provider set to: ${provider}`);
  }

  /**
   * Get the appropriate TTS configuration for the given text and language
   */
  getTTSConfig(text: string, language: string, requestedProvider?: 'openai' | 'azure' | 'browser'): TTSConfig {
    // If specific provider requested, try to use it
    const provider = requestedProvider || this.preferredProvider;
    
    // Try the preferred provider first (currently 'openai')
    if (provider === 'openai' || provider === 'auto') {
      // Check if OpenAI supports this language
      if (OPENAI_SUPPORTED_LANGUAGES.includes(language)) {
        return {
          provider: 'openai',
          language,
          model: 'tts-1', // Default to faster model
          voice: 'nova' // Default voice
        };
      }
    }
    
    if (provider === 'azure') {
      // Check if Azure supports this language
      if (isAzureLanguageSupported(language)) {
        const voices = AZURE_VOICE_MAP[language] || [];
        return {
          provider: 'azure',
          language,
          voice: voices.length > 0 ? voices[0].name : getDefaultAzureVoice(language),
          speed: 1.0,
          pitch: 0
        };
      }
    }

    // Check if browser supports this language as fallback
    const browserSupportsLanguage = this.browserVoicesCache.some(
      voice => voice.lang.toLowerCase().startsWith(language.toLowerCase())
    );

    if (browserSupportsLanguage) {
      return {
        provider: 'browser',
        language
      };
    }

    // Use fallback language with preferred provider
    const fallbackLanguage = LANGUAGE_FALLBACKS[language] || 'en';
    
    // Try preferred provider with fallback language
    if (provider === 'openai' || provider === 'auto') {
      if (OPENAI_SUPPORTED_LANGUAGES.includes(fallbackLanguage)) {
        return {
          provider: 'openai',
          language: fallbackLanguage,
          originalLanguage: language,
          fallbackUsed: true,
          model: 'tts-1',
          voice: 'nova'
        };
      }
    }
    
    if (provider === 'azure') {
      if (isAzureLanguageSupported(fallbackLanguage)) {
        const voices = AZURE_VOICE_MAP[fallbackLanguage] || [];
        return {
          provider: 'azure',
          language: fallbackLanguage,
          originalLanguage: language,
          fallbackUsed: true,
          voice: voices.length > 0 ? voices[0].name : getDefaultAzureVoice(fallbackLanguage),
          speed: 1.0,
          pitch: 0
        };
      }
    }
    
    // Final fallback to browser with fallback language
    return {
      provider: 'browser',
      language: fallbackLanguage,
      originalLanguage: language,
      fallbackUsed: true
    };
  }

  /**
   * Generate a unique text hash for the audio
   */
  private generateTextHash(text: string, language: string, voice: string, model: string, provider: string = 'openai', speed: number = 1.0, pitch: number = 0): string {
    const elements = [text, language, voice, model, provider, speed.toString(), pitch.toString()];
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
   * Generate audio using Azure TTS via worker
   */
  async generateAzureAudio(request: TTSRequest, config: TTSConfig): Promise<TTSResponse> {
    if (!this.azureWorkerUrl) {
      return {
        success: false,
        error: 'Azure TTS worker URL not configured'
      };
    }

    try {
      const response = await fetch(`${this.azureWorkerUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: request.text,
          voice: config.voice || getDefaultAzureVoice(config.language),
          language: config.language,
          speed: config.speed || 1.0,
          pitch: config.pitch || 0
        })
      });

      if (!response.ok) {
        throw new Error(`Azure worker responded with ${response.status}`);
      }

      const data = await response.json();

      // Convert the worker URL to CDN URL if successful
      if (data.success && data.audioUrl) {
        data.audioUrl = this.convertToCdnUrl(data.audioUrl);
        // Add metadata if provided
        if (data.metadata) {
          data.metadata.url = data.audioUrl;
        }
      }

      return data;
    } catch (error) {
      console.error('Error generating Azure audio:', error);
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
      const config = this.getTTSConfig(request.text, request.language, request.provider);

      // Generate text hash for deduplication
      const textHash = this.generateTextHash(
        request.text, 
        config.language, 
        config.voice || (config.provider === 'azure' ? getDefaultAzureVoice(config.language) : 'nova'), 
        config.model || 'tts-1',
        config.provider,
        config.speed || request.speed || 1.0,
        config.pitch || request.pitch || 0
      );

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

      // Generate audio based on provider
      if (config.provider === 'openai') {
        const result = await this.generateOpenAIAudio(request, config);
        return result;
      } else if (config.provider === 'azure') {
        const result = await this.generateAzureAudio(request, config);
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
  getAvailableVoices(language: string): Array<{ value: string; label: string; provider: 'openai' | 'azure' | 'browser' }> {
    const voices: Array<{ value: string; label: string; provider: 'openai' | 'azure' | 'browser' }> = [];

    // Add Azure voices if language is supported
    if (isAzureLanguageSupported(language)) {
      const azureVoices = AZURE_VOICE_MAP[language] || [];
      azureVoices.forEach(voice => {
        voices.push({
          value: voice.name,
          label: `Azure ${voice.displayName} (${voice.gender})`,
          provider: 'azure'
        });
      });
    }

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

  /**
   * Get Azure languages and voices information
   */
  async getAzureLanguagesAndVoices(): Promise<{ languages: any[]; voices: any[] } | null> {
    if (!this.azureWorkerUrl) {
      console.warn('Azure TTS worker URL not configured');
      return null;
    }

    try {
      // Get languages
      const langResponse = await fetch(`${this.azureWorkerUrl}/languages`);
      const langData = await langResponse.json();

      // Get all voices
      const voiceResponse = await fetch(`${this.azureWorkerUrl}/voices`);
      const voiceData = await voiceResponse.json();

      if (langData.success && voiceData.success) {
        return {
          languages: langData.languages,
          voices: voiceData.voices
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching Azure languages and voices:', error);
      return null;
    }
  }
}

export const ttsService = new TTSService();
