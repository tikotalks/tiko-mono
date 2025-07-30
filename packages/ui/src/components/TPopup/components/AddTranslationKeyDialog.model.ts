export interface AddTranslationKeyDialogProps {
  title?: string
  mode?: 'create' | 'edit'
  editKey?: {
    id?: string
    key: string
    category?: string
    description?: string
  }
  onClose?: () => void
  onSave?: (data: TranslationKeyData) => Promise<void>
}

export interface TranslationKeyData {
  key: string
  category?: string
  description?: string
  translations: Record<string, string>
}

export interface LanguageTranslation {
  code: string
  name: string
  value: string
  loading?: boolean
  error?: string
}