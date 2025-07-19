import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { nl } from './base/nl'

export const nlBE: TranslationSchema = extendLocale(nl, {
  // Belgian Dutch (Flemish) specific overrides
  common: {
    save: 'Bewaren', // Flemish often uses 'bewaren' instead of 'opslaan'
  },
  auth: {
    email: 'E-mail',
    emailAddress: 'E-mailadres',
    enterEmail: 'Geef je e-mail in', // 'Geef' is more common in Flemish than 'Voer'
    invalidEmail: 'Ongeldig e-mailadres',
    emailRequired: 'E-mail is verplicht',
    emailInUse: 'E-mail al in gebruik',
    verifyEmail: 'Verifieer je e-mail',
    emailSent: 'E-mail verzonden',
    checkEmail: 'Controleer je e-mail voor een verificatielink',
    useDifferentEmail: 'Gebruik een ander e-mailadres'
  },
  profile: {
    email: 'E-mail'
  },
  timer: {
    minutes: 'Minuten',
    seconds: 'Seconden'
  }
})