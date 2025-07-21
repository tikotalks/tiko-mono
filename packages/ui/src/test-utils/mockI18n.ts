import { en } from '../i18n/locales/base/en'
import { keys } from '../i18n/keys'
import { ref } from 'vue'
import { vi } from 'vitest'

/**
 * Mock i18n for tests using actual English translations
 * This ensures all tests have access to all translation keys
 */
export const createMockI18n = () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, any>) => {
      // Navigate through the key path to get the actual translation
      const keyParts = key.split('.')
      let value: any = en
      
      for (const part of keyParts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part]
        } else {
          // If key not found, return the key itself (common test behavior)
          return key
        }
      }
      
      // If we have a string with parameters, do simple replacement
      if (typeof value === 'string' && params) {
        return value.replace(/{(\w+)}/g, (match, param) => {
          return params[param] || match
        })
      }
      
      return typeof value === 'string' ? value : key
    },
    keys,
    locale: ref('en'),
    setLocale: vi.fn(),
    availableLocales: ref([
      { code: 'en-GB', name: 'English' },
      { code: 'nl-NL', name: 'Dutch' },
      { code: 'de-DE', name: 'German' },
      { code: 'fr-FR', name: 'French' }
    ])
  })
})

/**
 * Direct mock object for vi.mock() - avoids hoisting issues
 */
export const mockI18nModule = {
  useI18n: () => ({
    t: (key: string, params?: Record<string, any>) => {
      // Navigate through the key path to get the actual translation
      const keyParts = key.split('.')
      let value: any = en
      
      for (const part of keyParts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part]
        } else {
          // If key not found, return the key itself (common test behavior)
          return key
        }
      }
      
      // If we have a string with parameters, do simple replacement
      if (typeof value === 'string' && params) {
        return value.replace(/{(\w+)}/g, (match, param) => {
          return params[param] || match
        })
      }
      
      return typeof value === 'string' ? value : key
    },
    keys,
    locale: ref('en'),
    setLocale: vi.fn(),
    availableLocales: ref([
      { code: 'en-GB', name: 'English' },
      { code: 'nl-NL', name: 'Dutch' },
      { code: 'de-DE', name: 'German' },
      { code: 'fr-FR', name: 'French' }
    ])
  })
}