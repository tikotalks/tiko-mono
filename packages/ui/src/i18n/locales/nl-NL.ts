import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { nl } from './base/nl'

export const nlNL: TranslationSchema = extendLocale(nl, {
  // Netherlands-specific overrides can go here if needed
  // The base Dutch translations are sufficient for nl-NL
})