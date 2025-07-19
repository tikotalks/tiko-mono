import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { fr } from './base/fr'

export const frBE: TranslationSchema = extendLocale(fr, {
  // Belgian French specific overrides
  common: {
    save: 'Sauvegarder', // Belgium often uses 'sauvegarder' instead of 'enregistrer'
  },
  timer: {
    minutes: 'Minutes',
    seconds: 'Secondes',
  },
  // Belgian French uses many numbers differently:
  // 70 = septante (instead of soixante-dix)
  // 90 = nonante (instead of quatre-vingt-dix)
  // But these would be handled at runtime, not in translations
})