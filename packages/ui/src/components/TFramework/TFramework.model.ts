import type { TikoConfig } from '../../types'

export interface SettingsSection {
  id: string
  title: string
  icon?: string
  component?: any // Vue component for custom settings
  order?: number
}

export interface TopBarConfig {
  showUser?: boolean
  showParentMode?: boolean
  showTitle?: boolean
  showSubtitle?: boolean
  showCurrentRoute?: boolean
  routeDisplay?: 'middle' | 'subtitle'
  showBack?: boolean
}

export interface FrameworkConfig extends TikoConfig {
  topBar?: TopBarConfig
  settings?: {
    enabled?: boolean
    sections?: SettingsSection[]
  }
  auth?: {
    skipAuth?: boolean
    [key: string]: any
  }
}

export interface TFrameworkProps {
  config: FrameworkConfig
  backgroundImage?: string
  loading?: boolean
  isApp?: boolean
  requireAuth?: boolean
  showSplashScreen?: boolean
}

export interface TFrameworkEmits {
  (e: 'settings-change', section: string, value: any): void
  (e: 'route-change', route: any): void
  (e: 'ready'): void
}
