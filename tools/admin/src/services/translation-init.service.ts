/**
 * Translation Initialization Service
 * Handles loading translations from database on app startup
 */

import { useI18n } from '@tiko/ui';

// Default locale - can be overridden by user preferences
const DEFAULT_LOCALE = 'en';

/**
 * Convert locale to base language if needed
 * e.g., 'en-US' -> 'en', 'nl-NL' -> 'nl'
 */
function getBaseLanguage(locale: string): string {
  if (locale.includes('-')) {
    return locale.split('-')[0];
  }
  return locale;
}

/**
 * Get the user's preferred locale
 * Priority: localStorage > browser language > default
 */
function getUserLocale(): string {
  // Check localStorage for saved preference
  const savedLocale = localStorage.getItem('tiko-language');
  if (savedLocale) {
    try {
      // Parse the JSON value to handle proper encoding
      const parsedLocale = JSON.parse(savedLocale);
      // Handle double-encoded strings
      if (typeof parsedLocale === 'string' && parsedLocale.startsWith('"') && parsedLocale.endsWith('"')) {
        return parsedLocale.slice(1, -1);
      }
      return parsedLocale;
    } catch (error) {
      console.warn('Failed to parse saved locale, using raw value:', savedLocale);
      // If JSON parsing fails, use raw value (fallback for non-JSON stored values)
      return savedLocale;
    }
  }

  // Check browser language
  const browserLang = navigator.language;
  if (browserLang) {
    // Convert browser locale to base language if needed
    // e.g., 'en-GB' -> 'en', 'nl-NL' -> 'nl'
    const baseLanguage = getBaseLanguage(browserLang);
    return baseLanguage;
  }

  return DEFAULT_LOCALE;
}

/**
 * Initialize the translation system
 * This should be called once on app startup
 */
export async function initializeTranslations(): Promise<void> {
  try {
    console.log('Initializing translation system...');
    
    // Get the i18n composable
    const { setLocale } = useI18n();
    
    // Determine user locale
    const userLocale = getUserLocale();
    console.log(`Setting locale to: ${userLocale}`);
    
    // Load translations for the user's locale
    await setLocale(userLocale);
    console.log(`Translations loaded for locale: ${userLocale}`);
    
  } catch (error) {
    console.error('Failed to initialize translations:', error);
    // Fallback to default locale on error
    try {
      const { setLocale } = useI18n();
      await setLocale(DEFAULT_LOCALE);
      console.log(`Fallback: Loaded default locale ${DEFAULT_LOCALE}`);
    } catch (fallbackError) {
      console.error('Failed to load fallback translations:', fallbackError);
    }
  }
}

/**
 * Save user's locale preference
 */
export function saveLocalePreference(locale: string): void {
  localStorage.setItem('tiko-language', locale);
}

/**
 * Clear user's locale preference
 */
export function clearLocalePreference(): void {
  localStorage.removeItem('tiko-language');
}