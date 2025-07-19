import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { de } from './base/de'

export const deDE: TranslationSchema = extendLocale(de, {
  // Germany-specific overrides can go here if needed
})