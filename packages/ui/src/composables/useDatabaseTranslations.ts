/**
 * Composable to use database translations instead of static files
 * This enables real-time translation updates without redeployment
 */

import { ref, computed, watch } from 'vue';
import { translationService } from '@tiko/core';
import type { TranslationMessages } from '../i18n/types';

export function useDatabaseTranslations() {
  const isLoading = ref(true);
  const translations = ref<Record<string, Record<string, string>>>({});
  const currentLocale = ref('en');

  /**
   * Convert flat key-value pairs to nested object
   * e.g., "common.save" -> { common: { save: "Save" } }
   */
  function unflattenObject(flat: Record<string, string>): any {
    const result: any = {};
    
    for (const key in flat) {
      const parts = key.split('.');
      let current = result;
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      
      current[parts[parts.length - 1]] = flat[key];
    }
    
    return result;
  }

  /**
   * Load translations for a specific locale from database
   */
  async function loadTranslations(locale: string) {
    try {
      isLoading.value = true;
      
      // Get flat translations from database
      const flatTranslations = await translationService.generateJson(locale);
      
      // Convert to nested structure expected by i18n
      const nestedTranslations = unflattenObject(flatTranslations);
      
      // Store in cache
      translations.value[locale] = nestedTranslations;
      
      return nestedTranslations;
    } catch (error) {
      console.error(`Failed to load translations for ${locale}:`, error);
      // Fall back to empty object
      return {};
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Get translations for current locale
   */
  const currentTranslations = computed(() => {
    return translations.value[currentLocale.value] || {};
  });

  /**
   * Preload translations for common locales
   */
  async function preloadCommonLocales() {
    const commonLocales = ['en', 'fr', 'de', 'es'];
    await Promise.all(
      commonLocales.map(locale => loadTranslations(locale))
    );
  }

  /**
   * Watch for locale changes and load translations
   */
  watch(currentLocale, async (newLocale) => {
    if (!translations.value[newLocale]) {
      await loadTranslations(newLocale);
    }
  });

  /**
   * Force reload translations for current locale
   */
  async function reloadTranslations() {
    await loadTranslations(currentLocale.value);
  }

  /**
   * Check if a translation key exists
   */
  function hasTranslation(key: string): boolean {
    const parts = key.split('.');
    let current: any = currentTranslations.value;
    
    for (const part of parts) {
      if (!current || typeof current !== 'object' || !(part in current)) {
        return false;
      }
      current = current[part];
    }
    
    return true;
  }

  return {
    isLoading,
    translations,
    currentLocale,
    currentTranslations,
    loadTranslations,
    preloadCommonLocales,
    reloadTranslations,
    hasTranslation
  };
}