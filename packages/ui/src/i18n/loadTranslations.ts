/**
 * Load translations from generated JSON files
 * These files are created from the database during build
 */

import type { TranslationMessages } from './types';

// Try to load from generated files first, fall back to base files
export async function loadTranslations(locale: string): Promise<TranslationMessages | null> {
  try {
    // First try generated translations (from database)
    const generated = await import(`./locales/generated/${locale}.json`)
      .then(module => module.default)
      .catch(() => null);
    
    if (generated) {
      return generated;
    }
    
    // Fall back to base translations (legacy)
    const base = await import(`./locales/base/${locale}.ts`)
      .then(module => module.default)
      .catch(() => null);
    
    if (base) {
      console.warn(`Using legacy translation file for ${locale}. Run 'pnpm translations:export' to generate from database.`);
      return base;
    }
    
    // Try parent locale (e.g., 'en' for 'en-GB')
    if (locale.includes('-')) {
      const parentLocale = locale.split('-')[0];
      return loadTranslations(parentLocale);
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to load translations for ${locale}:`, error);
    return null;
  }
}

// Get all available locales
export async function getAvailableLocales(): Promise<string[]> {
  try {
    // Try to load from generated index
    const generated = await import('./locales/generated/index.ts')
      .then(module => module.availableLocales)
      .catch(() => null);
    
    if (generated) {
      return generated;
    }
    
    // Fall back to hardcoded list
    return [
      'en', 'en-GB', 'en-US', 'en-AU', 'en-CA',
      'fr', 'fr-FR', 'fr-CA', 'fr-BE',
      'de', 'de-DE', 'de-AT', 'de-CH',
      'es', 'es-ES', 'es-MX', 'es-AR',
      'it', 'it-IT',
      'pt', 'pt-PT', 'pt-BR',
      'nl', 'nl-NL', 'nl-BE',
      'pl', 'pl-PL',
      'ru', 'ru-RU',
      'sv', 'sv-SE',
      'no', 'no-NO',
      'da', 'da-DK',
      'fi', 'fi-FI',
      'is', 'is-IS',
      'el', 'el-GR',
      'ro', 'ro-RO',
      'bg', 'bg-BG',
      'cs', 'cs-CZ',
      'sk', 'sk-SK',
      'sl', 'sl-SI',
      'hr', 'hr-HR',
      'hu', 'hu-HU',
      'et', 'et-EE',
      'lv', 'lv-LV',
      'lt', 'lt-LT',
      'mt', 'mt-MT',
      'ga', 'ga-IE',
      'cy', 'cy-GB',
      'hy', 'hy-AM'
    ];
  } catch (error) {
    console.error('Failed to get available locales:', error);
    return ['en'];
  }
}