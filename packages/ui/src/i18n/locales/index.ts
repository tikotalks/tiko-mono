// Note: We no longer export static imports to avoid loading all translations immediately.
// Translations are now loaded dynamically using the loadTranslation function.

// Supported locales map
export const locales = {
  'bg-BG': 'bgBG',
  'cs-CZ': 'csCZ',
  'cy-GB': 'cyGB',
  'da-DK': 'daDK',
  'de-AT': 'deAT',
  'de-CH': 'deCH',
  'de-DE': 'deDE',
  'el-GR': 'elGR',
  'en-AU': 'enAU',
  'en-CA': 'enCA',
  'en-GB': 'enGB',
  'en-US': 'enUS',
  'es-AR': 'esAR',
  'es-ES': 'esES',
  'es-MX': 'esMX',
  'et-EE': 'etEE',
  'fi-FI': 'fiFI',
  'fr-BE': 'frBE',
  'fr-CA': 'frCA',
  'fr-FR': 'frFR',
  'ga-IE': 'gaIE',
  'hr-HR': 'hrHR',
  'hu-HU': 'huHU',
  'hy-AM': 'hyAM',
  'is-IS': 'isIS',
  'it-IT': 'itIT',
  'lt-LT': 'ltLT',
  'lv-LV': 'lvLV',
  'mt-MT': 'mtMT',
  'nl-BE': 'nlBE',
  'nl-NL': 'nlNL',
  'no-NO': 'noNO',
  'pl-PL': 'plPL',
  'pt-BR': 'ptBR',
  'pt-PT': 'ptPT',
  'ro-RO': 'roRO',
  'ru-RU': 'ruRU',
  'sk-SK': 'skSK',
  'sl-SI': 'slSI',
  'sv-SE': 'svSE'
} as const

export type LocaleCode = keyof typeof locales

// Dynamic translation loader that only loads what's needed
const translationLoaders = {
  'bg-BG': () => import('./bg-BG').then(m => m.bgBG),
  'cs-CZ': () => import('./cs-CZ').then(m => m.csCZ),
  'cy-GB': () => import('./cy-GB').then(m => m.cyGB),
  'da-DK': () => import('./da-DK').then(m => m.daDK),
  'de-AT': () => import('./de-AT').then(m => m.deAT),
  'de-CH': () => import('./de-CH').then(m => m.deCH),
  'de-DE': () => import('./de-DE').then(m => m.deDE),
  'el-GR': () => import('./el-GR').then(m => m.elGR),
  'en-AU': () => import('./en-AU').then(m => m.enAU),
  'en-CA': () => import('./en-CA').then(m => m.enCA),
  'en-GB': () => import('./en-GB').then(m => m.enGB),
  'en-US': () => import('./en-US').then(m => m.enUS),
  'es-AR': () => import('./es-AR').then(m => m.esAR),
  'es-ES': () => import('./es-ES').then(m => m.esES),
  'es-MX': () => import('./es-MX').then(m => m.esMX),
  'et-EE': () => import('./et-EE').then(m => m.etEE),
  'fi-FI': () => import('./fi-FI').then(m => m.fiFI),
  'fr-BE': () => import('./fr-BE').then(m => m.frBE),
  'fr-CA': () => import('./fr-CA').then(m => m.frCA),
  'fr-FR': () => import('./fr-FR').then(m => m.frFR),
  'ga-IE': () => import('./ga-IE').then(m => m.gaIE),
  'hr-HR': () => import('./hr-HR').then(m => m.hrHR),
  'hu-HU': () => import('./hu-HU').then(m => m.huHU),
  'hy-AM': () => import('./hy-AM').then(m => m.hyAM),
  'is-IS': () => import('./is-IS').then(m => m.isIS),
  'it-IT': () => import('./it-IT').then(m => m.itIT),
  'lt-LT': () => import('./lt-LT').then(m => m.ltLT),
  'lv-LV': () => import('./lv-LV').then(m => m.lvLV),
  'mt-MT': () => import('./mt-MT').then(m => m.mtMT),
  'nl-BE': () => import('./nl-BE').then(m => m.nlBE),
  'nl-NL': () => import('./nl-NL').then(m => m.nlNL),
  'no-NO': () => import('./no-NO').then(m => m.noNO),
  'pl-PL': () => import('./pl-PL').then(m => m.plPL),
  'pt-BR': () => import('./pt-BR').then(m => m.ptBR),
  'pt-PT': () => import('./pt-PT').then(m => m.ptPT),
  'ro-RO': () => import('./ro-RO').then(m => m.roRO),
  'ru-RU': () => import('./ru-RU').then(m => m.ruRU),
  'sk-SK': () => import('./sk-SK').then(m => m.skSK),
  'sl-SI': () => import('./sl-SI').then(m => m.slSI),
  'sv-SE': () => import('./sv-SE').then(m => m.svSE)
} as const

// Cache for loaded translations
const translationCache = new Map<LocaleCode, any>()

// Function to load a specific translation
export async function loadTranslation(localeCode: LocaleCode) {
  if (translationCache.has(localeCode)) {
    return translationCache.get(localeCode)
  }
  
  const loader = translationLoaders[localeCode]
  if (!loader) {
    throw new Error(`No translation loader found for locale: ${localeCode}`)
  }
  
  const translation = await loader()
  translationCache.set(localeCode, translation)
  return translation
}

// Only import the default English translations statically as a fallback
import { enGB } from './en-GB'

// Get all translations - only returns what's been loaded
export function getTranslations() {
  // Convert the cache Map to a plain object
  const loadedTranslations: Record<string, any> = {
    'en-GB': enGB // Always include English as fallback
  }
  
  // Add any dynamically loaded translations from the cache
  translationCache.forEach((value, key) => {
    loadedTranslations[key] = value
  })
  
  return loadedTranslations
}

// Export available locales without triggering imports
export const translations = getTranslations()