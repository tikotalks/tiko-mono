export interface TUserSettingsProps {
  /**
   * User object containing user data
   */
  user: {
    id: string
    email: string
    user_metadata?: {
      settings?: {
        language?: string
        theme?: 'light' | 'dark' | 'auto'
        [key: string]: any
      }
      [key: string]: any
    }
  }
  
  /**
   * Callback when settings are saved
   */
  onSave?: (settings: UserSettings) => void
}

export interface UserSettings {
  language: string
  theme: 'light' | 'dark' | 'auto'
}

export interface TUserSettingsEmits {
  'update:settings': [settings: UserSettings]
  'close': []
}