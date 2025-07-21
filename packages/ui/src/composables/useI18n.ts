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
  if (!path || typeof path !== 'string') return undefined
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
      'bg-BG': 'Български',
      'cs-CZ': 'Čeština',
      'cy-GB': 'Cymraeg',
      'da-DK': 'Dansk',
      'de-AT': 'Deutsch (Österreich)',
      'de-CH': 'Deutsch (Schweiz)',
      'de-DE': 'Deutsch',
      'el-GR': 'Ελληνικά',
      'en-AU': 'English (Australia)',
      'en-CA': 'English (Canada)',
      'en-GB': 'English (UK)',
      'en-US': 'English (US)',
      'es-AR': 'Español (Argentina)',
      'es-ES': 'Español',
      'es-MX': 'Español (México)',
      'et-EE': 'Eesti',
      'fi-FI': 'Suomi',
      'fr-BE': 'Français (Belgique)',
      'fr-CA': 'Français (Canada)',
      'fr-FR': 'Français',
      'ga-IE': 'Gaeilge',
      'hr-HR': 'Hrvatski',
      'hu-HU': 'Magyar',
      'hy-AM': 'Հայերեն',
      'is-IS': 'Íslenska',
      'it-IT': 'Italiano',
      'lt-LT': 'Lietuvių',
      'lv-LV': 'Latviešu',
      'mt-MT': 'Malti',
      'nl-BE': 'Nederlands (België)',
      'nl-NL': 'Nederlands',
      'no-NO': 'Norsk',
      'pl-PL': 'Polski',
      'pt-BR': 'Português (Brasil)',
      'pt-PT': 'Português',
      'ro-RO': 'Română',
      'ru-RU': 'Русский',
      'sk-SK': 'Slovenčina',
      'sl-SI': 'Slovenščina',
      'sv-SE': 'Svenska'
    }
    
    // For now, just use native names since maintaining all translation combinations is complex
    // TODO: Add proper translated names for all locales if needed
    const translatedNames: Partial<Record<Locale, Record<Locale, string>>> = {}
    
    // For now, always return native names
    // TODO: Implement proper translated names if needed
    return nativeNames
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