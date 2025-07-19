import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { is } from './base/is'

export const isIS: TranslationSchema = extendLocale(is)