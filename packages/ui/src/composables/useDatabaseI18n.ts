/**
 * Database-driven i18n composable - ADMIN ONLY
 * 
 * This composable is specifically for admin pages that need to manage
 * translations directly from the database. Regular apps should use
 * the static useI18n composable instead.
 * 
 * Features:
 * - Live database translations
 * - Real-time updates
 * - Translation management
 * - Admin dashboard functionality
 * 
 * Usage (ADMIN ONLY):
 * ```typescript
 * import { useDatabaseI18n } from '@tiko/ui'
 * 
 * const { t, setLocale, refreshTranslations } = useDatabaseI18n()
 * ```
 */

import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { databaseKeys } from '../i18n/database-keys';
import { useI18nStore } from '../stores/i18n.store';

/**
 * Database-driven i18n composable for admin pages only
 */
export function useDatabaseI18n() {
  const i18nStore = useI18nStore()
  const { currentLocale, loading, error } = storeToRefs(i18nStore)

  // Translation function
  const t = (key: string | any, params?: Record<string, any>): string => {
    // Ensure key is a string
    const keyStr = typeof key === 'string' ? key : String(key);

    // Handle string params as fallback
    if (typeof params === 'string') {
      const translation = i18nStore.translate(keyStr);
      return translation === keyStr ? params : translation;
    }

    // Use store's translate function
    return i18nStore.translate(keyStr, params);
  };

  // Get available locales
  const availableLocales = computed(() => i18nStore.loadedLocales);

  return {
    t,
    keys: databaseKeys,
    locale: currentLocale,
    currentLocale,
    setLocale: i18nStore.setLocale,
    availableLocales,
    loading,
    error,
    isReady: computed(() => !loading.value),
    refreshTranslations: i18nStore.refreshTranslations,

    // Admin-specific functionality
    getAllTranslations: i18nStore.getAllTranslations,
    getTranslationStats: i18nStore.getTranslationStats,
    
    // Expose store for admin functionality
    _store: i18nStore
  };
}