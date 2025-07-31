import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useI18nDatabaseService, logger } from '@tiko/core'
import { useLocalStorage } from '../composables/useLocalStorage'

export interface I18nState {
  currentLocale: string
  translations: Record<string, Record<string, string>>
  loadedLocales: Set<string>
  loading: boolean
  error: string | null
}

export const useI18nStore = defineStore('i18n', () => {
  // State
  const [persistedLocale, setPersistedLocale] = useLocalStorage<string>('tiko-language', 'en-GB')
  console.log('[I18n Store] Initialized with locale from localStorage:', persistedLocale.value, typeof persistedLocale.value)
  const currentLocale = ref(persistedLocale.value)
  const translations = ref<Record<string, Record<string, string>>>({})
  const loadedLocales = ref(new Set<string>())
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Services
  const translationService = useI18nDatabaseService()

  // Debug: Log initial locale
  // logger.info('i18n-store', `Initial locale from storage: "${persistedLocale.value}"`)
  // logger.info('i18n-store', `Current locale ref: "${currentLocale.value}"`)

  // Getters
  const currentTranslations = computed(() => {
    const result = translations.value[currentLocale.value] || {}
    logger.debug('i18n-store', `currentTranslations getter called - locale: ${currentLocale.value}, translations available: ${Object.keys(result).length}`)
    return result
  })

  const translationStats = computed(() => {
    const stats: Record<string, number> = {}
    Object.entries(translations.value).forEach(([locale, trans]) => {
      stats[locale] = Object.keys(trans).length
    })
    return stats
  })

  const isLocaleLoaded = computed(() => (locale: string) => {
    return loadedLocales.value.has(locale)
  })

  // Actions
  async function loadLocaleTranslations(locale: string, force = false): Promise<void> {
    // Skip if already loaded and not forcing
    if (!force && loadedLocales.value.has(locale)) {
      // logger.debug('i18n-store', `Locale ${locale} already loaded, skipping`)
      return
    }

    try {
      loading.value = true
      error.value = null

      // logger.info('i18n-store', `Loading translations for locale: ${locale}`)

      // Get translations from database (handles base + specific locale merging)
      const localeTranslations = await translationService.getTranslationsForLanguage(locale)

      // logger.info('i18n-store', `Loaded ${Object.keys(localeTranslations).length} translations for ${locale}`)

      // Debug: Check if common.dashboard exists
      if (localeTranslations['common.dashboard']) {
        // logger.info('i18n-store', `Found common.dashboard: "${localeTranslations['common.dashboard']}"`)
      } else {
        // logger.warning('i18n-store', `common.dashboard NOT found in loaded translations`)
        // Log first 10 keys to see what we have
        const firstKeys = Object.keys(localeTranslations).slice(0, 10)
        // logger.info('i18n-store', `First 10 keys:`, firstKeys)

        // Also log all keys to understand what we have
        // logger.info('i18n-store', `All ${Object.keys(localeTranslations).length} keys:`, Object.keys(localeTranslations))
      }

      // Update store
      translations.value[locale] = localeTranslations
      loadedLocales.value.add(locale)

      // Debug: Log what we're storing
      // logger.info('i18n-store', `Stored translations for locale "${locale}" with ${Object.keys(localeTranslations).length} keys`)
      // logger.info('i18n-store', `Current locales in store: ${Object.keys(translations.value).join(', ')}`)

      // Log sample for debugging
      const sampleKeys = Object.keys(localeTranslations).filter(k => k.includes('admin.i18n')).slice(0, 3)
      if (sampleKeys.length > 0) {
        // logger.debug('i18n-store', `Sample translations:`, sampleKeys.map(k => `${k}: "${localeTranslations[k]}"`))
      }

    } catch (err) {
      error.value = `Failed to load translations for ${locale}: ${err instanceof Error ? err.message : String(err)}`
      // logger.error('i18n-store', error.value)

      // Set empty object to prevent repeated attempts
      translations.value[locale] = {}
    } finally {
      loading.value = false
    }
  }

  function translate(key: string, params?: Record<string, any>): string {
    const translation = currentTranslations.value[key]

    if (!translation) {
      // Try base locale if current is regional
      if (currentLocale.value.includes('-')) {
        const baseLocale = currentLocale.value.split('-')[0]
        const baseTranslations = translations.value[baseLocale] || {}
        const baseTranslation = baseTranslations[key]

        if (baseTranslation) {
          // logger.debug('[i18n] Found in base locale', { key, baseLocale, translation: baseTranslation })
          return interpolate(baseTranslation, params)
        }
      }

      // Return key as fallback
      // logger.debug('[i18n] Key not found, returning key', { key })
      return key
    }

    return interpolate(translation, params)
  }

  function interpolate(text: string, params?: Record<string, any>): string {
    if (!params) return text

    return text.replace(/{(\w+)}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match
    })
  }

  async function setLocale(locale: string): Promise<void> {
    console.log('[I18n Store] setLocale called with:', locale, typeof locale)

    // Update current locale
    currentLocale.value = locale
    console.log('[I18n Store] About to call setPersistedLocale with:', locale)
    setPersistedLocale(locale)

    // Verify what was stored
    const stored = localStorage.getItem('tiko-language')
    console.log('[I18n Store] After setPersistedLocale, localStorage contains:', stored)

    // Force reload translations to ensure we have the latest
    await loadLocaleTranslations(locale, true)
  }

  async function refreshTranslations(): Promise<void> {
    // logger.info('i18n-store', 'Refreshing all loaded translations...')

    // Clear all translations
    translations.value = {}
    loadedLocales.value.clear()

    // Reload current locale
    await loadLocaleTranslations(currentLocale.value, true)

    // logger.info('i18n-store', 'Translations refreshed')
  }

  function clearCache(): void {
    translations.value = {}
    loadedLocales.value.clear()
  }

  // Initialize with current locale on store creation
  // Don't load automatically - let the app control when to load
  // loadLocaleTranslations(currentLocale.value)

  return {
    // State
    currentLocale: computed(() => currentLocale.value),
    translations: computed(() => translations.value),
    loadedLocales: computed(() => Array.from(loadedLocales.value)),
    loading: computed(() => loading.value),
    error: computed(() => error.value),

    // Getters
    currentTranslations,
    translationStats,
    isLocaleLoaded,

    // Actions
    loadLocaleTranslations,
    translate,
    setLocale,
    refreshTranslations,
    clearCache
  }
})
