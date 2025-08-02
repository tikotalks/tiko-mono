/// <reference types="@cloudflare/workers-types" />

export interface Env {
  OPENAI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
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
    model: string
    tokensUsed?: number
  }
}

export interface TranslationResult {
  language: string
  translation: string
  confidence?: number
}

export interface OpenAITranslationResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  usage?: {
    total_tokens: number
  }
}

export interface DatabaseLanguage {
  id: number
  code: string
  name: string
  native_name: string
  is_active: boolean
}

export interface DatabaseKey {
  id: number
  key: string
  description?: string
  category?: string
}

export interface DatabaseTranslation {
  key_id: number
  language_code: string
  value: string
  version: number
  is_published: boolean
  notes?: string
}