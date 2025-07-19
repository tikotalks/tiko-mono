import type { LocaleCode } from '../i18n/locales'
import { locales } from '../i18n/locales'

export interface LanguageGroup {
  baseCode: string
  translationKey: string
  variants: LanguageVariant[]
}

export interface LanguageVariant {
  code: LocaleCode
  regionCode: string
  translationKey: string
}

// Map base language codes to their translation keys
const BASE_LANGUAGE_KEYS: Record<string, string> = {
  'bg': 'bulgarian',
  'cs': 'czech', 
  'cy': 'welsh',
  'da': 'danish',
  'de': 'german',
  'el': 'greek',
  'en': 'english',
  'es': 'spanish',
  'et': 'estonian',
  'fi': 'finnish',
  'fr': 'french',
  'ga': 'irish',
  'hr': 'croatian',
  'hu': 'hungarian',
  'hy': 'armenian',
  'is': 'icelandic',
  'it': 'italian',
  'lt': 'lithuanian',
  'lv': 'latvian',
  'mt': 'maltese',
  'nl': 'dutch',
  'no': 'norwegian',
  'pl': 'polish',
  'pt': 'portuguese',
  'ro': 'romanian',
  'ru': 'russian',
  'sk': 'slovak',
  'sl': 'slovenian',
  'sv': 'swedish'
}

// Map specific locale codes to their translation keys
const LOCALE_TRANSLATION_KEYS: Record<string, string> = {
  // German variants
  'de-DE': 'germanGermany',
  'de-AT': 'germanAustria', 
  'de-CH': 'germanSwitzerland',
  // English variants
  'en-GB': 'englishUK',
  'en-US': 'englishUS',
  'en-AU': 'englishAustralia',
  'en-CA': 'englishCanada',
  // Spanish variants
  'es-ES': 'spanishSpain',
  'es-MX': 'spanishMexico',
  'es-AR': 'spanishArgentina',
  // French variants
  'fr-FR': 'frenchFrance',
  'fr-CA': 'frenchCanada',
  'fr-BE': 'frenchBelgium',
  // Dutch variants
  'nl-NL': 'dutchNetherlands',
  'nl-BE': 'dutchBelgium',
  // Portuguese variants
  'pt-PT': 'portuguesePortugal',
  'pt-BR': 'portugueseBrazil'
}

/**
 * Dynamically groups locales by their base language
 */
export function getLanguageGroups(): LanguageGroup[] {
  const groups = new Map<string, LanguageGroup>()
  
  // Process all available locales
  Object.keys(locales).forEach(localeCode => {
    const [baseCode, regionCode] = localeCode.split('-')
    
    // Skip if we don't have a translation key for this base language
    if (!BASE_LANGUAGE_KEYS[baseCode]) {
      return
    }
    
    // Get or create the language group
    if (!groups.has(baseCode)) {
      groups.set(baseCode, {
        baseCode,
        translationKey: BASE_LANGUAGE_KEYS[baseCode],
        variants: []
      })
    }
    
    const group = groups.get(baseCode)!
    
    // Add the variant
    group.variants.push({
      code: localeCode as LocaleCode,
      regionCode: regionCode || baseCode.toUpperCase(),
      translationKey: LOCALE_TRANSLATION_KEYS[localeCode] || BASE_LANGUAGE_KEYS[baseCode]
    })
  })
  
  // Convert map to array and sort by base code
  return Array.from(groups.values()).sort((a, b) => a.baseCode.localeCompare(b.baseCode))
}

/**
 * Gets a language group by base code
 */
export function getLanguageGroup(baseCode: string): LanguageGroup | undefined {
  return getLanguageGroups().find(group => group.baseCode === baseCode)
}

/**
 * Gets the base language code from a full locale code
 */
export function getBaseLanguageCode(localeCode: string): string {
  return localeCode.split('-')[0]
}

/**
 * Finds which language group contains a specific locale
 */
export function findLanguageGroupByLocale(localeCode: LocaleCode): LanguageGroup | undefined {
  return getLanguageGroups().find(group => 
    group.variants.some(variant => variant.code === localeCode)
  )
}