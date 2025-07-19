import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { de } from './base/de'

export const deCH: TranslationSchema = extendLocale(de, {
  // Swiss German specific overrides
  // Note: Swiss German often uses 'ss' instead of 'ß'
  // However, since we don't have specific words with 'ß' in the base translations,
  // we'll keep this empty for now. Specific overrides can be added as needed.
})