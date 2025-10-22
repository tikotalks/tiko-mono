export type LangCode = 'en' | 'nl' | 'de' | 'fr' | 'es' | 'mt'

export enum UPOSTag {
  ADJ = 'ADJ',
  ADP = 'ADP',
  ADV = 'ADV',
  AUX = 'AUX',
  CCONJ = 'CCONJ',
  DET = 'DET',
  INTJ = 'INTJ',
  NOUN = 'NOUN',
  NUM = 'NUM',
  PART = 'PART',
  PRON = 'PRON',
  PROPN = 'PROPN',
  PUNCT = 'PUNCT',
  SCONJ = 'SCONJ',
  SYM = 'SYM',
  VERB = 'VERB',
  X = 'X',
}

export interface UposToken {
  text: string
  tag: UPOSTag
  index: number
}

export interface LanguageDataset {
  det: Set<string>
  pron: Set<string>
  adp: Set<string>
  cconj: Set<string>
  sconj: Set<string>
  aux: Set<string>
  part: Set<string>
  intj: Set<string>
  adv: Set<string>
  punctuation: Set<string>
  properNouns?: Set<string>
}

export interface UseUposOptions {
  languages?: LangCode[]
}

export interface UseUposReturn {
  upos: (sentence: string, lang?: LangCode) => UposToken[]
}
