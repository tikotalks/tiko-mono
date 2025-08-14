export interface TTSConfig {
  provider: 'openai' | 'browser';
  language: string;
  voice?: string;
  model?: 'tts-1' | 'tts-1-hd';
  originalLanguage?: string;
  fallbackUsed?: boolean;
}

export interface AudioMetadata {
  url?: string;
  provider: 'openai' | 'browser';
  language: string;
  voice?: string;
  model?: string;
  generatedAt?: string;
  originalLanguage?: string;
  fallbackUsed?: boolean;
  duration?: number;
  size?: number;
}

export interface TTSRequest {
  text: string;
  language: string;
  voice?: string;
  model?: 'tts-1' | 'tts-1-hd';
}

export interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  metadata?: AudioMetadata;
  error?: string;
  cached?: boolean;
}

export const OPENAI_SUPPORTED_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 
  'zh', 'ja', 'ko', 'ar', 'tr', 'sv', 'da', 'no', 'fi',
  'el', 'he', 'hi', 'hu', 'id', 'ms', 'ro', 'th', 'vi'
];

export const LANGUAGE_FALLBACKS: Record<string, string> = {
  'mt': 'en',    // Maltese → English
  'ca': 'es',    // Catalan → Spanish
  'cy': 'en',    // Welsh → English
  'ga': 'en',    // Irish → English
  'eu': 'es',    // Basque → Spanish
  'lb': 'de',    // Luxembourgish → German
  'is': 'en',    // Icelandic → English
  'sq': 'en',    // Albanian → English
  'mk': 'en',    // Macedonian → English
  'et': 'en',    // Estonian → English
  'lv': 'en',    // Latvian → English
  'lt': 'en',    // Lithuanian → English
  'sl': 'en',    // Slovenian → English
  'sk': 'en',    // Slovak → English
  'bg': 'en',    // Bulgarian → English
  'uk': 'ru',    // Ukrainian → Russian
  'be': 'ru',    // Belarusian → Russian
  'kk': 'ru',    // Kazakh → Russian
  'uz': 'ru',    // Uzbek → Russian
  'tl': 'en',    // Filipino → English
  'sw': 'en',    // Swahili → English
  'am': 'en',    // Amharic → English
  'km': 'en',    // Khmer → English
  'lo': 'en',    // Lao → English
  'my': 'en',    // Myanmar → English
  'ne': 'hi',    // Nepali → Hindi
  'si': 'en',    // Sinhala → English
  'ur': 'hi',    // Urdu → Hindi
  'bn': 'hi',    // Bengali → Hindi
  'gu': 'hi',    // Gujarati → Hindi
  'kn': 'en',    // Kannada → English
  'ml': 'en',    // Malayalam → English
  'mr': 'hi',    // Marathi → Hindi
  'ta': 'en',    // Tamil → English
  'te': 'en',    // Telugu → English
};

export const OPENAI_VOICES = [
  'alloy',
  'echo',
  'fable',
  'onyx',
  'nova',
  'shimmer'
] as const;

export type OpenAIVoice = typeof OPENAI_VOICES[number];