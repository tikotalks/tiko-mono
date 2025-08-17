/**
 * Lazy language loader for i18n
 * Loads language files on demand instead of bundling all languages
 */

import type { Translations } from './generated/types'

// Cache for loaded languages
const languageCache = new Map<string, Translations>()

// Map of language codes to their dynamic import functions
const languageLoaders: Record<string, () => Promise<{ default: Translations }>> = {
  'bg': () => import('./generated/bg'),
  'bg-BG': () => import('./generated/bg-BG'),
  'cs': () => import('./generated/cs'),
  'cs-CZ': () => import('./generated/cs-CZ'),
  'cy': () => import('./generated/cy'),
  'cy-GB': () => import('./generated/cy-GB'),
  'da': () => import('./generated/da'),
  'da-DK': () => import('./generated/da-DK'),
  'de': () => import('./generated/de'),
  'de-AT': () => import('./generated/de-AT'),
  'de-CH': () => import('./generated/de-CH'),
  'de-DE': () => import('./generated/de-DE'),
  'el': () => import('./generated/el'),
  'el-GR': () => import('./generated/el-GR'),
  'en': () => import('./generated/en'),
  'en-GB': () => import('./generated/en-GB'),
  'en-US': () => import('./generated/en-US'),
  'es': () => import('./generated/es'),
  'es-AR': () => import('./generated/es-AR'),
  'es-ES': () => import('./generated/es-ES'),
  'es-MX': () => import('./generated/es-MX'),
  'et': () => import('./generated/et'),
  'et-EE': () => import('./generated/et-EE'),
  'fi': () => import('./generated/fi'),
  'fi-FI': () => import('./generated/fi-FI'),
  'fr': () => import('./generated/fr'),
  'fr-BE': () => import('./generated/fr-BE'),
  'fr-CA': () => import('./generated/fr-CA'),
  'fr-FR': () => import('./generated/fr-FR'),
  'ga': () => import('./generated/ga'),
  'ga-IE': () => import('./generated/ga-IE'),
  'hr': () => import('./generated/hr'),
  'hr-HR': () => import('./generated/hr-HR'),
  'hu': () => import('./generated/hu'),
  'hu-HU': () => import('./generated/hu-HU'),
  'hy': () => import('./generated/hy'),
  'hy-AM': () => import('./generated/hy-AM'),
  'is': () => import('./generated/is'),
  'is-IS': () => import('./generated/is-IS'),
  'it': () => import('./generated/it'),
  'it-IT': () => import('./generated/it-IT'),
  'lt': () => import('./generated/lt'),
  'lt-LT': () => import('./generated/lt-LT'),
  'lv': () => import('./generated/lv'),
  'lv-LV': () => import('./generated/lv-LV'),
  'mt': () => import('./generated/mt'),
  'mt-MT': () => import('./generated/mt-MT'),
  'nl': () => import('./generated/nl'),
  'nl-BE': () => import('./generated/nl-BE'),
  'nl-NL': () => import('./generated/nl-NL'),
  'no': () => import('./generated/no'),
  'no-NO': () => import('./generated/no-NO'),
  'pl': () => import('./generated/pl'),
  'pl-PL': () => import('./generated/pl-PL'),
  'pt': () => import('./generated/pt'),
  'pt-BR': () => import('./generated/pt-BR'),
  'pt-PT': () => import('./generated/pt-PT'),
  'ro': () => import('./generated/ro'),
  'ro-RO': () => import('./generated/ro-RO'),
  'ru': () => import('./generated/ru'),
  'ru-RU': () => import('./generated/ru-RU'),
  'sk': () => import('./generated/sk'),
  'sk-SK': () => import('./generated/sk-SK'),
  'sl': () => import('./generated/sl'),
  'sl-SI': () => import('./generated/sl-SI'),
  'sv': () => import('./generated/sv'),
  'sv-SE': () => import('./generated/sv-SE'),
}

/**
 * Load a language file dynamically
 * @param locale The locale to load
 * @returns The translations for the locale
 */
export async function loadLanguage(locale: string): Promise<Translations | null> {
  // Check cache first
  if (languageCache.has(locale)) {
    console.log(`[i18n] Returning cached language: ${locale}`)
    return languageCache.get(locale)!
  }

  // Check if we have a loader for this locale
  const loader = languageLoaders[locale]
  if (!loader) {
    console.warn(`[i18n] No loader found for locale: ${locale}`)
    return null
  }

  try {
    console.log(`[i18n] Loading language dynamically: ${locale}`)
    const module = await loader()
    const translations = module.default
    
    // Cache the loaded language
    languageCache.set(locale, translations)
    
    return translations
  } catch (error) {
    console.error(`[i18n] Failed to load language ${locale}:`, error)
    return null
  }
}

/**
 * Load a language with its base language for merging
 * @param locale The locale to load (e.g., 'de-DE')
 * @returns The merged translations
 */
export async function loadLanguageWithBase(locale: string): Promise<Translations | null> {
  // If it's a base language, just load it
  if (!locale.includes('-')) {
    return loadLanguage(locale)
  }

  // Load the regional language
  const regionalTranslations = await loadLanguage(locale)
  if (!regionalTranslations) {
    return null
  }

  // Get base language (e.g., 'de' from 'de-DE')
  const baseLocale = locale.split('-')[0]
  
  // Try to load base language
  const baseTranslations = await loadLanguage(baseLocale)
  
  // If base language exists, merge it with regional
  if (baseTranslations) {
    console.log(`[i18n] Merging ${baseLocale} into ${locale}`)
    return {
      ...baseTranslations,
      ...regionalTranslations
    }
  }

  // Return just regional if no base exists
  return regionalTranslations
}

/**
 * Preload a language in the background
 * @param locale The locale to preload
 */
export async function preloadLanguage(locale: string): Promise<void> {
  // Just load it to cache it
  await loadLanguageWithBase(locale)
}

/**
 * Get all available languages (without loading them)
 */
export function getAvailableLanguages(): string[] {
  return Object.keys(languageLoaders)
}

/**
 * Check if a language is available
 */
export function isLanguageAvailable(locale: string): boolean {
  return locale in languageLoaders
}

/**
 * Clear the language cache
 */
export function clearLanguageCache(): void {
  languageCache.clear()
}

/**
 * Get the current cache size
 */
export function getCacheSize(): number {
  return languageCache.size
}