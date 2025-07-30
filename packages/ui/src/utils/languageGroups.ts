/**
 * Language groups utility for managing language variants
 * Groups languages by their base code (e.g., en-GB and en-US under 'en')
 */

export interface LanguageVariant {
  code: string
  regionCode: string
  translationKey: string
}

export interface LanguageGroup {
  baseCode: string
  translationKey: string
  variants: LanguageVariant[]
}

export type Locale = string

// Static language data for backwards compatibility
// This will be replaced by database data in TChooseLanguage
const languageData: Record<string, LanguageGroup> = {
  'bg': { baseCode: 'bg', translationKey: 'bulgarian', variants: [{ code: 'bg', regionCode: 'BG', translationKey: 'bulgarian' }] },
  'cs': { baseCode: 'cs', translationKey: 'czech', variants: [{ code: 'cs', regionCode: 'CZ', translationKey: 'czech' }] },
  'cy': { baseCode: 'cy', translationKey: 'welsh', variants: [{ code: 'cy', regionCode: 'GB', translationKey: 'welsh' }] },
  'da': { baseCode: 'da', translationKey: 'danish', variants: [{ code: 'da', regionCode: 'DK', translationKey: 'danish' }] },
  'de': { baseCode: 'de', translationKey: 'german', variants: [
    { code: 'de-DE', regionCode: 'DE', translationKey: 'germanGermany' },
    { code: 'de-AT', regionCode: 'AT', translationKey: 'germanAustria' },
    { code: 'de-CH', regionCode: 'CH', translationKey: 'germanSwitzerland' }
  ]},
  'el': { baseCode: 'el', translationKey: 'greek', variants: [{ code: 'el', regionCode: 'GR', translationKey: 'greek' }] },
  'en': { baseCode: 'en', translationKey: 'english', variants: [
    { code: 'en-GB', regionCode: 'GB', translationKey: 'englishUK' },
    { code: 'en-US', regionCode: 'US', translationKey: 'englishUS' }
  ]},
  'es': { baseCode: 'es', translationKey: 'spanish', variants: [
    { code: 'es-ES', regionCode: 'ES', translationKey: 'spanishSpain' },
    { code: 'es-MX', regionCode: 'MX', translationKey: 'spanishMexico' }
  ]},
  'et': { baseCode: 'et', translationKey: 'estonian', variants: [{ code: 'et', regionCode: 'EE', translationKey: 'estonian' }] },
  'fi': { baseCode: 'fi', translationKey: 'finnish', variants: [{ code: 'fi', regionCode: 'FI', translationKey: 'finnish' }] },
  'fr': { baseCode: 'fr', translationKey: 'french', variants: [
    { code: 'fr-FR', regionCode: 'FR', translationKey: 'frenchFrance' },
    { code: 'fr-BE', regionCode: 'BE', translationKey: 'frenchBelgium' },
    { code: 'fr-CH', regionCode: 'CH', translationKey: 'frenchSwitzerland' }
  ]},
  'ga': { baseCode: 'ga', translationKey: 'irish', variants: [{ code: 'ga', regionCode: 'IE', translationKey: 'irish' }] },
  'hr': { baseCode: 'hr', translationKey: 'croatian', variants: [{ code: 'hr', regionCode: 'HR', translationKey: 'croatian' }] },
  'hu': { baseCode: 'hu', translationKey: 'hungarian', variants: [{ code: 'hu', regionCode: 'HU', translationKey: 'hungarian' }] },
  'hy': { baseCode: 'hy', translationKey: 'armenian', variants: [{ code: 'hy', regionCode: 'AM', translationKey: 'armenian' }] },
  'is': { baseCode: 'is', translationKey: 'icelandic', variants: [{ code: 'is', regionCode: 'IS', translationKey: 'icelandic' }] },
  'it': { baseCode: 'it', translationKey: 'italian', variants: [{ code: 'it', regionCode: 'IT', translationKey: 'italian' }] },
  'lt': { baseCode: 'lt', translationKey: 'lithuanian', variants: [{ code: 'lt', regionCode: 'LT', translationKey: 'lithuanian' }] },
  'lv': { baseCode: 'lv', translationKey: 'latvian', variants: [{ code: 'lv', regionCode: 'LV', translationKey: 'latvian' }] },
  'mt': { baseCode: 'mt', translationKey: 'maltese', variants: [{ code: 'mt', regionCode: 'MT', translationKey: 'maltese' }] },
  'nl': { baseCode: 'nl', translationKey: 'dutch', variants: [
    { code: 'nl-NL', regionCode: 'NL', translationKey: 'dutchNetherlands' },
    { code: 'nl-BE', regionCode: 'BE', translationKey: 'dutchBelgium' }
  ]},
  'no': { baseCode: 'no', translationKey: 'norwegian', variants: [{ code: 'no', regionCode: 'NO', translationKey: 'norwegian' }] },
  'pl': { baseCode: 'pl', translationKey: 'polish', variants: [{ code: 'pl', regionCode: 'PL', translationKey: 'polish' }] },
  'pt': { baseCode: 'pt', translationKey: 'portuguese', variants: [
    { code: 'pt-PT', regionCode: 'PT', translationKey: 'portuguesePortugal' },
    { code: 'pt-BR', regionCode: 'BR', translationKey: 'portugueseBrazil' }
  ]},
  'ro': { baseCode: 'ro', translationKey: 'romanian', variants: [{ code: 'ro', regionCode: 'RO', translationKey: 'romanian' }] },
  'ru': { baseCode: 'ru', translationKey: 'russian', variants: [{ code: 'ru', regionCode: 'RU', translationKey: 'russian' }] },
  'sk': { baseCode: 'sk', translationKey: 'slovak', variants: [{ code: 'sk', regionCode: 'SK', translationKey: 'slovak' }] },
  'sl': { baseCode: 'sl', translationKey: 'slovenian', variants: [{ code: 'sl', regionCode: 'SI', translationKey: 'slovenian' }] },
  'sv': { baseCode: 'sv', translationKey: 'swedish', variants: [{ code: 'sv', regionCode: 'SE', translationKey: 'swedish' }] }
}

/**
 * Get all language groups
 * @deprecated Use database languages instead via translationService.getActiveLanguages()
 */
export function getLanguageGroups(): LanguageGroup[] {
  return Object.values(languageData)
}

/**
 * Find language group by locale code
 * @deprecated Use database languages instead
 */
export function findLanguageGroupByLocale(locale: Locale): LanguageGroup | undefined {
  // First try exact match
  for (const group of Object.values(languageData)) {
    if (group.variants.some(v => v.code === locale)) {
      return group
    }
  }
  
  // Try base code match
  const baseCode = getBaseLanguageCode(locale)
  return languageData[baseCode]
}

/**
 * Get base language code from locale
 */
export function getBaseLanguageCode(locale: Locale): string {
  return locale.split('-')[0]
}

/**
 * Convert database language to language group format
 * Used for backwards compatibility
 */
export function databaseLanguageToGroup(language: { code: string; name: string; native_name?: string }): LanguageGroup {
  const baseCode = getBaseLanguageCode(language.code)
  const regionCode = language.code.includes('-') ? language.code.split('-')[1] : language.code.toUpperCase()
  
  return {
    baseCode,
    translationKey: language.name.toLowerCase(),
    variants: [{
      code: language.code,
      regionCode,
      translationKey: language.name.toLowerCase()
    }]
  }
}

/**
 * Group database languages by base code
 */
export function groupDatabaseLanguages(languages: Array<{ code: string; name: string; native_name?: string }>): LanguageGroup[] {
  const groups: Record<string, LanguageGroup> = {}
  
  languages.forEach(language => {
    const baseCode = getBaseLanguageCode(language.code)
    const regionCode = language.code.includes('-') ? language.code.split('-')[1] : ''
    
    if (!groups[baseCode]) {
      groups[baseCode] = {
        baseCode,
        translationKey: language.name.toLowerCase(),
        variants: []
      }
    }
    
    groups[baseCode].variants.push({
      code: language.code,
      regionCode: regionCode || baseCode.toUpperCase(),
      translationKey: language.name.toLowerCase()
    })
  })
  
  return Object.values(groups)
}