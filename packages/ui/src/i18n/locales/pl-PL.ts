import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { pl } from './base/pl'

export const plPL: TranslationSchema = extendLocale(pl, {
  // Poland-specific overrides can go here
})