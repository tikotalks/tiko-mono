export interface AzureVoice {
  name: string;
  displayName: string;
  localName: string;
  locale: string;
  gender: 'Male' | 'Female';
  voiceType: 'Standard' | 'Neural';
}

export interface AzureLanguage {
  locale: string;
  displayName: string;
  localName: string;
  voices: AzureVoice[];
}

// This is a subset of Azure's supported languages and voices
// Full list: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts
export const AZURE_LANGUAGES: AzureLanguage[] = [
  // English variants
  {
    locale: 'en-US',
    displayName: 'English (United States)',
    localName: 'English (United States)',
    voices: [
      { name: 'en-US-JennyNeural', displayName: 'Jenny', localName: 'Jenny', locale: 'en-US', gender: 'Female', voiceType: 'Neural' },
      { name: 'en-US-GuyNeural', displayName: 'Guy', localName: 'Guy', locale: 'en-US', gender: 'Male', voiceType: 'Neural' },
      { name: 'en-US-AriaNeural', displayName: 'Aria', localName: 'Aria', locale: 'en-US', gender: 'Female', voiceType: 'Neural' },
      { name: 'en-US-DavisNeural', displayName: 'Davis', localName: 'Davis', locale: 'en-US', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  {
    locale: 'en-GB',
    displayName: 'English (United Kingdom)',
    localName: 'English (United Kingdom)',
    voices: [
      { name: 'en-GB-SoniaNeural', displayName: 'Sonia', localName: 'Sonia', locale: 'en-GB', gender: 'Female', voiceType: 'Neural' },
      { name: 'en-GB-RyanNeural', displayName: 'Ryan', localName: 'Ryan', locale: 'en-GB', gender: 'Male', voiceType: 'Neural' },
      { name: 'en-GB-LibbyNeural', displayName: 'Libby', localName: 'Libby', locale: 'en-GB', gender: 'Female', voiceType: 'Neural' },
    ]
  },
  // Spanish variants
  {
    locale: 'es-ES',
    displayName: 'Spanish (Spain)',
    localName: 'Español (España)',
    voices: [
      { name: 'es-ES-ElviraNeural', displayName: 'Elvira', localName: 'Elvira', locale: 'es-ES', gender: 'Female', voiceType: 'Neural' },
      { name: 'es-ES-AlvaroNeural', displayName: 'Alvaro', localName: 'Álvaro', locale: 'es-ES', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  {
    locale: 'es-MX',
    displayName: 'Spanish (Mexico)',
    localName: 'Español (México)',
    voices: [
      { name: 'es-MX-DaliaNeural', displayName: 'Dalia', localName: 'Dalia', locale: 'es-MX', gender: 'Female', voiceType: 'Neural' },
      { name: 'es-MX-JorgeNeural', displayName: 'Jorge', localName: 'Jorge', locale: 'es-MX', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // French
  {
    locale: 'fr-FR',
    displayName: 'French (France)',
    localName: 'Français (France)',
    voices: [
      { name: 'fr-FR-DeniseNeural', displayName: 'Denise', localName: 'Denise', locale: 'fr-FR', gender: 'Female', voiceType: 'Neural' },
      { name: 'fr-FR-HenriNeural', displayName: 'Henri', localName: 'Henri', locale: 'fr-FR', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // German
  {
    locale: 'de-DE',
    displayName: 'German (Germany)',
    localName: 'Deutsch (Deutschland)',
    voices: [
      { name: 'de-DE-KatjaNeural', displayName: 'Katja', localName: 'Katja', locale: 'de-DE', gender: 'Female', voiceType: 'Neural' },
      { name: 'de-DE-ConradNeural', displayName: 'Conrad', localName: 'Conrad', locale: 'de-DE', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Italian
  {
    locale: 'it-IT',
    displayName: 'Italian (Italy)',
    localName: 'Italiano (Italia)',
    voices: [
      { name: 'it-IT-ElsaNeural', displayName: 'Elsa', localName: 'Elsa', locale: 'it-IT', gender: 'Female', voiceType: 'Neural' },
      { name: 'it-IT-DiegoNeural', displayName: 'Diego', localName: 'Diego', locale: 'it-IT', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Portuguese
  {
    locale: 'pt-BR',
    displayName: 'Portuguese (Brazil)',
    localName: 'Português (Brasil)',
    voices: [
      { name: 'pt-BR-FranciscaNeural', displayName: 'Francisca', localName: 'Francisca', locale: 'pt-BR', gender: 'Female', voiceType: 'Neural' },
      { name: 'pt-BR-AntonioNeural', displayName: 'Antonio', localName: 'Antônio', locale: 'pt-BR', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  {
    locale: 'pt-PT',
    displayName: 'Portuguese (Portugal)',
    localName: 'Português (Portugal)',
    voices: [
      { name: 'pt-PT-RaquelNeural', displayName: 'Raquel', localName: 'Raquel', locale: 'pt-PT', gender: 'Female', voiceType: 'Neural' },
      { name: 'pt-PT-DuarteNeural', displayName: 'Duarte', localName: 'Duarte', locale: 'pt-PT', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Dutch
  {
    locale: 'nl-NL',
    displayName: 'Dutch (Netherlands)',
    localName: 'Nederlands (Nederland)',
    voices: [
      { name: 'nl-NL-ColetteNeural', displayName: 'Colette', localName: 'Colette', locale: 'nl-NL', gender: 'Female', voiceType: 'Neural' },
      { name: 'nl-NL-FennaNeural', displayName: 'Fenna', localName: 'Fenna', locale: 'nl-NL', gender: 'Female', voiceType: 'Neural' },
      { name: 'nl-NL-MaartenNeural', displayName: 'Maarten', localName: 'Maarten', locale: 'nl-NL', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  {
    locale: 'nl-BE',
    displayName: 'Dutch (Belgium)',
    localName: 'Nederlands (België)',
    voices: [
      { name: 'nl-BE-DenaNeural', displayName: 'Dena', localName: 'Dena', locale: 'nl-BE', gender: 'Female', voiceType: 'Neural' },
      { name: 'nl-BE-ArnaudNeural', displayName: 'Arnaud', localName: 'Arnaud', locale: 'nl-BE', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Polish
  {
    locale: 'pl-PL',
    displayName: 'Polish (Poland)',
    localName: 'Polski (Polska)',
    voices: [
      { name: 'pl-PL-ZofiaNeural', displayName: 'Zofia', localName: 'Zofia', locale: 'pl-PL', gender: 'Female', voiceType: 'Neural' },
      { name: 'pl-PL-MarekNeural', displayName: 'Marek', localName: 'Marek', locale: 'pl-PL', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Russian
  {
    locale: 'ru-RU',
    displayName: 'Russian (Russia)',
    localName: 'Русский (Россия)',
    voices: [
      { name: 'ru-RU-SvetlanaNeural', displayName: 'Svetlana', localName: 'Светлана', locale: 'ru-RU', gender: 'Female', voiceType: 'Neural' },
      { name: 'ru-RU-DmitryNeural', displayName: 'Dmitry', localName: 'Дмитрий', locale: 'ru-RU', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Chinese
  {
    locale: 'zh-CN',
    displayName: 'Chinese (Simplified, China)',
    localName: '中文（中国）',
    voices: [
      { name: 'zh-CN-XiaoxiaoNeural', displayName: 'Xiaoxiao', localName: '晓晓', locale: 'zh-CN', gender: 'Female', voiceType: 'Neural' },
      { name: 'zh-CN-YunxiNeural', displayName: 'Yunxi', localName: '云希', locale: 'zh-CN', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Japanese
  {
    locale: 'ja-JP',
    displayName: 'Japanese (Japan)',
    localName: '日本語（日本）',
    voices: [
      { name: 'ja-JP-NanamiNeural', displayName: 'Nanami', localName: '七海', locale: 'ja-JP', gender: 'Female', voiceType: 'Neural' },
      { name: 'ja-JP-KeitaNeural', displayName: 'Keita', localName: '圭太', locale: 'ja-JP', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Korean
  {
    locale: 'ko-KR',
    displayName: 'Korean (Korea)',
    localName: '한국어(대한민국)',
    voices: [
      { name: 'ko-KR-SunHiNeural', displayName: 'SunHi', localName: '선히', locale: 'ko-KR', gender: 'Female', voiceType: 'Neural' },
      { name: 'ko-KR-InJoonNeural', displayName: 'InJoon', localName: '인준', locale: 'ko-KR', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Arabic
  {
    locale: 'ar-SA',
    displayName: 'Arabic (Saudi Arabia)',
    localName: 'العربية (المملكة العربية السعودية)',
    voices: [
      { name: 'ar-SA-ZariyahNeural', displayName: 'Zariyah', localName: 'زارية', locale: 'ar-SA', gender: 'Female', voiceType: 'Neural' },
      { name: 'ar-SA-HamedNeural', displayName: 'Hamed', localName: 'حامد', locale: 'ar-SA', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Turkish
  {
    locale: 'tr-TR',
    displayName: 'Turkish (Turkey)',
    localName: 'Türkçe (Türkiye)',
    voices: [
      { name: 'tr-TR-EmelNeural', displayName: 'Emel', localName: 'Emel', locale: 'tr-TR', gender: 'Female', voiceType: 'Neural' },
      { name: 'tr-TR-AhmetNeural', displayName: 'Ahmet', localName: 'Ahmet', locale: 'tr-TR', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Swedish
  {
    locale: 'sv-SE',
    displayName: 'Swedish (Sweden)',
    localName: 'Svenska (Sverige)',
    voices: [
      { name: 'sv-SE-SofieNeural', displayName: 'Sofie', localName: 'Sofie', locale: 'sv-SE', gender: 'Female', voiceType: 'Neural' },
      { name: 'sv-SE-MattiasNeural', displayName: 'Mattias', localName: 'Mattias', locale: 'sv-SE', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Danish
  {
    locale: 'da-DK',
    displayName: 'Danish (Denmark)',
    localName: 'Dansk (Danmark)',
    voices: [
      { name: 'da-DK-ChristelNeural', displayName: 'Christel', localName: 'Christel', locale: 'da-DK', gender: 'Female', voiceType: 'Neural' },
      { name: 'da-DK-JeppeNeural', displayName: 'Jeppe', localName: 'Jeppe', locale: 'da-DK', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Norwegian
  {
    locale: 'nb-NO',
    displayName: 'Norwegian (Bokmål, Norway)',
    localName: 'Norsk bokmål (Norge)',
    voices: [
      { name: 'nb-NO-PernilleNeural', displayName: 'Pernille', localName: 'Pernille', locale: 'nb-NO', gender: 'Female', voiceType: 'Neural' },
      { name: 'nb-NO-FinnNeural', displayName: 'Finn', localName: 'Finn', locale: 'nb-NO', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Finnish
  {
    locale: 'fi-FI',
    displayName: 'Finnish (Finland)',
    localName: 'Suomi (Suomi)',
    voices: [
      { name: 'fi-FI-SelmaNeural', displayName: 'Selma', localName: 'Selma', locale: 'fi-FI', gender: 'Female', voiceType: 'Neural' },
      { name: 'fi-FI-HarriNeural', displayName: 'Harri', localName: 'Harri', locale: 'fi-FI', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Additional languages that OpenAI doesn't support well
  // Maltese
  {
    locale: 'mt-MT',
    displayName: 'Maltese (Malta)',
    localName: 'Malti (Malta)',
    voices: [
      { name: 'mt-MT-GraceNeural', displayName: 'Grace', localName: 'Grace', locale: 'mt-MT', gender: 'Female', voiceType: 'Neural' },
      { name: 'mt-MT-JosephNeural', displayName: 'Joseph', localName: 'Joseph', locale: 'mt-MT', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Catalan
  {
    locale: 'ca-ES',
    displayName: 'Catalan (Spain)',
    localName: 'Català (Espanya)',
    voices: [
      { name: 'ca-ES-JoanaNeural', displayName: 'Joana', localName: 'Joana', locale: 'ca-ES', gender: 'Female', voiceType: 'Neural' },
      { name: 'ca-ES-EnricNeural', displayName: 'Enric', localName: 'Enric', locale: 'ca-ES', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Welsh
  {
    locale: 'cy-GB',
    displayName: 'Welsh (United Kingdom)',
    localName: 'Cymraeg (Prydain Fawr)',
    voices: [
      { name: 'cy-GB-NiaNeural', displayName: 'Nia', localName: 'Nia', locale: 'cy-GB', gender: 'Female', voiceType: 'Neural' },
      { name: 'cy-GB-AledNeural', displayName: 'Aled', localName: 'Aled', locale: 'cy-GB', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Irish
  {
    locale: 'ga-IE',
    displayName: 'Irish (Ireland)',
    localName: 'Gaeilge (Éire)',
    voices: [
      { name: 'ga-IE-OrlaNeural', displayName: 'Orla', localName: 'Orla', locale: 'ga-IE', gender: 'Female', voiceType: 'Neural' },
      { name: 'ga-IE-ColmNeural', displayName: 'Colm', localName: 'Colm', locale: 'ga-IE', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Basque
  {
    locale: 'eu-ES',
    displayName: 'Basque (Spain)',
    localName: 'Euskara (Espainia)',
    voices: [
      { name: 'eu-ES-AinhoaNeural', displayName: 'Ainhoa', localName: 'Ainhoa', locale: 'eu-ES', gender: 'Female', voiceType: 'Neural' },
      { name: 'eu-ES-AnderNeural', displayName: 'Ander', localName: 'Ander', locale: 'eu-ES', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Czech
  {
    locale: 'cs-CZ',
    displayName: 'Czech (Czech Republic)',
    localName: 'Čeština (Česká republika)',
    voices: [
      { name: 'cs-CZ-VlastaNeural', displayName: 'Vlasta', localName: 'Vlasta', locale: 'cs-CZ', gender: 'Female', voiceType: 'Neural' },
      { name: 'cs-CZ-AntoninNeural', displayName: 'Antonin', localName: 'Antonín', locale: 'cs-CZ', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Slovak
  {
    locale: 'sk-SK',
    displayName: 'Slovak (Slovakia)',
    localName: 'Slovenčina (Slovensko)',
    voices: [
      { name: 'sk-SK-ViktoriaNeural', displayName: 'Viktoria', localName: 'Viktória', locale: 'sk-SK', gender: 'Female', voiceType: 'Neural' },
      { name: 'sk-SK-LukasNeural', displayName: 'Lukas', localName: 'Lukáš', locale: 'sk-SK', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Ukrainian
  {
    locale: 'uk-UA',
    displayName: 'Ukrainian (Ukraine)',
    localName: 'Українська (Україна)',
    voices: [
      { name: 'uk-UA-PolinaNeural', displayName: 'Polina', localName: 'Поліна', locale: 'uk-UA', gender: 'Female', voiceType: 'Neural' },
      { name: 'uk-UA-OstapNeural', displayName: 'Ostap', localName: 'Остап', locale: 'uk-UA', gender: 'Male', voiceType: 'Neural' },
    ]
  },
  // Hindi
  {
    locale: 'hi-IN',
    displayName: 'Hindi (India)',
    localName: 'हिन्दी (भारत)',
    voices: [
      { name: 'hi-IN-SwaraNeural', displayName: 'Swara', localName: 'स्वरा', locale: 'hi-IN', gender: 'Female', voiceType: 'Neural' },
      { name: 'hi-IN-MadhurNeural', displayName: 'Madhur', localName: 'मधुर', locale: 'hi-IN', gender: 'Male', voiceType: 'Neural' },
    ]
  },
];

// Helper functions
export function getAzureLanguageByLocale(locale: string): AzureLanguage | undefined {
  return AZURE_LANGUAGES.find(lang => lang.locale === locale);
}

export function getAzureLanguageByIsoCode(isoCode: string): AzureLanguage | undefined {
  // First try exact match
  const exactMatch = AZURE_LANGUAGES.find(lang => 
    lang.locale.toLowerCase().startsWith(isoCode.toLowerCase() + '-')
  );
  
  if (exactMatch) return exactMatch;
  
  // Then try base language match
  const baseCode = isoCode.split('-')[0].toLowerCase();
  return AZURE_LANGUAGES.find(lang => 
    lang.locale.toLowerCase().startsWith(baseCode + '-')
  );
}

export function getAllAzureLanguages(): AzureLanguage[] {
  return AZURE_LANGUAGES;
}

export function getAllAzureVoices(): AzureVoice[] {
  return AZURE_LANGUAGES.flatMap(lang => lang.voices);
}

export function isLocaleSupported(locale: string): boolean {
  return AZURE_LANGUAGES.some(lang => lang.locale === locale);
}

export function isIsoCodeSupported(isoCode: string): boolean {
  return getAzureLanguageByIsoCode(isoCode) !== undefined;
}