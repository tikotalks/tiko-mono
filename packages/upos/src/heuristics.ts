export type Heuristics = {
  isVerb: (w: string) => boolean
  isAdj: (w: string) => boolean
  isAdv: (w: string) => boolean
}

export const heuristics: Record<string, Heuristics> = {
  en: {
    isVerb: w => /(ing|ed|ize|ise|fy|s)$/.test(w),
    isAdj: w => /(ous|ive|al|able|ible|ful|less|ish|ic)$/.test(w),
    isAdv: w => /(ly)$/.test(w),
  },
  nl: {
    isVerb: w => /(en|te|de|den|t)$/.test(w),
    isAdj: w => /(ig|lijk|baar|loos)$/.test(w),
    isAdv: w => /(lijk)$/.test(w),
  },
  de: {
    isVerb: w => /(en|st|te|ten|t)$/.test(w),
    isAdj: w => /(ig|lich|bar|los)$/.test(w),
    isAdv: w => /(erweise)$/.test(w),
  },
  fr: {
    isVerb: w => /(er|ir|re|é|ée|és|ées)$/.test(w),
    isAdj: w => /(if|ive|able|ible|eux|euse|al|ale|aux|elles?)$/.test(w),
    isAdv: w => /(ment)$/.test(w),
  },
  es: {
    isVerb: w => /(ar|er|ir|ado|ido|ando|iendo)$/.test(w),
    isAdj: w => /(oso|osa|al|ico|ica|ble)$/.test(w),
    isAdv: w => /(mente)$/.test(w),
  },
  mt: {
    isVerb: w => /(a|u|aw|ajt|ajtna)$/.test(w),
    isAdj: w => /(uż|iv|al|abbli)$/.test(w),
    isAdv: w => /(ment)$/.test(w),
  },
}
