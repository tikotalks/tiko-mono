import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { fr } from './base/fr'

export const frFR: TranslationSchema = extendLocale(fr, {
  // France-specific overrides can go here
})