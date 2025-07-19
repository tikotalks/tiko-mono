import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { de } from './base/de'

export const deAT: TranslationSchema = extendLocale(de, {
  // Austrian German specific overrides
  common: {
    ...de.common,
    month: {
      ...de.common.month,
      january: 'Jänner', // Austrian variant
    },
  },
})