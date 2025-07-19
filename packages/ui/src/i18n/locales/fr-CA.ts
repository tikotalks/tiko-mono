import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { fr } from './base/fr'

export const frCA: TranslationSchema = extendLocale(fr, {
  // Canadian French specific overrides
  auth: {
    email: 'Courriel',
    emailAddress: 'Adresse courriel',
    enterEmail: 'Entrez votre courriel',
    invalidEmail: 'Courriel invalide',
    emailRequired: 'Courriel requis',
    emailInUse: 'Courriel déjà utilisé',
    verifyEmail: 'Vérifiez votre courriel',
    emailSent: 'Courriel envoyé',
    checkEmail: 'Vérifiez votre courriel',
    loginWithApple: 'Se connecter avec Apple',
    useDifferentEmail: 'Utiliser un autre courriel'
  },
  profile: {
    email: 'Courriel'
  },
  signin: {
    withEmail: 'Se connecter avec courriel',
    errors: {
      emailSignInFailed: 'Échec de la connexion par courriel'
    }
  }
})