/**
 * User preference keys for consistent access to stored preferences
 * These keys map to specific paths in the user profile settings
 */

export const USER_PREFERENCE_KEYS = {
  // List preferences
  LISTS: {
    I18N_DATABASE_KEYS: 'i18n-database-keys',
    I18N_LANGUAGES: 'i18n-languages',
    I18N_IMPORT_LANGUAGES: 'i18n-import-languages',
    MEDIA_LIBRARY: 'media-library',
    USERS_LIST: 'users-list',
    RADIO_ITEMS: 'radio-items',
    TIMER_PRESETS: 'timer-presets',
    CARDS_LIST: 'cards-list',
  },

  // Theme preferences
  THEME: 'theme',

  // Locale preferences
  LOCALE: 'locale',

  // View preferences
  VIEWS: {
    DASHBOARD_LAYOUT: 'dashboard-layout',
    MEDIA_VIEW_MODE: 'media-view-mode',
    TRANSLATION_VIEW_MODE: 'translation-view-mode',
  },

  // Admin specific preferences
  ADMIN: {
    SIDEBAR_COLLAPSED: 'admin-sidebar-collapsed',
    RECENT_SEARCHES: 'admin-recent-searches',
    DEFAULT_LANGUAGE_FILTER: 'admin-default-language-filter',
  },

  NAVIGATION: {
    ADMIN: 'admin-active-navigation',
  }
} as const;

// Type for the keys
export type UserPreferenceKey = typeof USER_PREFERENCE_KEYS;
export type ListPreferenceKey = keyof typeof USER_PREFERENCE_KEYS.LISTS;
export type ViewPreferenceKey = keyof typeof USER_PREFERENCE_KEYS.VIEWS;
export type AdminPreferenceKey = keyof typeof USER_PREFERENCE_KEYS.ADMIN;

// Helper to get the full path for a preference
export function getPreferencePath(category: 'lists' | 'views' | 'admin', key: string): string {
  return `${category}.${key}`;
}
