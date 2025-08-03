/**
 * Static i18n composable
 * 
 * This composable uses statically generated translation files for optimal
 * performance and eliminates runtime database dependencies.
 * 
 * Features:
 * - Static TypeScript files generated at build time
 * - No database queries at runtime
 * - TypeScript support with auto-completion
 * - Parameter interpolation
 * - Locale persistence and management
 * - Fallback language support
 * 
 * Usage:
 * ```typescript
 * const { t, setLocale, currentLocale } = useI18n()
 * 
 * // Simple translation
 * const title = t('common.save')
 * 
 * // With parameters
 * const welcome = t('user.welcome', { name: 'John' })
 * 
 * // Change language
 * await setLocale('nl')
 * ```
 */

import { computed, ref, watch } from 'vue';
import { translations as generatedTranslations, AVAILABLE_LANGUAGES as generatedLanguages } from '../i18n/generated';

// Types
interface TranslationParams {
  [key: string]: string | number
}

interface I18nOptions {
  fallbackLocale?: string
  persistLocale?: boolean
  storageKey?: string
}

// Global state - initialize with imported translations
let staticTranslations: Record<string, any> = generatedTranslations || {}
let staticAvailableLanguages: string[] = generatedLanguages ? [...generatedLanguages] : []
let staticInitialized = false

// Storage key for persistence
const LOCALE_STORAGE_KEY = 'tiko:locale'

// Initialize static translations
function initializeStaticMode(): void {
  if (staticInitialized) return

  // Translations are already loaded via static import
  console.log('🌍 Static translation mode initialized')
  console.log('📚 Available languages:', staticAvailableLanguages)
  console.log('📚 Loaded translations for locales:', Object.keys(staticTranslations))
  
  // Check if we have any translations
  if (Object.keys(staticTranslations).length === 0) {
    console.error('❌ No translations loaded! Check import from ../i18n/generated')
  } else {
    // Log sample translation to verify
    const sampleKey = staticTranslations['en']?.admin?.navigation?.dashboard
    console.log('📚 Sample translation (en admin.navigation.dashboard):', sampleKey)
  }

  staticInitialized = true
}

/**
 * Static i18n composable
 */
export function useI18n(options: I18nOptions = {}) {
  const {
    fallbackLocale = 'en',
    persistLocale = true,
    storageKey = LOCALE_STORAGE_KEY
  } = options

  // Initialize synchronously
  initializeStaticMode()

  // Current locale state
  const currentLocale = ref<string>(fallbackLocale)
  const isReady = ref(true) // Always ready with static imports

  // Initialize locale from storage or browser
  if (persistLocale && typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(storageKey)
    if (stored && staticAvailableLanguages.includes(stored)) {
      currentLocale.value = stored
    } else {
      const browserLocale = getBrowserLocale()
      if (browserLocale) {
        currentLocale.value = browserLocale
      }
    }
  }

  // Watch for locale changes and persist
  if (persistLocale) {
    watch(currentLocale, (newLocale) => {
      localStorage.setItem(storageKey, newLocale)
    })
  }

  /**
   * Translation function
   */
  const t = (key: string | any, params?: Record<string, any> | string): string => {
    // Ensure key is a string
    const keyStr = typeof key === 'string' ? key : String(key);

    // Get translation
    const translation = getStaticTranslation(keyStr, currentLocale.value)
    if (!translation) {
      console.warn(`Translation missing for key "${keyStr}" in locale "${currentLocale.value}"`)
      
      // Handle legacy string params as fallback
      if (typeof params === 'string') {
        return params
      }
      
      return keyStr
    }

    // Handle legacy string params as fallback
    if (typeof params === 'string') {
      return translation
    }

    return interpolateParams(translation, params)
  };

  /**
   * Set current locale
   */
  const setLocale = (locale: string): void => {
    if (!staticAvailableLanguages.includes(locale)) {
      console.warn(`Invalid locale "${locale}". Available locales:`, staticAvailableLanguages)
      return
    }
    currentLocale.value = locale
  }

  /**
   * Get available locales
   */
  const availableLocales = computed(() => {
    return [...staticAvailableLanguages]
  })

  /**
   * Check if a key exists
   */
  const hasKey = (key: string): boolean => {
    return !!getStaticTranslation(key, currentLocale.value)
  }

  /**
   * Get all keys for current locale
   */
  const keys = computed(() => {
    if (!isReady.value || !currentLocale.value) return null
    return staticTranslations[currentLocale.value] || staticTranslations['en'] || null
  })

  return {
    t,
    locale: currentLocale,
    currentLocale: computed(() => currentLocale.value),
    setLocale,
    availableLocales,
    loading: computed(() => !isReady.value),
    error: ref(null),
    isReady,
    hasKey,
    keys,
    
    // For backwards compatibility
    refreshTranslations: () => Promise.resolve(),
    _store: null
  };
}

/**
 * Get static translation from nested object using dot notation
 */
function getStaticTranslation(key: string, locale: string): string | null {
  const localeTranslations = staticTranslations[locale]
  if (!localeTranslations) {
    // Try fallback locale
    const fallbackTranslations = staticTranslations['en']
    if (!fallbackTranslations) return null
    return getNestedValue(fallbackTranslations, key)
  }

  const value = getNestedValue(localeTranslations, key)
  
  // If not found and current locale is not fallback, try fallback
  if (!value && locale !== 'en') {
    const fallbackTranslations = staticTranslations['en']
    if (fallbackTranslations) {
      return getNestedValue(fallbackTranslations, key)
    }
  }
  
  return value
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): string | null {
  const keys = path.split('.')
  let current = obj

  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return null
    }
    current = current[key]
  }

  return typeof current === 'string' ? current : null
}

/**
 * Interpolate parameters in translation string
 */
function interpolateParams(text: string, params?: TranslationParams): string {
  if (!params) return text

  return text.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key]
    return value !== undefined ? String(value) : match
  })
}

/**
 * Get browser locale with fallback
 */
function getBrowserLocale(): string | null {
  if (typeof navigator === 'undefined') return null

  const browserLocale = navigator.language || (navigator as any).userLanguage
  if (!browserLocale) return null

  // Try exact match first in available languages
  const availableLanguages = staticAvailableLanguages.length > 0 ? staticAvailableLanguages : ['en', 'nl', 'fr']
  
  if (availableLanguages.includes(browserLocale)) {
    return browserLocale
  }

  // Try language without region (e.g., 'en-US' -> 'en')
  const languageCode = browserLocale.split('-')[0]
  if (availableLanguages.includes(languageCode)) {
    return languageCode
  }

  return null
}

/**
 * Create a scoped translation function with prefix
 */
export function createScopedT(prefix: string) {
  const { t } = useI18n()
  
  return (key: string, params?: TranslationParams | string) => {
    const fullKey = `${prefix}.${key}`
    return t(fullKey, params)
  }
}
