import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { es } from './base/es'

export const esES: TranslationSchema = extendLocale(es, {
  // Spain-specific overrides can go here
})