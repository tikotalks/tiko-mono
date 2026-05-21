/** Shared i18n runtime types. */
export type TranslationValue = string | Translations

export interface Translations {
  [key: string]: TranslationValue
}

export type TranslationKey = string
