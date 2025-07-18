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
}

export interface TikoConfig {
  id: string
  name: string
  icon?: string
  description?: string
  theme?: TikoThemeColors
  features?: {
    parentMode?: boolean
    [key: string]: any
  }
  settings?: {
    [key: string]: any
  }
}

export function defineConfig(config: TikoConfig): TikoConfig {
  return config
}