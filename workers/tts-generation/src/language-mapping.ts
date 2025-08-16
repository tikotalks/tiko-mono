/**
 * Language mapping for OpenAI TTS API
 * Maps ISO 639-1 language codes to OpenAI language names
 */

export const ISO_TO_OPENAI_LANGUAGE: Record<string, string> = {
  // Major languages
  'en': 'English',
  'es': 'Spanish', 
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'pl': 'Polish',
  'tr': 'Turkish',
  'ru': 'Russian',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'no': 'Norwegian',
  'da': 'Danish',
  'fi': 'Finnish',
  'cs': 'Czech',
  'el': 'Greek',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  
  // Additional languages from Whisper
  'af': 'Afrikaans',
  'am': 'Amharic',
  'az': 'Azerbaijani',
  'ba': 'Bashkir',
  'be': 'Belarusian',
  'bg': 'Bulgarian',
  'bn': 'Bengali',
  'bo': 'Tibetan',
  'br': 'Breton',
  'bs': 'Bosnian',
  'ca': 'Catalan',
  'cy': 'Welsh',
  'et': 'Estonian',
  'eu': 'Basque',
  'fa': 'Persian',
  'fo': 'Faroese',
  'gl': 'Galician',
  'gu': 'Gujarati',
  'ha': 'Hausa',
  'haw': 'Hawaiian',
  'he': 'Hebrew',
  'hr': 'Croatian',
  'ht': 'Haitian',
  'hu': 'Hungarian',
  'hy': 'Armenian',
  'id': 'Indonesian',
  'is': 'Icelandic',
  'jw': 'Javanese',
  'ka': 'Georgian',
  'kk': 'Kazakh',
  'km': 'Khmer',
  'kn': 'Kannada',
  'lb': 'Luxembourgish',
  'ln': 'Lingala',
  'lo': 'Lao',
  'lt': 'Lithuanian',
  'lv': 'Latvian',
  'mg': 'Malagasy',
  'mi': 'Maori',
  'mk': 'Macedonian',
  'ml': 'Malayalam',
  'mn': 'Mongolian',
  'mr': 'Marathi',
  'ms': 'Malay',
  'mt': 'Maltese',
  'my': 'Myanmar',
  'ne': 'Nepali',
  'nn': 'Norwegian',
  'oc': 'Occitan',
  'pa': 'Punjabi',
  'ps': 'Pashto',
  'ro': 'Romanian',
  'sa': 'Sanskrit',
  'sd': 'Sindhi',
  'si': 'Sinhala',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'sn': 'Shona',
  'so': 'Somali',
  'sq': 'Albanian',
  'sr': 'Serbian',
  'su': 'Sundanese',
  'sw': 'Swahili',
  'ta': 'Tamil',
  'te': 'Telugu',
  'tg': 'Tajik',
  'th': 'Thai',
  'tk': 'Turkmen',
  'tl': 'Tagalog',
  'tt': 'Tatar',
  'uk': 'Ukrainian',
  'ur': 'Urdu',
  'uz': 'Uzbek',
  'vi': 'Vietnamese',
  'yi': 'Yiddish',
  'yo': 'Yoruba'
};

/**
 * Convert ISO language code to OpenAI language name
 * @param isoCode - ISO 639-1 language code (e.g., 'nl', 'en')
 * @returns OpenAI language name (e.g., 'Dutch', 'English') or the original code if not found
 */
export function getOpenAILanguage(isoCode: string): string {
  // Extract base language code if it's a locale (e.g., 'en-GB' -> 'en')
  const baseCode = isoCode.split('-')[0].toLowerCase();
  
  return ISO_TO_OPENAI_LANGUAGE[baseCode] || baseCode;
}

/**
 * Check if a language is supported by OpenAI TTS
 * @param isoCode - ISO 639-1 language code
 * @returns true if the language is supported
 */
export function isLanguageSupportedByTTS(isoCode: string): boolean {
  const baseCode = isoCode.split('-')[0].toLowerCase();
  return baseCode in ISO_TO_OPENAI_LANGUAGE;
}