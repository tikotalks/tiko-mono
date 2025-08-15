export interface ItemTranslation {
  id?: string;
  item_id: string;
  locale: string; // e.g., 'en', 'es', 'en-GB', 'es-ES'
  name?: string;
  content?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface ItemWithTranslations {
  id: string;
  name: string;
  content?: string;
  base_locale: string;
  translations: ItemTranslation[];
}

export interface TranslationRequest {
  key: string;
  englishTranslation: string;
  languages?: string[];
  context?: string;
}

export interface TranslationResponse {
  success: boolean;
  key: string;
  translations: Record<string, string>;
  errors?: string[];
  metadata?: {
    timestamp: string;
    model: string;
  };
}