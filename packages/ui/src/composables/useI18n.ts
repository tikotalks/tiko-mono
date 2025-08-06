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
import { translations as generatedTranslations, AVAILABLE_LANGUAGES as generatedLanguages } from '../i18n/generated/index';

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
let staticKeys: any = null // Cached keys structure

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
    // Log sample translation to verify structure
    const enTranslations = staticTranslations['en']
    if (enTranslations) {
      // Check if it's flat or nested structure
      const flatKey = enTranslations['admin.navigation.dashboard']
      const nestedKey = enTranslations.admin?.navigation?.dashboard
      console.log('📚 Translation structure check:')
      console.log('  - Flat key (admin.navigation.dashboard):', flatKey)
      console.log('  - Nested key:', nestedKey)
      console.log('  - admin.navigation.data key:', enTranslations['admin.navigation.data'])
    }
  }

  staticInitialized = true
  
  // Build keys structure if not already built
  if (!staticKeys) {
    staticKeys = buildKeysStructure()
  }
}

/**
 * Build keys structure from available translation keys
 * Creates a nested object where each leaf contains the full key path as a string
 */
function buildKeysStructure(): any {
  const keys: any = {}
  
  // Get all keys from the first available locale (they should all have the same keys)
  const firstLocale = Object.keys(staticTranslations)[0]
  if (!firstLocale || !staticTranslations[firstLocale]) {
    return keys
  }
  
  const translations = staticTranslations[firstLocale]
  
  // If translations are in flat format (e.g., "auth.welcomeToTiko": "...")
  if (typeof translations === 'object') {
    for (const key in translations) {
      const parts = key.split('.')
      let current = keys
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        
        if (i === parts.length - 1) {
          // Leaf node - store the full key path
          current[part] = key
        } else {
          // Intermediate node - create object if it doesn't exist
          if (!current[part]) {
            current[part] = {}
          }
          current = current[part]
        }
      }
    }
  }
  
  return keys
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
   * Get translation keys structure
   * Returns the static keys object that provides autocomplete support
   */
  const keys = computed(() => {
    if (!staticKeys) {
      // Initialize if not done yet
      initializeStaticMode()
    }
    return staticKeys
  })

  // Debug information for Vue DevTools
  const debugInfo = computed(() => ({
    mode: 'static',
    currentLocale: currentLocale.value,
    availableLocales: staticAvailableLanguages,
    loadedTranslations: Object.keys(staticTranslations),
    totalKeys: Object.keys(staticTranslations[currentLocale.value] || {}).length,
    fallbackLocale,
    isReady: isReady.value,
    sampleKeys: Object.keys(staticTranslations[currentLocale.value] || {}).slice(0, 10),
    initialized: staticInitialized
  }))

  // Get all translations for current locale (for devtools inspection)
  const currentTranslations = computed(() => {
    return staticTranslations[currentLocale.value] || {}
  })

  // Get translation statistics
  const translationStats = computed(() => {
    const stats: Record<string, number> = {}
    for (const locale of staticAvailableLanguages) {
      stats[locale] = Object.keys(staticTranslations[locale] || {}).length
    }
    return stats
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
    _store: null,
    
    // Vue DevTools debugging
    __devtools: {
      debugInfo,
      currentTranslations,
      translationStats,
      staticTranslations: computed(() => staticTranslations),
      staticKeys: computed(() => staticKeys)
    }
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
    return getTranslationValue(fallbackTranslations, key)
  }

  const value = getTranslationValue(localeTranslations, key)
  
  // If not found and current locale is not fallback, try fallback
  if (!value && locale !== 'en') {
    const fallbackTranslations = staticTranslations['en']
    if (fallbackTranslations) {
      return getTranslationValue(fallbackTranslations, key)
    }
  }
  
  return value
}

/**
 * Get translation value from either flat or nested object structure
 */
function getTranslationValue(obj: any, path: string): string | null {
  // First check if it's a flat structure (key exists directly)
  if (obj[path] !== undefined) {
    return typeof obj[path] === 'string' ? obj[path] : null
  }
  
  // Otherwise try nested structure
  return getNestedValue(obj, path)
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
 * Deep merge two translation objects
 * Regional translations override base translations
 */
function mergeTranslations(base: any, regional: any): any {
  // Start with a deep copy of base
  const result = JSON.parse(JSON.stringify(base))
  
  // Apply regional overrides
  const applyOverrides = (target: any, source: any, path: string[] = []) => {
    for (const key in source) {
      const currentPath = [...path, key]
      
      if (typeof source[key] === 'object' && source[key] !== null) {
        // Ensure target has the nested structure
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {}
        }
        // Recursively apply overrides
        applyOverrides(target[key], source[key], currentPath)
      } else {
        // Apply the override (regional files now only contain actual overrides)
        target[key] = source[key]
      }
    }
  }
  
  applyOverrides(result, regional)
  return result
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
