export interface TikoConfig {
  appId: string
  appName: string
  appIcon: string
  description?: string
  primaryColor?: string
  theme: {
    primary: string
    secondary: string
    tertiary: string
  },
  auth?: {
    required?: boolean
    providers?: ('email' | 'apple')[]
    skipAuth?: boolean // Allow app to run without authentication
  }
}

export function defineConfig(config: TikoConfig): TikoConfig {
  return config
}
