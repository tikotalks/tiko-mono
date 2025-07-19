import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { es } from './base/es'

export const esAR: TranslationSchema = extendLocale(es, {
  // Argentinian Spanish specific overrides
  common: {
    upload: 'Subir',
    download: 'Bajar', // Argentina uses 'bajar' for download
  },
  auth: {
    email: 'Mail',
    emailAddress: 'Dirección de mail',
    enterEmail: 'Ingresá tu mail', // Argentina uses 'vos' form: ingresá
    invalidEmail: 'Mail inválido',
    emailRequired: 'Mail requerido',
    emailInUse: 'Mail ya en uso',
    verifyEmail: 'Verificá tu mail', // vos form: verificá
    emailSent: 'Mail enviado',
    checkEmail: 'Revisá tu mail', // vos form: revisá
    useDifferentEmail: 'Usá otro mail', // vos form: usá
    tryAgain: 'Intentá de nuevo', // vos form: intentá
    pleaseEnterValidEmail: 'Por favor ingresá un mail válido',
    enterFullName: 'Ingresá tu nombre completo',
  },
  type: {
    typeToSpeak: 'Escribí para hablar...', // vos form: escribí
    typeYourQuestion: 'Escribí tu pregunta',
  },
  yesno: {
    typeYourQuestion: 'Escribí tu pregunta',
    typeYourQuestionPlaceholder: 'Ej. ¿Querés jugar?', // vos form: querés
    typeYourQuestionOrSelect: 'Escribí tu pregunta o seleccioná de las recientes',
  },
  profile: {
    email: 'Mail',
    enterName: 'Ingresá tu nombre',
    clickToChangeAvatar: 'Hacé clic para cambiar el avatar', // vos form: hacé
  },
  radio: {
    pasteUrlPrompt: 'Pegá un enlace de YouTube, Vimeo o video directo. El audio será extraído para reproducir.', // vos form: pegá
    leaveEmptyThumbnail: 'Dejá vacío para usar la miniatura detectada automáticamente', // vos form: dejá
    addTag: 'Agregá una etiqueta y presioná Enter', // vos form: agregá, presioná
  }
})