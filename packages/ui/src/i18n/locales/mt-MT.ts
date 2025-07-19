import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { mt } from './base/mt'

export const mtMT: TranslationSchema = extendLocale(mt, {
  // Malta-specific overrides can go here
})