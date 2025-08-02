/// <reference types="@cloudflare/workers-types" />

export interface Env {
  OPENAI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
}

export interface PredictRequest {
  lang: string
  path?: string[] | string  // Can be array or comma-separated string
}

export interface SelectRequest {
  lang: string
  path: string[]
  choice: string
  userId?: string  // Optional for personalization
}

export interface Prediction {
  word: string
  score: number
  category?: string
  icon?: string
}

export interface PredictResponse {
  success: boolean
  predictions: Prediction[]
  isInitial: boolean
  generatedByAI?: boolean
  error?: string
}

export interface SelectResponse {
  success: boolean
  message?: string
  error?: string
}

// Database types
export interface SentencePattern {
  id?: number
  language_code: string
  path: string[]
  path_key: string
  predictions: Prediction[]
  usage_count: number
  created_at?: string
  updated_at?: string
}

export interface InitialCards {
  id?: number
  language_code: string
  cards: Array<{
    word: string
    category: string
    icon?: string
  }>
  created_at?: string
}

export interface SentenceUsage {
  id?: number
  language_code: string
  path: string[]
  selected_word: string
  user_id?: string
  created_at?: string
}