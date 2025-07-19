import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { it } from './base/it'

export const itIT: TranslationSchema = extendLocale(it, {
  // Italy-specific overrides can go here
})