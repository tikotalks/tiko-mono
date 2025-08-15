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

// IMPORTANT: Global locale state to ensure all components use the same locale
let globalCurrentLocale: string | null = null

// Storage key for persistence
const LOCALE_STORAGE_KEY = 'tiko:locale'

// Initialize static translations
function initializeStaticMode(): void {
  if (staticInitialized) return

  // Merge regional translations with base languages
  console.log('🌍 Merging regional translations with base languages...')
  
  // Get all language codes
  const allLocales = Object.keys(staticTranslations)
  
  // Process each locale
  for (const locale of allLocales) {
    // Skip if it's a base language (no hyphen)
    if (!locale.includes('-')) continue
    
    // Get base language (e.g., 'de' from 'de-DE')
    const baseLocale = locale.split('-')[0]
    
    // If base language exists, merge it with regional
    if (staticTranslations[baseLocale]) {
      console.log(`📚 Merging ${baseLocale} into ${locale}`)
      const baseTranslations = staticTranslations[baseLocale]
      const regionalTranslations = staticTranslations[locale]
      
      // Create merged translations (base + regional overrides)
      staticTranslations[locale] = {
        ...baseTranslations,
        ...regionalTranslations
      }
      
      console.log(`  - Base ${baseLocale} has ${Object.keys(baseTranslations).length} keys`)
      console.log(`  - Regional ${locale} has ${Object.keys(regionalTranslations).length} overrides`)
      console.log(`  - Merged ${locale} now has ${Object.keys(staticTranslations[locale]).length} keys`)
    }
  }

  // Translations are already loaded via static import
  console.log('🌍 Static translation mode initialized')
  console.log('📚 Available languages:', staticAvailableLanguages)
  console.log('📚 Loaded translations for locales:', Object.keys(staticTranslations))

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

  // Function to find the best regional variant for a base language
  const findRegionalVariant = (baseLocale: string): string | null => {
    // First try the doubled format (e.g., nl -> nl-NL, de -> de-DE)
    const doubledLocale = `${baseLocale}-${baseLocale.toUpperCase()}`
    if (staticAvailableLanguages.includes(doubledLocale)) {
      return doubledLocale
    }
    
    // If that doesn't exist, find the first variant that starts with the base locale
    const variants = staticAvailableLanguages.filter(lang => 
      lang.startsWith(`${baseLocale}-`)
    )
    
    if (variants.length > 0) {
      return variants[0]
    }
    
    return null
  }

  // Initialize locale from storage or browser
  if (persistLocale && typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(storageKey)
    console.log('[useI18n] Initializing locale:')
    console.log('  - Storage key:', storageKey)
    console.log('  - Stored value:', stored)
    console.log('  - Available languages:', staticAvailableLanguages)
    
    let localeToUse = stored
    
    // If stored locale is a base language without region, find best regional variant
    if (stored && !stored.includes('-')) {
      const regionalVariant = findRegionalVariant(stored)
      if (regionalVariant) {
        localeToUse = regionalVariant
        console.log(`  - Converting base locale "${stored}" to regional "${localeToUse}"`)
      }
    }
    
    if (localeToUse && staticAvailableLanguages.includes(localeToUse)) {
      console.log('  - Setting locale:', localeToUse)
      currentLocale.value = localeToUse
    } else {
      const browserLocale = getBrowserLocale()
      console.log('  - Browser locale:', browserLocale)
      if (browserLocale) {
        console.log('  - Setting locale from browser:', browserLocale)
        currentLocale.value = browserLocale
      }
    }
    console.log('  - Final locale:', currentLocale.value)
  }

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
          
          if (newLocale && staticAvailableLanguages.includes(newLocale) && newLocale !== currentLocale.value) {
            console.log(`[i18n] External locale change detected: ${currentLocale.value} -> ${newLocale}`)
            currentLocale.value = newLocale
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
        
        if (newLocale && staticAvailableLanguages.includes(newLocale) && newLocale !== currentLocale.value) {
          console.log(`[i18n] Custom locale change detected: ${currentLocale.value} -> ${newLocale}`)
          currentLocale.value = newLocale
        }
      }
      
      // Check for changes periodically as fallback
      let pollInterval: NodeJS.Timeout | null = null
      const pollForChanges = () => {
        const stored = localStorage.getItem(storageKey)
        if (stored && staticAvailableLanguages.includes(stored) && stored !== currentLocale.value) {
          console.log(`[i18n] Polling detected locale change: ${currentLocale.value} -> ${stored}`)
          currentLocale.value = stored
        }
      }
      
      window.addEventListener('storage', handleStorageChange)
      window.addEventListener('tiko-locale-change', handleCustomLocaleChange as EventListener)
      
      // Poll every 1 second as fallback
      pollInterval = setInterval(pollForChanges, 1000)
      
      // Cleanup function would go here if we were in a component with onUnmounted
      // But this is a composable that can be called multiple times
    }
  }

  /**
   * Translation function
   */
  const t: any = (key: string | any, params?: Record<string, any> | string): string => {
    // Ensure key is a string
    const keyStr = typeof key === 'string' ? key : String(key);

    // Debug first few translations
    if (!t._debugged || keyStr.includes('cards') || keyStr.includes('common')) {
      console.log(`[t] Translating "${keyStr}" for locale "${currentLocale.value}"`)
      if (!t._debugged) {
        console.log(`[t] staticTranslations keys:`, Object.keys(staticTranslations))
        console.log(`[t] Does locale "${currentLocale.value}" exist in translations?`, !!staticTranslations[currentLocale.value])
        t._debugged = true
      }
    }

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
    if (!staticAvailableLanguages.includes(localeToUse)) {
      console.warn(`Invalid locale "${localeToUse}". Available locales:`, staticAvailableLanguages)
      return
    }
    
    console.log(`[setLocale] Setting currentLocale to "${localeToUse}"`)
    currentLocale.value = localeToUse
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
  // Log only the first translation attempt to see what's happening
  if (!getStaticTranslation._logged) {
    console.log(`[getStaticTranslation] First translation attempt:`)
    console.log(`  - Key: "${key}"`)
    console.log(`  - Locale: "${locale}"`)
    console.log(`  - Available locales:`, Object.keys(staticTranslations))
    console.log(`  - Locale exists?`, !!staticTranslations[locale])
    getStaticTranslation._logged = true
  }
  
  // Try exact locale match first
  const localeTranslations = staticTranslations[locale]
  if (localeTranslations) {
    const value = getTranslationValue(localeTranslations, key)
    if (value) return value
  }
  
  // If not found and locale has a region (e.g., de-DE), try base language (e.g., de)
  if (locale.includes('-')) {
    const baseLocale = locale.split('-')[0]
    const baseTranslations = staticTranslations[baseLocale]
    if (baseTranslations) {
      const value = getTranslationValue(baseTranslations, key)
      if (value) return value
    }
  }
  
  // Finally, fall back to English
  const fallbackTranslations = staticTranslations['en']
  if (fallbackTranslations) {
    return getTranslationValue(fallbackTranslations, key)
  }
  
  return null
}
getStaticTranslation._logged = false

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
