// Azure TTS supported languages and voices
// This is a subset - full list at https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts

export const AZURE_SUPPORTED_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 
  'zh', 'ja', 'ko', 'ar', 'tr', 'sv', 'da', 'nb', 'fi',
  'cs', 'el', 'he', 'hi', 'hu', 'id', 'ro', 'sk', 'th', 
  'uk', 'vi', 'bg', 'ca', 'hr', 'et', 'ga', 'lv', 'lt',
  'mt', 'sl', 'cy', 'eu', 'gl', 'is', 'kn', 'ml', 'mr',
  'ta', 'te', 'af', 'sq', 'am', 'hy', 'az', 'bn', 'bs',
  'my', 'zh-HK', 'zh-TW', 'hr', 'en-AU', 'en-CA', 'en-GB',
  'en-HK', 'en-IE', 'en-IN', 'en-NZ', 'en-PH', 'en-SG',
  'en-ZA', 'et', 'fil', 'fr-CA', 'fr-CH', 'gl', 'gu', 'is',
  'jv', 'km', 'lo', 'mk', 'ms', 'ne', 'ps', 'si', 'su',
  'sw', 'ta', 'te', 'ur', 'uz', 'zu'
];

export interface AzureVoiceOption {
  name: string;
  displayName: string;
  locale: string;
  gender: 'Male' | 'Female';
}

// Simplified voice mapping for common languages
export const AZURE_VOICE_MAP: Record<string, AzureVoiceOption[]> = {
  'en': [
    { name: 'en-US-JennyNeural', displayName: 'Jenny (US)', locale: 'en-US', gender: 'Female' },
    { name: 'en-US-GuyNeural', displayName: 'Guy (US)', locale: 'en-US', gender: 'Male' },
    { name: 'en-GB-SoniaNeural', displayName: 'Sonia (UK)', locale: 'en-GB', gender: 'Female' },
    { name: 'en-GB-RyanNeural', displayName: 'Ryan (UK)', locale: 'en-GB', gender: 'Male' },
  ],
  'es': [
    { name: 'es-ES-ElviraNeural', displayName: 'Elvira (Spain)', locale: 'es-ES', gender: 'Female' },
    { name: 'es-ES-AlvaroNeural', displayName: 'Alvaro (Spain)', locale: 'es-ES', gender: 'Male' },
    { name: 'es-MX-DaliaNeural', displayName: 'Dalia (Mexico)', locale: 'es-MX', gender: 'Female' },
    { name: 'es-MX-JorgeNeural', displayName: 'Jorge (Mexico)', locale: 'es-MX', gender: 'Male' },
  ],
  'fr': [
    { name: 'fr-FR-DeniseNeural', displayName: 'Denise', locale: 'fr-FR', gender: 'Female' },
    { name: 'fr-FR-HenriNeural', displayName: 'Henri', locale: 'fr-FR', gender: 'Male' },
  ],
  'de': [
    { name: 'de-DE-KatjaNeural', displayName: 'Katja', locale: 'de-DE', gender: 'Female' },
    { name: 'de-DE-ConradNeural', displayName: 'Conrad', locale: 'de-DE', gender: 'Male' },
  ],
  'nl': [
    { name: 'nl-NL-ColetteNeural', displayName: 'Colette', locale: 'nl-NL', gender: 'Female' },
    { name: 'nl-NL-FennaNeural', displayName: 'Fenna', locale: 'nl-NL', gender: 'Female' },
    { name: 'nl-NL-MaartenNeural', displayName: 'Maarten', locale: 'nl-NL', gender: 'Male' },
  ],
  'mt': [
    { name: 'mt-MT-GraceNeural', displayName: 'Grace', locale: 'mt-MT', gender: 'Female' },
    { name: 'mt-MT-JosephNeural', displayName: 'Joseph', locale: 'mt-MT', gender: 'Male' },
  ],
  'ca': [
    { name: 'ca-ES-JoanaNeural', displayName: 'Joana', locale: 'ca-ES', gender: 'Female' },
    { name: 'ca-ES-EnricNeural', displayName: 'Enric', locale: 'ca-ES', gender: 'Male' },
  ],
  'cy': [
    { name: 'cy-GB-NiaNeural', displayName: 'Nia', locale: 'cy-GB', gender: 'Female' },
    { name: 'cy-GB-AledNeural', displayName: 'Aled', locale: 'cy-GB', gender: 'Male' },
  ],
  'ga': [
    { name: 'ga-IE-OrlaNeural', displayName: 'Orla', locale: 'ga-IE', gender: 'Female' },
    { name: 'ga-IE-ColmNeural', displayName: 'Colm', locale: 'ga-IE', gender: 'Male' },
  ],
  'eu': [
    { name: 'eu-ES-AinhoaNeural', displayName: 'Ainhoa', locale: 'eu-ES', gender: 'Female' },
    { name: 'eu-ES-AnderNeural', displayName: 'Ander', locale: 'eu-ES', gender: 'Male' },
  ],
};

// Default voices for languages not in the map
export function getDefaultAzureVoice(language: string): string {
  const voices = AZURE_VOICE_MAP[language];
  if (voices && voices.length > 0) {
    return voices[0].name;
  }
  
  // Try to construct a default voice name
  const locale = language.includes('-') ? language : `${language}-${language.toUpperCase()}`;
  return `${locale}-Neural`; // This might not always work, but Azure will provide an error if invalid
}

export function isAzureLanguageSupported(isoCode: string): boolean {
  const baseCode = isoCode.split('-')[0].toLowerCase();
  return AZURE_SUPPORTED_LANGUAGES.includes(baseCode) || AZURE_SUPPORTED_LANGUAGES.includes(isoCode.toLowerCase());
}