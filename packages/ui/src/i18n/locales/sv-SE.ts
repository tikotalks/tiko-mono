import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { sv } from './base/sv'

export const svSE: TranslationSchema = extendLocale(sv, {
  // Sweden-specific overrides can go here
})