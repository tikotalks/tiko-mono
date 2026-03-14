/**
 * Simplified i18n composable delegating to the JSON + vue-i18n runtime.
 * This replaces the previous Pinia store-backed i18n for apps using the new path.
 */

import { computed } from 'vue'
import { useI18nSimple as useI18nJson, setI18nLocale } from '../../i18n/vue-i18n'

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

function createI18nKeyProxy(path = ''): Record<string, any> {
  return new Proxy({}, {
    get(_target, prop: string | symbol) {
      if (prop === Symbol.toPrimitive) {
        return () => path
      }
      if (prop === 'toString' || prop === 'valueOf') {
        return () => path
      }
      if (typeof prop === 'symbol') {
        return undefined
      }

      const nextPath = path ? `${path}.${prop}` : prop
      return createI18nKeyProxy(nextPath)
    }
  })
}

/**
 * Main i18n composable
 */
export function useI18n(_options: I18nOptions = {}) {
  const i18n = useI18nJson()
  return {
    t: i18n.t,
    locale: i18n.locale,
    currentLocale: computed(() => i18n.locale.value),
    setLocale: setI18nLocale,
    availableLocales: computed(() => []),
    loading: computed(() => false),
    error: computed(() => null),
    isReady: computed(() => true),
    hasKey: (_key: string) => true,
    keys: computed(() => createI18nKeyProxy()),
    refreshTranslations: async () => {},
    _store: null,
    __devtools: { debugInfo: computed(() => ({ mode: 'vue-i18n' })), currentTranslations: computed(() => ({})), translationStats: computed(() => ({})), loadedTranslations: computed(() => ({})), keysCache: computed(() => ({})) }
  }
}

/**
 * Create a translation function with prefix
 */
export function createScopedT(prefix: string) {
  const i18n = useI18nJson()
  return (key: string, params?: TranslationParams | string) => i18n.t(`${prefix}.${key}`, params as any)
}

/**
 * Initialize i18n store directly (for use in main.ts)
 */
export async function initializeI18nStore(_options: I18nOptions = {}) {
  // no-op in JSON runtime
  return null as any
}
