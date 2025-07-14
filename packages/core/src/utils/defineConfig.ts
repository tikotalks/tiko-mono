export interface TikoConfig {
  appId: string
  appName: string
  appIcon: string
  description?: string
  primaryColor?: string
  auth?: {
    required?: boolean
    providers?: ('email' | 'apple')[]
  }
}

export function defineConfig(config: TikoConfig): TikoConfig {
  return config
}