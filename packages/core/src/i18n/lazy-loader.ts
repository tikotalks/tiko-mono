/**
 * Lazy language loader for i18n
 * Loads language JSON files on demand instead of bundling all languages.
 */

import type { Translations } from './types'

// Cache for loaded languages
const languageCache = new Map<string, Translations>()

// Map of language codes to their dynamic import functions
const languageLoaders: Record<string, () => Promise<{ default: Translations }>> = {
  'bg': () => import('./json/bg.json') as Promise<{ default: Translations }>,
  'bg-BG': () => import('./json/bg-BG.json') as Promise<{ default: Translations }>,
  'cs': () => import('./json/cs.json') as Promise<{ default: Translations }>,
  'cs-CZ': () => import('./json/cs-CZ.json') as Promise<{ default: Translations }>,
  'cy': () => import('./json/cy.json') as Promise<{ default: Translations }>,
  'cy-GB': () => import('./json/cy-GB.json') as Promise<{ default: Translations }>,
  'da': () => import('./json/da.json') as Promise<{ default: Translations }>,
  'da-DK': () => import('./json/da-DK.json') as Promise<{ default: Translations }>,
  'de': () => import('./json/de.json') as Promise<{ default: Translations }>,
  'de-AT': () => import('./json/de-AT.json') as Promise<{ default: Translations }>,
  'de-CH': () => import('./json/de-CH.json') as Promise<{ default: Translations }>,
  'de-DE': () => import('./json/de-DE.json') as Promise<{ default: Translations }>,
  'el': () => import('./json/el.json') as Promise<{ default: Translations }>,
  'el-GR': () => import('./json/el-GR.json') as Promise<{ default: Translations }>,
  'en': () => import('./json/en.json') as Promise<{ default: Translations }>,
  'en-GB': () => import('./json/en-GB.json') as Promise<{ default: Translations }>,
  'en-US': () => import('./json/en-US.json') as Promise<{ default: Translations }>,
  'es': () => import('./json/es.json') as Promise<{ default: Translations }>,
  'es-AR': () => import('./json/es-AR.json') as Promise<{ default: Translations }>,
  'es-ES': () => import('./json/es-ES.json') as Promise<{ default: Translations }>,
  'es-MX': () => import('./json/es-MX.json') as Promise<{ default: Translations }>,
  'et': () => import('./json/et.json') as Promise<{ default: Translations }>,
  'et-EE': () => import('./json/et-EE.json') as Promise<{ default: Translations }>,
  'fi': () => import('./json/fi.json') as Promise<{ default: Translations }>,
  'fi-FI': () => import('./json/fi-FI.json') as Promise<{ default: Translations }>,
  'fr': () => import('./json/fr.json') as Promise<{ default: Translations }>,
  'fr-BE': () => import('./json/fr-BE.json') as Promise<{ default: Translations }>,
  'fr-CA': () => import('./json/fr-CA.json') as Promise<{ default: Translations }>,
  'fr-FR': () => import('./json/fr-FR.json') as Promise<{ default: Translations }>,
  'ga': () => import('./json/ga.json') as Promise<{ default: Translations }>,
  'ga-IE': () => import('./json/ga-IE.json') as Promise<{ default: Translations }>,
  'hr': () => import('./json/hr.json') as Promise<{ default: Translations }>,
  'hr-HR': () => import('./json/hr-HR.json') as Promise<{ default: Translations }>,
  'hu': () => import('./json/hu.json') as Promise<{ default: Translations }>,
  'hu-HU': () => import('./json/hu-HU.json') as Promise<{ default: Translations }>,
  'hy': () => import('./json/hy.json') as Promise<{ default: Translations }>,
  'hy-AM': () => import('./json/hy-AM.json') as Promise<{ default: Translations }>,
  'is': () => import('./json/is.json') as Promise<{ default: Translations }>,
  'is-IS': () => import('./json/is-IS.json') as Promise<{ default: Translations }>,
  'it': () => import('./json/it.json') as Promise<{ default: Translations }>,
  'it-IT': () => import('./json/it-IT.json') as Promise<{ default: Translations }>,
  'lt': () => import('./json/lt.json') as Promise<{ default: Translations }>,
  'lt-LT': () => import('./json/lt-LT.json') as Promise<{ default: Translations }>,
  'lv': () => import('./json/lv.json') as Promise<{ default: Translations }>,
  'lv-LV': () => import('./json/lv-LV.json') as Promise<{ default: Translations }>,
  'mt': () => import('./json/mt.json') as Promise<{ default: Translations }>,
  'mt-MT': () => import('./json/mt-MT.json') as Promise<{ default: Translations }>,
  'nl': () => import('./json/nl.json') as Promise<{ default: Translations }>,
  'nl-BE': () => import('./json/nl-BE.json') as Promise<{ default: Translations }>,
  'nl-NL': () => import('./json/nl-NL.json') as Promise<{ default: Translations }>,
  'no': () => import('./json/no.json') as Promise<{ default: Translations }>,
  'no-NO': () => import('./json/no-NO.json') as Promise<{ default: Translations }>,
  'pl': () => import('./json/pl.json') as Promise<{ default: Translations }>,
  'pl-PL': () => import('./json/pl-PL.json') as Promise<{ default: Translations }>,
  'pt': () => import('./json/pt.json') as Promise<{ default: Translations }>,
  'pt-BR': () => import('./json/pt-BR.json') as Promise<{ default: Translations }>,
  'pt-PT': () => import('./json/pt-PT.json') as Promise<{ default: Translations }>,
  'ro': () => import('./json/ro.json') as Promise<{ default: Translations }>,
  'ro-RO': () => import('./json/ro-RO.json') as Promise<{ default: Translations }>,
  'ru': () => import('./json/ru.json') as Promise<{ default: Translations }>,
  'ru-RU': () => import('./json/ru-RU.json') as Promise<{ default: Translations }>,
  'sk': () => import('./json/sk.json') as Promise<{ default: Translations }>,
  'sk-SK': () => import('./json/sk-SK.json') as Promise<{ default: Translations }>,
  'sl': () => import('./json/sl.json') as Promise<{ default: Translations }>,
  'sl-SI': () => import('./json/sl-SI.json') as Promise<{ default: Translations }>,
  'sv': () => import('./json/sv.json') as Promise<{ default: Translations }>,
  'sv-SE': () => import('./json/sv-SE.json') as Promise<{ default: Translations }>,
}

/**
 * Load a language file dynamically
 * @param locale The locale to load
 * @param forceReload Force reload even if cached
 * @returns The translations for the locale
 */
export async function loadLanguage(locale: string, forceReload = false): Promise<Translations | null> {
  // Check cache first (unless force reload)
  if (!forceReload && languageCache.has(locale)) {
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
    const baseKeys = Object.keys(baseTranslations).length
    const regionalKeys = Object.keys(regionalTranslations).length
    const merged = {
      ...baseTranslations,
      ...regionalTranslations
    }
    const mergedKeys = Object.keys(merged).length
    console.log(`[i18n] Base ${baseLocale}: ${baseKeys} keys, Regional ${locale}: ${regionalKeys} keys, Merged: ${mergedKeys} keys`)
    return merged
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
