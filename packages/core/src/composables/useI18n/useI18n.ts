/**
 * i18n composable that uses the centralized store
 *
 * This composable now delegates to the i18n store to avoid
 * multiple instance issues and ensure consistent state.
 */

import { computed, ref } from 'vue'
import { useI18nStore } from '../../stores/i18n'

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

/**
 * Fallback i18n implementation when Pinia is not ready
 */
function createFallbackI18n(options: I18nOptions) {
  console.warn('[i18n] Using fallback i18n implementation - will try to reconnect when Pinia is ready')

  const locale = ref(options.fallbackLocale || 'en')
  const loading = ref(false)
  const error = ref(null)
  const isReady = ref(false)

  // Try to reconnect to the store periodically
  let reconnectAttempts = 0
  const maxReconnectAttempts = 5

  const tryReconnect = () => {
    if (reconnectAttempts >= maxReconnectAttempts) return

    reconnectAttempts++
    setTimeout(() => {
      try {
        const store = useI18nStore()
        console.log('[i18n] Successfully reconnected to store after', reconnectAttempts, 'attempts')
        // Store is now available, but we keep using the fallback for this instance
        // New calls to useI18n will get the real store
      } catch (error) {
        console.warn('[i18n] Reconnection attempt', reconnectAttempts, 'failed, will retry')
        tryReconnect()
      }
    }, 100 * reconnectAttempts) // Exponential backoff
  }

  // Start reconnection attempts
  tryReconnect()

  return {
    t: (key: string, params?: TranslationParams | string) => {
      // Return the key as fallback when store is not available
      return typeof key === 'string' ? key : String(key)
    },
    locale,
    currentLocale: computed(() => locale.value),
    setLocale: async (newLocale: string) => {
      locale.value = newLocale
    },
    availableLocales: computed(() => ['en']),
    loading,
    error,
    isReady,
    hasKey: () => false,
    keys: computed(() => ({})),
    refreshTranslations: () => Promise.resolve(),
    _store: null,
    __devtools: {
      debugInfo: computed(() => ({ mode: 'fallback' })),
      currentTranslations: computed(() => ({})),
      translationStats: computed(() => ({ mode: 'fallback' })),
      loadedTranslations: computed(() => ({})),
      keysCache: computed(() => ({}))
    }
  }
}

/**
 * Main i18n composable
 */
export function useI18n(options: I18nOptions = {}) {
  // Lazy store access with error handling
  const store = (() => {
    try {
      return useI18nStore()
    } catch (error) {
      console.warn('[useI18n] Pinia not available during setup, will retry when needed')
      return null
    }
  })()

  // If store is not available, return fallback
  if (!store) {
    return createFallbackI18n(options)
  }

  // Initialize store asynchronously to avoid blocking setup
  if (!store.isReady && !store.isLoading) {
    // Defer initialization to next tick to ensure Vue context is ready
    Promise.resolve().then(() => {
      store.initialize(options)
    })
  }


  return {
    t: store.t,
    locale: store.locale,
    currentLocale: computed(()=>store.currentLocale),
    setLocale: store.setLocale,
    availableLocales: store.availableLanguages,
    loading: store.loading,
    error: store.error,
    isReady: store.isReady,
    hasKey: store.hasKey,
    keys: store.keys,

    // For backwards compatibility
    refreshTranslations: store.refreshTranslations,
    _store: store._store,

    // Vue DevTools debugging
    __devtools: {
      debugInfo: store.debugInfo,
      currentTranslations: store.loadedTranslations,
      translationStats: store.debugInfo,
      loadedTranslations: store.loadedTranslations,
      keysCache: store.keys
    }
  }
}

/**
 * Create a translation function with prefix
 */
export function createScopedT(prefix: string) {
  let store: ReturnType<typeof useI18nStore>

  try {
    store = useI18nStore()
  } catch (error) {
    console.warn('[createScopedT] Pinia not ready, using fallback')
    return (key: string, params?: TranslationParams | string) => {
      return `${prefix}.${key}`
    }
  }

  return (key: string, params?: TranslationParams | string) => {
    const fullKey = `${prefix}.${key}`
    return store.t(fullKey, params)
  }
}

/**
 * Initialize i18n store directly (for use in main.ts)
 */
export async function initializeI18nStore(options: I18nOptions = {}) {
  try {
    const store = useI18nStore()
    await store.initialize(options)
    return store
  } catch (error) {
    console.error('[initializeI18nStore] Failed to initialize i18n store:', error)
    throw error
  }
}
