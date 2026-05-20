/// <reference types="@cloudflare/workers-types" />

export interface Env {
  LEZU_API_KEY: string
  LEZU_PROJECT_ID?: string
  LEZU_API_BASE?: string
}

export interface DatabaseLanguage {
  id: string | number
  code: string
  name: string
  native_name?: string
  is_active: boolean
  created_at?: string
}

export interface DatabaseKey {
  id: string
  key: string
  description?: string
  category?: string
  created_at?: string
}

export interface DatabaseTranslation {
  id: string
  key_id: string
  language_code: string
  value: string
  version: number
  is_published: boolean
  created_at?: string
  notes?: string
  key?: string
}

export interface TranslationDataRequest {
  app?: string
}

export interface TranslationData {
  keys: DatabaseKey[]
  languages: DatabaseLanguage[]
  translations: Record<string, Record<string, string>>
}

export interface TranslationDataResponse {
  success: boolean
  data: TranslationData
  metadata: {
    timestamp: string
    totalLanguages: number
    totalKeys: number
    requestedApp?: string
  }
  error?: string
}

export interface AppTranslationsResponse {
  success: boolean
  app: string
  data: TranslationData
  metadata: {
    timestamp: string
    totalLanguages: number
    totalKeys: number
  }
  error?: string
}
