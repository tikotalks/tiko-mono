/**
 * i18n composable that uses the centralized store
 *
 * This composable now delegates to the i18n store to avoid
 * multiple instance issues and ensure consistent state.
 */

import { computed } from 'vue'
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
 * Main i18n composable
 */
export function useI18n(options: I18nOptions = {}) {
  const store = useI18nStore()

  // // Initialize store immediately if not already initialized
  // // This ensures the store is ready when the composable is first used
  if (!store.isReady && !store.isLoading) {
    store.initialize(options)
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
 * Create a scoped translation function with prefix
 */
export function createScopedT(prefix: string) {
  const store = useI18nStore()

  return (key: string, params?: TranslationParams | string) => {
    const fullKey = `${prefix}.${key}`
    return store.t(fullKey, params)
  }
}

/**
 * Initialize i18n store directly (for use in main.ts)
 */
export async function initializeI18nStore(options: I18nOptions = {}) {
  const store = useI18nStore()
  await store.initialize(options)
  return store
}
