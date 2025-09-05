import { useI18nStore } from '@tiko/core';

/**
 * Force reload all i18n translations by clearing cache and reloading current locale
 */
export async function reloadI18nTranslations() {
  const i18nStore = useI18nStore();
  const currentLocale = i18nStore.currentLocale;
  
  console.log('🔄 Reloading i18n translations for locale:', currentLocale);
  
  // Force reload by setting the same locale (this clears cache first)
  await i18nStore.setLocale(currentLocale);
  
  console.log('✅ i18n translations reloaded');
}

/**
 * Reload translations for a specific locale
 */
export async function reloadI18nLocale(locale: string) {
  const i18nStore = useI18nStore();
  
  console.log('🔄 Reloading i18n translations for specific locale:', locale);
  
  // Force reload the specific locale
  await i18nStore.setLocale(locale);
  
  console.log('✅ i18n translations reloaded for:', locale);
}