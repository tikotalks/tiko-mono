/**
 * Simple i18n composable for Tiko UI components
 * Provides translation functionality to eliminate hardcoded strings
 */

import { ref, computed } from 'vue';

// Translation dictionaries by locale
const translations = {
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No'
    },
    timer: {
      start: 'Start',
      pause: 'Pause',
      stop: 'Stop',
      reset: 'Reset',
      setTime: 'Set Time',
      minutes: 'Minutes',
      seconds: 'Seconds',
      countDown: 'Count Down',
      countUp: 'Count Up',
      quickTimes: 'Quick Times'
    },
    cards: {
      createCard: 'Create Card',
      addCard: 'Add Card',
      editCard: 'Edit Card',
      deleteCard: 'Delete Card',
      cardLabel: 'Card Label',
      audioText: 'Audio Text',
      uploadImage: 'Upload Image'
    },
    type: {
      typeToSpeak: 'Type what you want to hear...',
      speak: 'Speak',
      clearText: 'Clear text',
      characters: 'characters'
    },
    yesno: {
      setQuestion: 'Set Your Question',
      saveQuestion: 'Save Question',
      recentQuestions: 'Recent Questions'
    }
  }
};

// Current locale - can be made reactive for dynamic language switching
const currentLocale = ref<keyof typeof translations>('en');

/**
 * Get nested translation value by dot notation key
 * @param obj - Translation object
 * @param path - Dot notation path (e.g., 'common.save')
 * @returns Translation value or key if not found
 */
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

/**
 * Translation composable
 * @returns Translation functions and current locale
 */
export function useI18n() {
  /**
   * Translate a key to localized text
   * @param key - Translation key in dot notation (e.g., 'common.save')
   * @param fallback - Fallback text if translation not found
   * @returns Translated text
   */
  const t = (key: string, fallback?: string): string => {
    const translation = getNestedValue(translations[currentLocale.value], key);
    return translation !== key ? translation : (fallback || key);
  };

  /**
   * Check if a translation key exists
   * @param key - Translation key to check
   * @returns True if translation exists
   */
  const exists = (key: string): boolean => {
    return getNestedValue(translations[currentLocale.value], key) !== key;
  };

  /**
   * Get current locale
   */
  const locale = computed(() => currentLocale.value);

  /**
   * Set current locale
   * @param newLocale - New locale to set
   */
  const setLocale = (newLocale: keyof typeof translations) => {
    currentLocale.value = newLocale;
  };

  return {
    t,
    exists,
    locale,
    setLocale
  };
}

/**
 * Type definitions for translation keys
 * These provide autocomplete and type safety for translation keys
 */
export type TranslationKey = 
  | 'common.save'
  | 'common.cancel'
  | 'common.delete'
  | 'common.edit'
  | 'common.close'
  | 'common.loading'
  | 'common.error'
  | 'common.success'
  | 'common.warning'
  | 'common.confirm'
  | 'common.yes'
  | 'common.no'
  | 'timer.start'
  | 'timer.pause'
  | 'timer.stop'
  | 'timer.reset'
  | 'timer.setTime'
  | 'timer.minutes'
  | 'timer.seconds'
  | 'timer.countDown'
  | 'timer.countUp'
  | 'timer.quickTimes'
  | 'cards.createCard'
  | 'cards.addCard'
  | 'cards.editCard'
  | 'cards.deleteCard'
  | 'cards.cardLabel'
  | 'cards.audioText'
  | 'cards.uploadImage'
  | 'type.typeToSpeak'
  | 'type.speak'
  | 'type.clearText'
  | 'type.characters'
  | 'yesno.setQuestion'
  | 'yesno.saveQuestion'
  | 'yesno.recentQuestions';