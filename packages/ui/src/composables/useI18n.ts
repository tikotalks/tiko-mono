/**
 * Lazy-loading i18n composable
 * 
 * This composable uses lazy-loaded translation files for optimal
 * performance and bundle size. Languages are loaded on demand.
 * 
 * Features:
 * - Lazy loading of language files
 * - Automatic base/regional language merging
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
import { loadLanguageWithBase, getAvailableLanguages, preloadLanguage } from '../i18n/lazy-loader';
import type { Translations } from '../i18n/generated/types';

// Types
interface TranslationParams {
  [key: string]: string | number
}

interface I18nOptions {
  fallbackLocale?: string
  persistLocale?: boolean
  storageKey?: string
}

// Global state for loaded translations
const loadedTranslations = ref<Record<string, Translations>>({})
const isLoading = ref(false)
const loadError = ref<string | null>(null)
const keysCache = ref<Record<string, any>>({})

// Storage key for persistence
const LOCALE_STORAGE_KEY = 'tiko:locale'

// Shared state - this is the actual reactive state shared by all instances
const sharedCurrentLocale = ref<string>('en')
const sharedIsReady = ref(false)

// Track initialization
let isInitialized = false

/**
 * Build keys structure from loaded translations
 * Creates a nested object where each leaf contains the full key path as a string
 */
function buildKeysStructure(translations: Translations): any {
  const keys: any = {}
  
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
 * Initialize locale on first use
 */
async function initializeLocale(options: I18nOptions): Promise<void> {
  if (isInitialized) return
  
  isInitialized = true
  const { persistLocale = true, storageKey = LOCALE_STORAGE_KEY, fallbackLocale = 'en' } = options
  
  // Get available languages
  const availableLanguages = getAvailableLanguages()
  
  // Initialize locale from storage or browser
  let initialLocale = 'en'
  
  if (persistLocale && typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(storageKey)
    
    if (stored && availableLanguages.includes(stored)) {
      initialLocale = stored
    } else {
      const browserLocale = getBrowserLocale()
      if (browserLocale) {
        initialLocale = browserLocale
      }
    }
  }
  
  // Load initial locale
  console.log(`[i18n] Initializing with locale: ${initialLocale}`)
  await loadLocale(initialLocale)
  
  // Also load fallback locale if different
  if (initialLocale !== fallbackLocale) {
    console.log(`[i18n] Loading fallback locale: ${fallbackLocale}`)
    await loadLocale(fallbackLocale)
  }
  
  sharedCurrentLocale.value = initialLocale
  sharedIsReady.value = true
}

/**
 * Load a locale and update the cache
 */
async function loadLocale(locale: string): Promise<boolean> {
  // Check if already loaded
  if (loadedTranslations.value[locale]) {
    console.log(`[i18n] Locale already loaded: ${locale}`)
    return true
  }
  
  // Check if locale is available
  const availableLanguages = getAvailableLanguages()
  if (!availableLanguages.includes(locale)) {
    console.warn(`[i18n] Locale not available: ${locale}`)
    return false
  }
  
  isLoading.value = true
  loadError.value = null
  
  try {
    // Load language with base merging
    const translations = await loadLanguageWithBase(locale)
    
    if (translations) {
      loadedTranslations.value[locale] = translations
      keysCache.value[locale] = buildKeysStructure(translations)
      console.log(`[i18n] Successfully loaded locale: ${locale}`)
      return true
    } else {
      loadError.value = `Failed to load locale: ${locale}`
      return false
    }
  } catch (error) {
    console.error(`[i18n] Error loading locale ${locale}:`, error)
    loadError.value = error instanceof Error ? error.message : String(error)
    return false
  } finally {
    isLoading.value = false
  }
}

/**
 * Find the best regional variant for a base language
 */
function findRegionalVariant(baseLocale: string): string | null {
  const availableLanguages = getAvailableLanguages()
  
  // First try the doubled format (e.g., nl -> nl-NL, de -> de-DE)
  const doubledLocale = `${baseLocale}-${baseLocale.toUpperCase()}`
  if (availableLanguages.includes(doubledLocale)) {
    return doubledLocale
  }
  
  // If that doesn't exist, find the first variant that starts with the base locale
  const variants = availableLanguages.filter(lang => 
    lang.startsWith(`${baseLocale}-`)
  )
  
  if (variants.length > 0) {
    return variants[0]
  }
  
  return null
}

/**
 * Create i18n instance (internal function)
 */
function createI18nInstance(options: I18nOptions = {}) {
  const {
    fallbackLocale = 'en',
    persistLocale = true,
    storageKey = LOCALE_STORAGE_KEY
  } = options

  // Initialize on first use
  if (!isInitialized) {
    initializeLocale(options)
  }

  // Use shared state
  const currentLocale = sharedCurrentLocale
  const isReady = sharedIsReady

  // Watch for locale changes and persist
  if (persistLocale) {
    watch(currentLocale, (newLocale) => {
      localStorage.setItem(storageKey, newLocale)
    })
    
    // Listen for external storage changes and custom events
    if (typeof window !== 'undefined') {
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === storageKey && event.newValue) {
          let newLocale = event.newValue
          
          // If locale is a base language without region, find best regional variant
          if (newLocale && !newLocale.includes('-')) {
            const regionalVariant = findRegionalVariant(newLocale)
            if (regionalVariant) {
              newLocale = regionalVariant
            }
          }
          
          const availableLanguages = getAvailableLanguages()
          if (newLocale && availableLanguages.includes(newLocale) && newLocale !== currentLocale.value) {
            console.log(`[i18n] External locale change detected: ${currentLocale.value} -> ${newLocale}`)
            loadLocale(newLocale).then(success => {
              if (success) {
                currentLocale.value = newLocale
              }
            })
          }
        }
      }
      
      const handleCustomLocaleChange = (event: CustomEvent) => {
        let newLocale = event.detail.locale
        
        // If locale is a base language without region, find best regional variant
        if (newLocale && !newLocale.includes('-')) {
          const regionalVariant = findRegionalVariant(newLocale)
          if (regionalVariant) {
            newLocale = regionalVariant
          }
        }
        
        const availableLanguages = getAvailableLanguages()
        if (newLocale && availableLanguages.includes(newLocale) && newLocale !== currentLocale.value) {
          console.log(`[i18n] Custom locale change detected: ${currentLocale.value} -> ${newLocale}`)
          loadLocale(newLocale).then(success => {
            if (success) {
              currentLocale.value = newLocale
            }
          })
        }
      }
      
      window.addEventListener('storage', handleStorageChange)
      window.addEventListener('tiko-locale-change', handleCustomLocaleChange as EventListener)
    }
  }

  /**
   * Translation function
   */
  const t: any = (key: string | any, params?: Record<string, any> | string): string => {
    // Ensure key is a string
    const keyStr = typeof key === 'string' ? key : String(key);

    // Get translation
    const translation = getTranslation(keyStr, currentLocale.value, fallbackLocale)
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
  const setLocale = async (locale: string): Promise<void> => {
    console.log(`[setLocale] Attempting to set locale to "${locale}"`)
    
    let localeToUse = locale
    
    // If locale is a base language without region, find best regional variant
    if (!locale.includes('-')) {
      const regionalVariant = findRegionalVariant(locale)
      if (regionalVariant) {
        localeToUse = regionalVariant
        console.log(`[setLocale] Converting base locale "${locale}" to regional "${localeToUse}"`)
      }
    }
    
    // Check if locale exists
    const availableLanguages = getAvailableLanguages()
    if (!availableLanguages.includes(localeToUse)) {
      console.warn(`Invalid locale "${localeToUse}". Available locales:`, availableLanguages)
      return
    }
    
    // Load the locale if not already loaded
    const success = await loadLocale(localeToUse)
    if (success) {
      console.log(`[setLocale] Setting currentLocale to "${localeToUse}"`)
      currentLocale.value = localeToUse
    } else {
      console.error(`[setLocale] Failed to load locale "${localeToUse}"`)
    }
  }

  /**
   * Get available locales
   */
  const availableLocales = computed(() => {
    return getAvailableLanguages()
  })

  /**
   * Check if a key exists
   */
  const hasKey = (key: string): boolean => {
    return !!getTranslation(key, currentLocale.value, fallbackLocale)
  }

  /**
   * Get translation keys structure
   * Returns the keys object that provides autocomplete support
   */
  const keys = computed(() => {
    const locale = currentLocale.value
    // Return a proxy that provides safe navigation for undefined keys
    const actualKeys = keysCache.value[locale] || {}
    
    // If we have actual keys, return them
    if (Object.keys(actualKeys).length > 0) {
      return actualKeys
    }
    
    // Otherwise return a proxy that safely handles undefined access
    return new Proxy({}, {
      get(target, prop) {
        // Return another proxy for nested access
        return new Proxy({}, {
          get(target2, prop2) {
            // Return the key string for leaf nodes
            return `${String(prop)}.${String(prop2)}`
          }
        })
      }
    })
  })

  // Debug information for Vue DevTools
  const debugInfo = computed(() => ({
    mode: 'lazy',
    currentLocale: currentLocale.value,
    availableLocales: getAvailableLanguages(),
    loadedTranslations: Object.keys(loadedTranslations.value),
    totalKeys: Object.keys(loadedTranslations.value[currentLocale.value] || {}).length,
    fallbackLocale,
    isReady: isReady.value,
    isLoading: isLoading.value,
    loadError: loadError.value
  }))

  // Get all translations for current locale (for devtools inspection)
  const currentTranslations = computed(() => {
    return loadedTranslations.value[currentLocale.value] || {}
  })

  // Get translation statistics
  const translationStats = computed(() => {
    const stats: Record<string, number> = {}
    for (const locale of Object.keys(loadedTranslations.value)) {
      stats[locale] = Object.keys(loadedTranslations.value[locale] || {}).length
    }
    return stats
  })

  return {
    t,
    locale: currentLocale,
    currentLocale: computed(() => currentLocale.value),
    setLocale,
    availableLocales,
    loading: computed(() => isLoading.value),
    error: loadError,
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
      loadedTranslations: computed(() => loadedTranslations.value),
      keysCache: computed(() => keysCache.value)
    }
  };
}

/**
 * Get translation from loaded translations
 */
function getTranslation(key: string, locale: string, fallbackLocale: string): string | null {
  // Try exact locale match first
  const localeTranslations = loadedTranslations.value[locale]
  if (localeTranslations) {
    const value = getTranslationValue(localeTranslations, key)
    if (value) return value
  }
  
  // If not found and locale has a region (e.g., de-DE), try base language (e.g., de)
  if (locale.includes('-')) {
    const baseLocale = locale.split('-')[0]
    const baseTranslations = loadedTranslations.value[baseLocale]
    if (baseTranslations) {
      const value = getTranslationValue(baseTranslations, key)
      if (value) return value
    }
  }
  
  // Finally, fall back to fallback locale (usually English)
  if (locale !== fallbackLocale) {
    const fallbackTranslations = loadedTranslations.value[fallbackLocale]
    if (fallbackTranslations) {
      return getTranslationValue(fallbackTranslations, key)
    }
  }
  
  return null
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
 * Get browser locale with fallback
 */
function getBrowserLocale(): string | null {
  if (typeof navigator === 'undefined') return null

  const browserLocale = navigator.language || (navigator as any).userLanguage
  if (!browserLocale) return null

  // Try exact match first in available languages
  const availableLanguages = getAvailableLanguages()
  
  if (availableLanguages.includes(browserLocale)) {
    return browserLocale
  }

  // Try language without region (e.g., 'en-US' -> 'en')
  const languageCode = browserLocale.split('-')[0]
  if (availableLanguages.includes(languageCode)) {
    return languageCode
  }

  // Try to find a regional variant
  const regionalVariant = findRegionalVariant(languageCode)
  if (regionalVariant) {
    return regionalVariant
  }

  return null
}

/**
 * Lazy-loading i18n composable
 */
export function useI18n(options: I18nOptions = {}) {
  return createI18nInstance(options)
}

/**
 * Cleanup global state (useful for testing)
 */
export function cleanupI18n() {
  // Reset shared state
  sharedCurrentLocale.value = 'en'
  sharedIsReady.value = false
  isInitialized = false
  loadedTranslations.value = {}
  keysCache.value = {}
  isLoading.value = false
  loadError.value = null
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