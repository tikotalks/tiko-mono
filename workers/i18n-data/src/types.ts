export interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
}

export interface DatabaseLanguage {
  id: number
  code: string
  name: string
  native_name?: string
  is_active: boolean
  created_at: string
}

export interface DatabaseKey {
  id: number
  key: string
  description?: string
  category?: string
  created_at: string
}

export interface DatabaseTranslation {
  id: number
  key_id: number
  language_code: string
  value: string
  version: number
  is_published: boolean
  created_at: string
  notes?: string
  // Joined fields when fetching with key info
  key?: string
  key_description?: string
}

export interface TranslationDataRequest {
  app?: string // Optional app filter
}

export interface TranslationData {
  keys: DatabaseKey[]
  languages: DatabaseLanguage[]
  translations: Record<string, Record<string, string>> // language_code -> key -> value
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