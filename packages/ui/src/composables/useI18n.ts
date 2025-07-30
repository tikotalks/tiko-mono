/**
 * Database-driven i18n composable
 * This version loads translations directly from the database via Pinia store
 */

import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { databaseKeys } from '../i18n/database-keys';
import { useI18nStore } from '../stores/i18n.store';
import { logger } from '../../../core/src';

/**
 * Database-driven i18n composable
 */
export function useI18n() {
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
    setLocale: i18nStore.setLocale,
    availableLocales,
    loading,
    error,
    refreshTranslations: i18nStore.refreshTranslations,

    // Expose store for debugging
    _store: i18nStore
  };
}
