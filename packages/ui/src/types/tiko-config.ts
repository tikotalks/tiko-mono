export interface TikoThemeColors {
  primary?: string
  secondary?: string
  tertiary?: string
  background?: string
  foreground?: string
  accent?: string
  success?: string
  warning?: string
  error?: string
  dark?: string
  light?: string
  'accent-dark'?: string
  'accent-light'?: string
}

export interface TikoConfig {
  id: string
  name: string
  icon?: string
  description?: string
  theme?: TikoThemeColors
  isApp?: boolean
  features?: {
    parentMode?: boolean
    [key: string]: any
  }
  settings?: {
    [key: string]: any
  },
  splash: {
    appName: string,
    backgroundColor: string,
    themeColor: string,
    loadingText: string
  }
}

export const defaultTikoConfig: Required<TikoConfig> = {
  id: 'default',
  name: 'Tiko App',
  isApp: true,
  icon: '',
  description: '',
  theme: {
    primary: '#6200ee',
    secondary: '#03dac6',
    tertiary: '#018786',
    background: '#f5f5f5',
    foreground: '#121212',
    accent: '#ff4081',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    dark: '#18032a',
    light: '#ffffff',
    'accent-dark': '#000000',
    'accent-light': '#edf2f5',

  },
  features: {},
  settings: {},
  splash: {
    appName: 'Tiko',
    backgroundColor: '#f8f9fa',
    themeColor: '#007bff',
    loadingText: 'Loading Tiko...'
  }
}


