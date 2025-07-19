import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { en } from './base/en'

export const enUS: TranslationSchema = extendLocale(en, {
  // US-specific overrides can go here
  // For example:
  // common: {
  //   color: 'color' // vs 'colour' in en-GB
  // }
})