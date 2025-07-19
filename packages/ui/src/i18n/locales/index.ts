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

// Import all translations statically for now to ensure they work
// TODO: Optimize this later with proper async loading
import { bgBG } from './bg-BG'
import { csCZ } from './cs-CZ'
import { cyGB } from './cy-GB'
import { daDK } from './da-DK'
import { deAT } from './de-AT'
import { deCH } from './de-CH'
import { deDE } from './de-DE'
import { elGR } from './el-GR'
import { enAU } from './en-AU'
import { enCA } from './en-CA'
import { enGB } from './en-GB'
import { enUS } from './en-US'
import { esAR } from './es-AR'
import { esES } from './es-ES'
import { esMX } from './es-MX'
import { etEE } from './et-EE'
import { fiFI } from './fi-FI'
import { frBE } from './fr-BE'
import { frCA } from './fr-CA'
import { frFR } from './fr-FR'
import { gaIE } from './ga-IE'
import { hrHR } from './hr-HR'
import { huHU } from './hu-HU'
import { hyAM } from './hy-AM'
import { isIS } from './is-IS'
import { itIT } from './it-IT'
import { ltLT } from './lt-LT'
import { lvLV } from './lv-LV'
import { mtMT } from './mt-MT'
import { nlBE } from './nl-BE'
import { nlNL } from './nl-NL'
import { noNO } from './no-NO'
import { plPL } from './pl-PL'
import { ptBR } from './pt-BR'
import { ptPT } from './pt-PT'
import { roRO } from './ro-RO'
import { ruRU } from './ru-RU'
import { skSK } from './sk-SK'
import { slSI } from './sl-SI'
import { svSE } from './sv-SE'

// Get all translations - now synchronously available
export function getTranslations() {
  return {
    'bg-BG': bgBG,
    'cs-CZ': csCZ,
    'cy-GB': cyGB,
    'da-DK': daDK,
    'de-AT': deAT,
    'de-CH': deCH,
    'de-DE': deDE,
    'el-GR': elGR,
    'en-AU': enAU,
    'en-CA': enCA,
    'en-GB': enGB,
    'en-US': enUS,
    'es-AR': esAR,
    'es-ES': esES,
    'es-MX': esMX,
    'et-EE': etEE,
    'fi-FI': fiFI,
    'fr-BE': frBE,
    'fr-CA': frCA,
    'fr-FR': frFR,
    'ga-IE': gaIE,
    'hr-HR': hrHR,
    'hu-HU': huHU,
    'hy-AM': hyAM,
    'is-IS': isIS,
    'it-IT': itIT,
    'lt-LT': ltLT,
    'lv-LV': lvLV,
    'mt-MT': mtMT,
    'nl-BE': nlBE,
    'nl-NL': nlNL,
    'no-NO': noNO,
    'pl-PL': plPL,
    'pt-BR': ptBR,
    'pt-PT': ptPT,
    'ro-RO': roRO,
    'ru-RU': ruRU,
    'sk-SK': skSK,
    'sl-SI': slSI,
    'sv-SE': svSE
  }
}

// Export available locales without triggering imports
export const translations = getTranslations()