import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { ru } from './base/ru'

export const ruRU: TranslationSchema = extendLocale(ru, {
  // Russia-specific overrides can go here
})