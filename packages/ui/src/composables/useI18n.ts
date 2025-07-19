/**
 * Simple i18n composable for Tiko UI components
 * Provides translation functionality with type safety, interpolation, and fallback support
 */

import { computed } from 'vue'
import { useLocalStorage } from './useLocalStorage'
import { getTranslations } from '../i18n/locales'
import { translationKeys } from '../i18n/keys'
import type { Locale, TranslationKey, TranslationFunction } from '../i18n/types'

// Global locale state - shared across all components
const [globalLocale, setGlobalLocale] = useLocalStorage<Locale>('tiko-language', 'en-GB')

// Lazy load translations only when needed
let _translations: ReturnType<typeof getTranslations> | null = null
function getTranslationsCache() {
  if (!_translations) {
    _translations = getTranslations()
  }
  return _translations
}

/**
 * Get nested translation value by dot notation key
 * @param obj - Translation object
 * @param path - Dot notation path (e.g., 'common.save')
 * @returns Translation value or undefined if not found
 */
function getNestedValue(obj: any, path: string): string | undefined {
  const result = path.split('.').reduce((current, key) => current?.[key], obj)
  return typeof result === 'string' ? result : undefined
}

/**
 * Interpolate variables into a translation string
 * @param text - Translation text with placeholders (e.g., 'Hello {name}!')
 * @param params - Object with values to interpolate
 * @returns Interpolated text
 */
function interpolate(text: string, params?: Record<string, any>): string {
  if (!params) return text
  
  return text.replace(/{(\w+)}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match
  })
}

/**
 * Translation composable
 * @returns Translation functions and current locale
 */
export function useI18n() {
  /**
   * Translate a key to localized text with interpolation and fallback support
   * @param key - Translation key in dot notation (e.g., 'common.save')
   * @param params - Optional object with values to interpolate or string fallback
   * @returns Translated text
   */
  const t: TranslationFunction = (key: TranslationKey, params?: Record<string, any> | string): string => {
    // Handle params as either interpolation object or fallback string
    const interpolationParams = typeof params === 'object' ? params : undefined
    const fallbackText = typeof params === 'string' ? params : undefined
    
    // Try to get translation in current locale
    const translations = getTranslationsCache()
    let translation = getNestedValue(translations[globalLocale.value], key)
    
    // If not found and not English GB, try English GB as fallback
    if (!translation && globalLocale.value !== 'en-GB') {
      translation = getNestedValue(translations['en-GB'], key)
    }
    
    // If still not found, use fallback or key
    if (!translation) {
      return fallbackText || key
    }
    
    // Apply interpolation if params provided
    return interpolate(translation, interpolationParams)
  }

  /**
   * Check if a translation key exists
   * @param key - Translation key to check
   * @returns True if translation exists
   */
  const exists = (key: TranslationKey): boolean => {
    const translations = getTranslationsCache()
    return getNestedValue(translations[globalLocale.value], key) !== key
  }

  /**
   * Get current locale
   */
  const locale = computed(() => globalLocale.value)

  /**
   * Set current locale
   * @param newLocale - New locale to set
   */
  const setLocale = (newLocale: Locale) => {
    setGlobalLocale(newLocale)
  }

  /**
   * Get available locales
   */
  const availableLocales = computed(() => Object.keys(getTranslationsCache()) as Locale[])

  /**
   * Get locale display names - translated in each language
   */
  const getLocaleNames = (): Record<Locale, string> => {
    const currentLang = globalLocale.value
    
    // Language names in their own language
    const nativeNames: Record<Locale, string> = {
      'en-GB': 'English (UK)',
      'en-US': 'English (US)', 
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'pt': 'Português',
      'it': 'Italiano',
      'nl': 'Nederlands',
      'pl': 'Polski',
      'ro': 'Română',
      'sv': 'Svenska',
      'el': 'Ελληνικά',
      'ru': 'Русский'
    }
    
    // Translations for all language names in each locale
    const translatedNames: Record<Locale, Record<Locale, string>> = {
      'en-GB': {
        'en-GB': 'English (UK)',
        'en-US': 'English (US)',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'pt': 'Portuguese',
        'it': 'Italian',
        'nl': 'Dutch',
        'pl': 'Polish',
        'ro': 'Romanian',
        'sv': 'Swedish',
        'el': 'Greek',
        'ru': 'Russian'
      },
      'en-US': {
        'en-GB': 'English (UK)',
        'en-US': 'English (US)',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'pt': 'Portuguese',
        'it': 'Italian',
        'nl': 'Dutch',
        'pl': 'Polish',
        'ro': 'Romanian',
        'sv': 'Swedish',
        'el': 'Greek',
        'ru': 'Russian'
      },
      'es': {
        'en-GB': 'Inglés (Reino Unido)',
        'en-US': 'Inglés (Estados Unidos)',
        'es': 'Español',
        'fr': 'Francés',
        'de': 'Alemán',
        'pt': 'Portugués',
        'it': 'Italiano',
        'nl': 'Holandés',
        'pl': 'Polaco',
        'ro': 'Rumano',
        'sv': 'Sueco',
        'el': 'Griego',
        'ru': 'Ruso'
      },
      'fr': {
        'en-GB': 'Anglais (Royaume-Uni)',
        'en-US': 'Anglais (États-Unis)',
        'es': 'Espagnol',
        'fr': 'Français',
        'de': 'Allemand',
        'pt': 'Portugais',
        'it': 'Italien',
        'nl': 'Néerlandais',
        'pl': 'Polonais',
        'ro': 'Roumain',
        'sv': 'Suédois',
        'el': 'Grec',
        'ru': 'Russe'
      },
      'de': {
        'en-GB': 'Englisch (Vereinigtes Königreich)',
        'en-US': 'Englisch (Vereinigte Staaten)',
        'es': 'Spanisch',
        'fr': 'Französisch',
        'de': 'Deutsch',
        'pt': 'Portugiesisch',
        'it': 'Italienisch',
        'nl': 'Niederländisch',
        'pl': 'Polnisch',
        'ro': 'Rumänisch',
        'sv': 'Schwedisch',
        'el': 'Griechisch',
        'ru': 'Russisch'
      },
      'pt': {
        'en-GB': 'Inglês (Reino Unido)',
        'en-US': 'Inglês (Estados Unidos)',
        'es': 'Espanhol',
        'fr': 'Francês',
        'de': 'Alemão',
        'pt': 'Português',
        'it': 'Italiano',
        'nl': 'Holandês',
        'pl': 'Polaco',
        'ro': 'Romeno',
        'sv': 'Sueco',
        'el': 'Grego',
        'ru': 'Russo'
      },
      'it': {
        'en-GB': 'Inglese (Regno Unito)',
        'en-US': 'Inglese (Stati Uniti)',
        'es': 'Spagnolo',
        'fr': 'Francese',
        'de': 'Tedesco',
        'pt': 'Portoghese',
        'it': 'Italiano',
        'nl': 'Olandese',
        'pl': 'Polacco',
        'ro': 'Rumeno',
        'sv': 'Svedese',
        'el': 'Greco',
        'ru': 'Russo'
      },
      'nl': {
        'en-GB': 'Engels (Verenigd Koninkrijk)',
        'en-US': 'Engels (Verenigde Staten)',
        'es': 'Spaans',
        'fr': 'Frans',
        'de': 'Duits',
        'pt': 'Portugees',
        'it': 'Italiaans',
        'nl': 'Nederlands',
        'pl': 'Pools',
        'ro': 'Roemeens',
        'sv': 'Zweeds',
        'el': 'Grieks',
        'ru': 'Russisch'
      },
      'pl': {
        'en-GB': 'Angielski (Wielka Brytania)',
        'en-US': 'Angielski (Stany Zjednoczone)',
        'es': 'Hiszpański',
        'fr': 'Francuski',
        'de': 'Niemiecki',
        'pt': 'Portugalski',
        'it': 'Włoski',
        'nl': 'Holenderski',
        'pl': 'Polski',
        'ro': 'Rumuński',
        'sv': 'Szwedzki',
        'el': 'Grecki',
        'ru': 'Rosyjski'
      },
      'ro': {
        'en-GB': 'Engleză (Regatul Unit)',
        'en-US': 'Engleză (Statele Unite)',
        'es': 'Spaniolă',
        'fr': 'Franceză',
        'de': 'Germană',
        'pt': 'Portugheză',
        'it': 'Italiană',
        'nl': 'Olandeză',
        'pl': 'Poloneză',
        'ro': 'Română',
        'sv': 'Suedeză',
        'el': 'Greacă',
        'ru': 'Rusă'
      },
      'sv': {
        'en-GB': 'Engelska (Storbritannien)',
        'en-US': 'Engelska (USA)',
        'es': 'Spanska',
        'fr': 'Franska',
        'de': 'Tyska',
        'pt': 'Portugisiska',
        'it': 'Italienska',
        'nl': 'Nederländska',
        'pl': 'Polska',
        'ro': 'Rumänska',
        'sv': 'Svenska',
        'el': 'Grekiska',
        'ru': 'Ryska'
      },
      'el': {
        'en-GB': 'Αγγλικά (Ηνωμένο Βασίλειο)',
        'en-US': 'Αγγλικά (Ηνωμένες Πολιτείες)',
        'es': 'Ισπανικά',
        'fr': 'Γαλλικά',
        'de': 'Γερμανικά',
        'pt': 'Πορτογαλικά',
        'it': 'Ιταλικά',
        'nl': 'Ολλανδικά',
        'pl': 'Πολωνικά',
        'ro': 'Ρουμανικά',
        'sv': 'Σουηδικά',
        'el': 'Ελληνικά',
        'ru': 'Ρωσικά'
      },
      'ru': {
        'en-GB': 'Английский (Великобритания)',
        'en-US': 'Английский (США)',
        'es': 'Испанский',
        'fr': 'Французский',
        'de': 'Немецкий',
        'pt': 'Португальский',
        'it': 'Итальянский',
        'nl': 'Голландский',
        'pl': 'Польский',
        'ro': 'Румынский',
        'sv': 'Шведский',
        'el': 'Греческий',
        'ru': 'Русский'
      }
    }
    
    // Return translated names for current locale, fallback to native names
    return translatedNames[currentLang] || nativeNames
  }
  
  const localeNames = computed(() => getLocaleNames())

  return {
    t,
    exists,
    locale,
    setLocale,
    availableLocales,
    localeNames,
    keys: translationKeys
  }
}