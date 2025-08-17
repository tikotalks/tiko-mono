/**
 * Translation Initialization Service for Sequence App
 */

import { useI18n } from '@tiko/ui';

const DEFAULT_LOCALE = 'en-GB';

function getUserLocale(): string {
  const localeKeys = ['tiko:locale', 'tiko-language', 'tiko:settings'];
  
  for (const key of localeKeys) {
    const savedValue = localStorage.getItem(key);
    if (savedValue) {
      try {
        if (key === 'tiko:settings') {
          const settings = JSON.parse(savedValue);
          if (settings.language) {
            return settings.language;
          }
        } else {
          if (savedValue.startsWith('{') || savedValue.startsWith('"')) {
            const parsedLocale = JSON.parse(savedValue);
            if (typeof parsedLocale === 'string') {
              return parsedLocale.replace(/"/g, '');
            }
            return parsedLocale;
          } else {
            return savedValue;
          }
        }
      } catch (error) {
        console.warn(`Failed to parse saved locale from ${key}:`, error);
      }
    }
  }

  const browserLang = navigator.language;
  if (browserLang) {
    return browserLang;
  }

  return DEFAULT_LOCALE;
}

export async function initializeTranslations(): Promise<void> {
  try {
    console.log('Initializing translation system...');
    
    const { setLocale } = useI18n();
    
    const userLocale = getUserLocale();
    console.log(`Setting locale to: ${userLocale}`);
    
    await setLocale(userLocale);
    console.log(`Translations loaded for locale: ${userLocale}`);
    
    window.addEventListener('tiko-locale-change', async (event: CustomEvent) => {
      const newLocale = event.detail?.locale;
      if (newLocale) {
        console.log(`Locale changed to: ${newLocale}`);
        await setLocale(newLocale);
      }
    });
    
  } catch (error) {
    console.error('Failed to initialize translations:', error);
    try {
      const { setLocale } = useI18n();
      await setLocale(DEFAULT_LOCALE);
      console.log(`Fallback: Loaded default locale ${DEFAULT_LOCALE}`);
    } catch (fallbackError) {
      console.error('Failed to load fallback translations:', fallbackError);
    }
  }
}