import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { pt } from './base/pt'

export const ptPT: TranslationSchema = extendLocale(pt, {
  // Portugal-specific overrides can go here
})