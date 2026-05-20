/// <reference types="@cloudflare/workers-types" />

export interface Env {
  LEZU_API_KEY: string
  LEZU_PROJECT_ID?: string
  LEZU_API_BASE?: string
  TRANSLATION_CACHE: KVNamespace
}

export interface TranslationRequest {
  key: string
  englishTranslation: string
  languages?: string[]
  context?: string
  namespace?: string
}

export interface TranslationResponse {
  success: boolean
  key: string
  translations: Record<string, string>
  errors?: string[]
  metadata?: {
    timestamp: string
    provider: string
    projectId: string
  }
}

export interface TranslationResult {
  language: string
  translation: string
  confidence?: number
}

export interface DatabaseLanguage {
  id: string
  code: string
  name: string
  native_name?: string
  is_active: boolean
}

export interface DatabaseKey {
  id: string
  key: string
  description?: string
  category?: string
}

export interface DatabaseTranslation {
  key_id: string
  language_code: string
  value: string
  version: number
  is_published: boolean
  notes?: string
}
