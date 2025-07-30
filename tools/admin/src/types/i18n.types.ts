export interface I18nKey {
  id: number
  key: string
  category?: string
  description?: string
  created_at: string
  created_by?: string
  translationCount?: number
}

export interface I18nLanguage {
  id: number
  code: string
  name: string
  native_name?: string
  is_active: boolean
  created_at: string
}

export interface I18nTranslation {
  id: number
  key_id: number
  language_code: string
  value: string
  version: number
  is_published: boolean
  created_at: string
  created_by?: string
  notes?: string
}

export interface TranslationStats {
  totalTranslations: number
  keyCounts: Record<number, number>
}