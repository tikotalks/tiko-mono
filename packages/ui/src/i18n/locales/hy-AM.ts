import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { hy } from './base/hy'

export const hyAM: TranslationSchema = extendLocale(hy, {
  // Armenia-specific overrides can go here
})