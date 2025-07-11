/**
 * Example demonstrating type safety of the i18n system
 * This file is for documentation purposes only
 */

import { useI18n } from '../composables/useI18n'
import type { TranslationKey } from './types'

// Example usage of the i18n system with STRINGS
export function exampleWithStrings() {
  const { t } = useI18n()

  // ✅ Valid translation keys - TypeScript will autocomplete these
  const saveButton = t('common.save')
  const loginTitle = t('auth.login')
  const timerStart = t('timer.start')
  
  // ❌ Invalid translation keys - TypeScript will show an error
  // const invalid = t('common.nonexistent') // Error: Type '"common.nonexistent"' is not assignable to type 'TranslationKey'
  // const wrongPath = t('auth.common.save') // Error: Wrong path structure
  
  // ✅ Using with fallback
  const withFallback = t('common.save', 'Save fallback')
  
  // ✅ Type-safe key variable
  const key: TranslationKey = 'settings.language'
  const dynamicTranslation = t(key)
  
  return {
    saveButton,
    loginTitle,
    timerStart,
    withFallback,
    dynamicTranslation
  }
}

// NEW: Example usage with CONSTANTS instead of strings
export function exampleWithConstants() {
  const { t, keys } = useI18n()

  // ✅ Using translation keys as constants
  const saveButton = t(keys.common.save)          // Same as t('common.save')
  const loginTitle = t(keys.auth.login)           // Same as t('auth.login')
  const timerStart = t(keys.timer.start)          // Same as t('timer.start')
  
  // ✅ With fallback
  const withFallback = t(keys.common.save, 'Save fallback')
  
  // ✅ Destructuring for cleaner code
  const { common, auth, settings } = keys
  const settingsTitle = t(settings.title)
  const cancelButton = t(common.cancel)
  const logout = t(auth.logout)
  
  // ✅ Benefits:
  // 1. No string typos - IDE will autocomplete
  // 2. Easier refactoring - rename in one place
  // 3. Find all usages works perfectly
  // 4. Still fully type-safe
  
  return {
    saveButton,
    loginTitle,
    timerStart,
    withFallback,
    settingsTitle,
    cancelButton,
    logout
  }
}

// NEW: Example usage with interpolation
export function exampleWithInterpolation() {
  const { t, keys } = useI18n()

  // ✅ Using interpolation with string placeholders
  // If you have a translation like: "Welcome {name}!"
  const welcome = t('common.welcome', { name: 'John' }) // "Welcome John!"
  
  // ✅ Using interpolation with multiple values
  // Translation: "You have {count} new {type} messages"
  const notification = t('common.notification', { 
    count: 5, 
    type: 'urgent' 
  }) // "You have 5 new urgent messages"
  
  // ✅ Using interpolation with constants
  const welcomeWithKeys = t(keys.common.welcome, { name: 'Sarah' })
  
  // ✅ String fallback still works
  const fallback = t('non.existent.key', 'Default text')
  
  // ✅ Automatic English fallback
  // If translation missing in current locale (e.g., 'nl'),
  // it will automatically use English translation
  
  return {
    welcome,
    notification,
    welcomeWithKeys,
    fallback
  }
}

/**
 * Example of adding a new translation
 * 
 * 1. First, add the key to the TranslationSchema interface in types.ts
 * 2. Then add the translation to EVERY language file
 * 3. TypeScript will error if any language is missing the key
 * 
 * For example, to add a new 'radio' section:
 * 
 * 1. In types.ts, add to TranslationSchema:
 *    radio: {
 *      stations: string
 *      nowPlaying: string
 *      addStation: string
 *    }
 * 
 * 2. In en.ts, add:
 *    radio: {
 *      stations: 'Stations',
 *      nowPlaying: 'Now Playing',
 *      addStation: 'Add Station'
 *    }
 * 
 * 3. Repeat for nl.ts, fr.ts, de.ts, es.ts, hy.ts, ru.ts
 *    If you miss any language file, TypeScript will show an error!
 */