/**
 * Centralized i18n store
 *
 * This store manages all translation loading, caching, and state
 * to avoid multiple instance issues with the composable approach.
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import {
  loadLanguageWithBase as lazyLoadLanguageWithBase,
  getAvailableLanguages as lazyGetAvailableLanguages
} from '../i18n/lazy-loader'

// Types
interface TranslationParams {
  [key: string]: string | number
}

interface I18nOptions {
  fallbackLocale?: string
  persistLocale?: boolean
  storageKey?: string
  categories?: string[]
}

// Storage key for persistence
const LOCALE_STORAGE_KEY = 'tiko:locale'

export const useI18nStore = defineStore('i18n', () => {
  // Core state
  const loadedTranslations = ref<Record<string, any>>({})
  const isLoading = ref(false)
  const loadError = ref<string | null>(null)
  const currentLocale = ref<string>('en')
  const isReady = ref(false)
  const keysCache = ref<Record<string, any>>({})

  // Configuration
  const fallbackLocale = ref('en')
  const persistLocale = ref(true)
  const storageKey = ref(LOCALE_STORAGE_KEY)
  const categories = ref<string[]>([])

  // Track initialization
  let isInitialized = false

  /**
   * Build keys structure from loaded translations
   */
  function buildKeysStructure(translations: any): any {
    const keys: any = {}

    if (typeof translations === 'object') {
      for (const key in translations) {
        const parts = key.split('.')
        let current = keys

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i]

          if (i === parts.length - 1) {
            current[part] = key
          } else {
            if (!current[part] || typeof current[part] !== 'object') {
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
   * Get available languages
   */
  const availableLanguages = computed(() => {
    return lazyGetAvailableLanguages()
  })

  /**
   * Filter translations by categories
   */
  function filterTranslationsByCategories(translations: any, categoriesToInclude: string[]): any {
    // If no categories specified, return all translations
    if (!categoriesToInclude || categoriesToInclude.length === 0) {
      return translations
    }

    const filtered: any = {}
    
    // Filter translations to only include keys that start with specified categories
    for (const key in translations) {
      // Check if the key starts with any of the specified categories
      const shouldInclude = categoriesToInclude.some(category => {
        // Support wildcard patterns like "common.*"
        const pattern = category.endsWith('.*') ? category.slice(0, -2) : category
        return key.startsWith(pattern + '.')
      })
      
      if (shouldInclude) {
        filtered[key] = translations[key]
      }
    }
    
    return filtered
  }

  /**
   * Find the best regional variant for a base language
   */
  function findRegionalVariant(baseLocale: string): string | null {
    const available = availableLanguages.value

    // First try the doubled format (e.g., nl -> nl-NL, de -> de-DE)
    const doubledLocale = `${baseLocale}-${baseLocale.toUpperCase()}`
    if (available.includes(doubledLocale)) {
      return doubledLocale
    }

    // If that doesn't exist, find the first variant that starts with the base locale
    const variants = available.filter(lang =>
      lang.startsWith(`${baseLocale}-`)
    )

    if (variants.length > 0) {
      return variants[0]
    }

    return null
  }

  /**
   * Load a locale and update the cache
   */
  async function loadLocale(locale: string): Promise<boolean> {
    console.log(`[i18n-store] Loading locale: ${locale}`)

    // Check if locale is available
    if (!availableLanguages.value.includes(locale)) {
      console.warn(`[i18n-store] Locale not available: ${locale}`)
      return false
    }

    isLoading.value = true
    loadError.value = null

    try {
      // Load language with base merging
      const translations = await lazyLoadLanguageWithBase(locale)

      if (translations) {
        // Filter translations by categories if specified
        const filteredTranslations = filterTranslationsByCategories(translations, categories.value)
        
        loadedTranslations.value[locale] = filteredTranslations
        keysCache.value[locale] = buildKeysStructure(filteredTranslations)
        console.log(`[i18n-store] Successfully loaded locale: ${locale} with ${Object.keys(filteredTranslations).length} keys (filtered from ${Object.keys(translations).length} total)`)
        return true
      } else {
        console.error(`[i18n-store] loadLanguageWithBase returned null/undefined for ${locale}`)
        loadError.value = `Failed to load locale: ${locale}`
        return false
      }
    } catch (error) {
      console.error(`[i18n-store] Error loading locale ${locale}:`, error)
      loadError.value = error instanceof Error ? error.message : String(error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Initialize locale on first use
   */
  async function initialize(options: I18nOptions = {}): Promise<void> {
    if (isInitialized) return

    console.log(`[i18n-store] Initializing with options:`, options)
    isInitialized = true

    // Set configuration
    fallbackLocale.value = options.fallbackLocale || 'en'
    persistLocale.value = options.persistLocale !== false
    storageKey.value = options.storageKey || LOCALE_STORAGE_KEY
    categories.value = options.categories || []

    // Initialize locale from storage or browser
    let initialLocale = 'en'

    if (persistLocale.value && typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(storageKey.value)

      if (stored && availableLanguages.value.includes(stored)) {
        initialLocale = stored
      } else {
        const browserLocale = getBrowserLocale()
        if (browserLocale) {
          initialLocale = browserLocale
        }
      }
    }

    console.log(`[i18n-store] Initializing with locale: ${initialLocale}`)

    // Load initial locale
    await loadLocale(initialLocale)

    // Also load fallback locale if different
    if (initialLocale !== fallbackLocale.value) {
      console.log(`[i18n-store] Loading fallback locale: ${fallbackLocale.value}`)
      await loadLocale(fallbackLocale.value)
    }

    currentLocale.value = initialLocale
    isReady.value = true

    console.log(`[i18n-store] Initialization complete. Current locale: ${currentLocale.value}`)
  }

  /**
   * Set current locale
   */
  async function setLocale(locale: string): Promise<void> {
    console.log(`[i18n-store] Setting locale to: ${locale}`)

    let localeToUse = locale

    // If locale is a base language without region, find best regional variant
    if (!locale.includes('-')) {
      const regionalVariant = findRegionalVariant(locale)
      if (regionalVariant) {
        localeToUse = regionalVariant
        console.log(`[i18n-store] Converting base locale "${locale}" to regional "${localeToUse}"`)
      }
    }

    // Check if locale exists
    if (!availableLanguages.value.includes(localeToUse)) {
      console.warn(`[i18n-store] Invalid locale "${localeToUse}". Available locales:`, availableLanguages.value)
      return
    }

    // Force reload by removing from loadedTranslations first
    delete loadedTranslations.value[localeToUse]
    delete keysCache.value[localeToUse]
    console.log(`[i18n-store] Removed ${localeToUse} from cache`)

    // Always force load the locale
    const success = await loadLocale(localeToUse)
    if (success) {
      currentLocale.value = localeToUse

      // Persist to localStorage
      if (persistLocale.value && typeof localStorage !== 'undefined') {
        localStorage.setItem(storageKey.value, localeToUse)
      }

      console.log(`[i18n-store] Locale set to: ${localeToUse}`)
      console.log(`[i18n-store] Loaded translations:`, Object.keys(loadedTranslations.value))
    } else {
      console.error(`[i18n-store] Failed to load locale: ${localeToUse}`)
    }
  }

  /**
   * Get translation from loaded translations
   */
  function getTranslation(key: string): string | null {
    // Try exact locale match first
    const localeTranslations = loadedTranslations.value[currentLocale.value]
    if (localeTranslations) {
      const value = getTranslationValue(localeTranslations, key)
      if (value) return value
    }

    // If not found and locale has a region (e.g., de-DE), try base language (e.g., de)
    if (currentLocale.value.includes('-')) {
      const baseLocale = currentLocale.value.split('-')[0]
      const baseTranslations = loadedTranslations.value[baseLocale]
      if (baseTranslations) {
        const value = getTranslationValue(baseTranslations, key)
        if (value) return value
      }
    }

    // Finally, fall back to fallback locale (usually English)
    if (currentLocale.value !== fallbackLocale.value) {
      const fallbackTranslations = loadedTranslations.value[fallbackLocale.value]
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
    if (availableLanguages.value.includes(browserLocale)) {
      return browserLocale
    }

    // Try language without region (e.g., 'en-US' -> 'en')
    const languageCode = browserLocale.split('-')[0]
    if (availableLanguages.value.includes(languageCode)) {
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
   * Translation function
   */
  function t(key: string | any, params?: Record<string, any> | string): string {
    // Ensure key is a string
    const keyStr = typeof key === 'string' ? key : String(key)

    // Get translation
    const translation = getTranslation(keyStr)
    if (!translation) {
      console.warn(`[i18n-store] Translation missing for key "${keyStr}" in locale "${currentLocale.value}"`)
      console.warn(`[i18n-store] Available locales:`, Object.keys(loadedTranslations.value))
      const currentTranslations = loadedTranslations.value[currentLocale.value] || {}
      console.warn(`[i18n-store] Loaded translations for ${currentLocale.value}:`, Object.keys(currentTranslations).length, 'keys')

      // Debug specific key lookup
      if (keyStr.startsWith('yesno.') || keyStr.startsWith('common.')) {
        console.warn(`[i18n-store] Looking for "${keyStr}" in translations:`, currentTranslations[keyStr])
        console.warn(`[i18n-store] Sample keys:`, Object.keys(currentTranslations).filter(k => k.startsWith(keyStr.split('.')[0])).slice(0, 5))
      }

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
  }

  /**
   * Check if a key exists
   */
  function hasKey(key: string): boolean {
    return !!getTranslation(key)
  }

  /**
   * Get translation keys structure for autocomplete
   */
  const keys = computed(() => {
    const locale = currentLocale.value
    const actualKeys = keysCache.value[locale] || {}

    if (Object.keys(actualKeys).length > 0) {
      return actualKeys
    }

    // Return a proxy that safely handles undefined access
    return new Proxy({}, {
      get(target, prop) {
        return new Proxy({}, {
          get(target2, prop2) {
            return `${String(prop)}.${String(prop2)}`
          }
        })
      }
    })
  })

  // Debug information
  const debugInfo = computed(() => ({
    mode: 'store',
    currentLocale: currentLocale.value,
    availableLocales: availableLanguages.value,
    loadedTranslations: Object.keys(loadedTranslations.value),
    totalKeys: Object.keys(loadedTranslations.value[currentLocale.value] || {}).length,
    fallbackLocale: fallbackLocale.value,
    isReady: isReady.value,
    isLoading: isLoading.value,
    loadError: loadError.value
  }))

  // Watch for storage changes
  if (typeof window !== 'undefined') {
    watch(currentLocale, (newLocale) => {
      if (persistLocale.value) {
        localStorage.setItem(storageKey.value, newLocale)
      }
    })
  }

  return {
    // State
    currentLocale: computed(() => currentLocale.value),
    availableLanguages,
    isReady: computed(() => isReady.value),
    isLoading: computed(() => isLoading.value),
    loadError: computed(() => loadError.value),
    keys,

    // Actions
    initialize,
    setLocale,
    t,
    hasKey,
    loadLocale,

    // Debug
    debugInfo,
    loadedTranslations: computed(() => loadedTranslations.value),

    // For backward compatibility
    locale: computed(() => currentLocale.value),
    loading: computed(() => isLoading.value),
    error: loadError,
    refreshTranslations: () => Promise.resolve(),
    _store: null
  }
})
