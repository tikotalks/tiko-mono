import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { el } from './base/el'

export const elGR: TranslationSchema = extendLocale(el, {
  // Greece-specific overrides can go here
})