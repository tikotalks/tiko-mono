import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { es } from './base/es'

export const esMX: TranslationSchema = extendLocale(es, {
  // Mexican Spanish specific overrides
  common: {
    save: 'Guardar',
    upload: 'Subir', // Mexico uses 'subir' for upload
    download: 'Descargar',
  },
  auth: {
    email: 'Correo electrónico',
    emailAddress: 'Dirección de correo electrónico',
    enterEmail: 'Ingresa tu correo electrónico', // Mexico uses 'ingresa' instead of 'introduce'
    invalidEmail: 'Correo electrónico inválido',
    emailRequired: 'Correo electrónico requerido',
    emailInUse: 'Correo electrónico ya en uso',
    verifyEmail: 'Verifica tu correo electrónico',
    emailSent: 'Correo electrónico enviado',
    checkEmail: 'Revisa tu correo electrónico', // Mexico uses 'revisa' instead of 'comprueba'
    useDifferentEmail: 'Usar otro correo electrónico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    resetPassword: 'Restablecer contraseña',
    changePassword: 'Cambiar contraseña',
    currentPassword: 'Contraseña actual',
    newPassword: 'Nueva contraseña',
    passwordRequired: 'Contraseña requerida',
    passwordTooShort: 'Contraseña muy corta',
    passwordMismatch: 'Las contraseñas no coinciden',
    wrongPassword: 'Contraseña incorrecta',
    weakPassword: 'Contraseña débil',
    pleaseEnterValidEmail: 'Por favor ingresa un correo electrónico válido'
  },
  cards: {
    uploadImage: 'Subir imagen',
  },
  profile: {
    email: 'Correo electrónico',
    phone: 'Teléfono', // Mexico uses 'teléfono'
  },
  todo: {
    uploadImagePrompt: 'Sube una imagen para hacer la tarea más visual',
  }
})