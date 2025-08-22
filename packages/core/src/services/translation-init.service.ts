/**
 * Translation Initialization Service
 * Handles loading translations from database on app startup
 * This service should be used by all Tiko apps
 */

import { useI18n } from '../composables/useI18n/useI18n';

// Default locale - can be overridden by user preferences
const DEFAULT_LOCALE = 'en-GB';

/**
 * Get the user's preferred locale
 * Priority: localStorage > browser language > default
 */
function getUserLocale(): string {
  // Check localStorage for saved preference - try multiple keys
  const localeKeys = ['tiko:locale', 'tiko-language', 'tiko:settings'];

  for (const key of localeKeys) {
    const savedValue = localStorage.getItem(key);
    if (savedValue) {
      try {
        // For tiko:settings, parse the JSON and extract language
        if (key === 'tiko:settings') {
          const settings = JSON.parse(savedValue);
          if (settings.language) {
            return settings.language;
          }
        } else {
          // For direct locale values
          if (savedValue.startsWith('{') || savedValue.startsWith('"')) {
            // Parse JSON value
            const parsedLocale = JSON.parse(savedValue);
            if (typeof parsedLocale === 'string') {
              return parsedLocale.replace(/"/g, '');
            }
            return parsedLocale;
          } else {
            // Plain string value
            return savedValue;
          }
        }
      } catch (error) {
        console.warn(`Failed to parse saved locale from ${key}:`, error);
      }
    }
  }

  // Check browser language
  const browserLang = navigator.language;
  if (browserLang) {
    return browserLang;
  }

  return DEFAULT_LOCALE;
}

interface TranslationInitOptions {
  categories?: string[]
}

/**
 * Initialize the translation system
 * This should be called once on app startup
 * @param options Configuration options including categories to load
 */
export async function initializeTranslations(options: TranslationInitOptions = {}): Promise<void> {
  try {
    console.log('Initializing translation system...');

    // REMOVED: Database keys initialization - not needed for production apps
    // This was loading ALL translation keys metadata which is only useful for admin tools

    // Get the i18n composable with categories option
    const { setLocale } = useI18n({ categories: options.categories });

    // Determine user locale
    const userLocale = getUserLocale();
    console.log(`Setting locale to: ${userLocale}`);

    // Load translations for the user's locale
    await setLocale(userLocale);
    console.log(`Translations loaded for locale: ${userLocale}`);

    // Listen for locale change events
    window.addEventListener('tiko-locale-change', async (event: Event) => {
      const customEvent = event as CustomEvent
      const newLocale = customEvent.detail?.locale;
      if (newLocale) {
        console.log(`Locale changed to: ${newLocale}`);
        await setLocale(newLocale);
      }
    });

  } catch (error) {
    console.error('Failed to initialize translations:', error);
    // Fallback to default locale on error
    try {
      const { setLocale } = useI18n({ categories: options.categories });
      await setLocale(DEFAULT_LOCALE);
      console.log(`Fallback: Loaded default locale ${DEFAULT_LOCALE}`);
    } catch (fallbackError) {
      console.error('Failed to load fallback translations:', fallbackError);
    }
  }
}
