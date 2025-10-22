import { tokenize } from './tokenize'
import type { LanguageDataset, LangCode, UposToken } from './types'
import { UPOSTag } from './types'

export function tagSentence(
  sentence: string,
  dataset: LanguageDataset,
  heuristics?: { isVerb: (w: string) => boolean; isAdj: (w: string) => boolean; isAdv: (w: string) => boolean }
): UposToken[] {
  const tokens = tokenize(sentence)

  return tokens.map((raw, i) => {
    const lower = raw.toLowerCase()
    let tag: UPOSTag | undefined

    // Punctuation
    if (dataset.punctuation.has(raw)) {
      tag = UPOSTag.PUNCT
    }

    // Numbers / symbols
    if (!tag && /^[-+]?\d+[\d,.]*$/.test(lower)) tag = UPOSTag.NUM
    if (!tag && /^[@#\$%&\*\+=]+$/.test(lower)) tag = UPOSTag.SYM

    // Closed class checks
    if (!tag && dataset.det.has(lower)) tag = UPOSTag.DET
    if (!tag && dataset.pron.has(lower)) tag = UPOSTag.PRON
    if (!tag && dataset.adp.has(lower)) tag = UPOSTag.ADP
    if (!tag && dataset.cconj.has(lower)) tag = UPOSTag.CCONJ
    if (!tag && dataset.sconj.has(lower)) tag = UPOSTag.SCONJ
    if (!tag && dataset.aux.has(lower)) tag = UPOSTag.AUX
    if (!tag && dataset.part.has(lower)) tag = UPOSTag.PART
    if (!tag && dataset.intj.has(lower)) tag = UPOSTag.INTJ
    if (!tag && dataset.adv.has(lower)) tag = UPOSTag.ADV

    // Heuristics
    if (!tag && heuristics?.isAdv(lower)) tag = UPOSTag.ADV
    if (!tag && heuristics?.isAdj(lower)) tag = UPOSTag.ADJ
    if (!tag && heuristics?.isVerb(lower)) tag = UPOSTag.VERB

    // Proper noun heuristic: capitalized and not first word being start of sentence punctuation
    if (
      !tag &&
      /^[A-ZÀ-ÖØ-Þ].+/.test(raw) &&
      (i > 0 || /^[a-zà-öø-ÿ]/.test(tokens[0] || ''))
    ) {
      tag = UPOSTag.PROPN
    }

    // Fallback
    if (!tag) tag = UPOSTag.NOUN

    const t: UposToken = { text: raw, tag, index: i }
    return t
  })
}
export function tagUnknown(sentence: string): UposToken[] {
  return tokenize(sentence).map((text, index) => ({ text, index, tag: UPOSTag.X }))
}

export function hasDataset(
  lang: LangCode | string,
  all: Record<LangCode, { dataset: LanguageDataset; heuristics?: any }>
): lang is LangCode {
  return Object.prototype.hasOwnProperty.call(all, lang)
}
