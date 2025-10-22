import type { LangCode, UseUposOptions, UseUposReturn, LanguageDataset } from './types'
import { UPOSTag } from './types'
import { tagSentence, tagUnknown, hasDataset } from './tagger'
import { heuristics } from './heuristics'
import enData from './lang/en.json'
import nlData from './lang/nl.json'
import deData from './lang/de.json'
import frData from './lang/fr.json'
import esData from './lang/es.json'
import mtData from './lang/mt.json'

const toDataset = (d: any): LanguageDataset => ({
  det: new Set(d.det),
  pron: new Set(d.pron),
  adp: new Set(d.adp),
  cconj: new Set(d.cconj),
  sconj: new Set(d.sconj),
  aux: new Set(d.aux),
  part: new Set(d.part),
  intj: new Set(d.intj),
  adv: new Set(d.adv),
  punctuation: new Set(d.punctuation),
  properNouns: d.properNouns ? new Set(d.properNouns) : undefined,
})

const registry: Record<LangCode, { dataset: LanguageDataset; heuristics: any }> = {
  en: { dataset: toDataset(enData), heuristics: heuristics.en },
  nl: { dataset: toDataset(nlData), heuristics: heuristics.nl },
  de: { dataset: toDataset(deData), heuristics: heuristics.de },
  fr: { dataset: toDataset(frData), heuristics: heuristics.fr },
  es: { dataset: toDataset(esData), heuristics: heuristics.es },
  mt: { dataset: toDataset(mtData), heuristics: heuristics.mt },
}

export function useUpos(languages?: LangCode[] | UseUposOptions): UseUposReturn {
  const langs: LangCode[] = Array.isArray(languages)
    ? languages
    : languages?.languages || ['en']

  const defaultLang: LangCode = langs[0] || 'en'

  function upos(sentence: string, lang?: LangCode) {
    const code = (lang || defaultLang || 'en') as LangCode
    if (!hasDataset(code, registry)) {
      return tagUnknown(sentence)
    }
    const { dataset, heuristics: h } = registry[code]
    return tagSentence(sentence, dataset, h)
  }

  return { upos }
}

export type { LangCode } from './types'
