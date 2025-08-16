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
  private browserVoicesCache: SpeechSynthesisVoice[] = [];
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    // Use the deployed worker URL as fallback
    this.workerUrl = import.meta.env.VITE_TTS_WORKER_URL || 'https://tts-generation.silvandiepen.workers.dev';
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
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
   * Check if audio already exists in the database
   */
  async checkExistingAudio(textHash: string): Promise<AudioMetadata | null> {
    try {
      const params = new URLSearchParams();
      params.append('text_hash', `eq.${textHash}`);
      
      const response = await this.apiRequest<any[]>(`tts_audio?${params.toString()}`);
      const data = response[0];

      if (!data) {
        return null;
      }

      return {
        url: data.audio_url,
        provider: data.provider as 'openai' | 'browser',
        language: data.language,
        voice: data.voice,
        model: data.model,
        generatedAt: data.created_at,
        size: data.file_size_bytes,
        duration: data.duration_seconds
      };
    } catch (error) {
      console.error('Error checking existing audio:', error);
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
        return {
          success: true,
          audioUrl: existingAudio.url,
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