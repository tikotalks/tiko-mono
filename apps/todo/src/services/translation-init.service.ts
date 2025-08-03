/**
 * Translation Initialization Service for Todo App
 * Handles loading translations from database on app startup
 */

import { useI18n, initializeDatabaseKeys } from '@tiko/ui';

// Default locale - can be overridden by user preferences
const DEFAULT_LOCALE = 'en-GB';

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
    return browserLang;
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
    
    // Initialize database keys
    await initializeDatabaseKeys();
    console.log('Database keys initialized');
    
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