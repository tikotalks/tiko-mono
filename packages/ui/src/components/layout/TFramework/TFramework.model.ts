import type { TikoConfig } from '@tiko/core'
import type { RegisterSWFunc } from '../../../composables/usePWAUpdate'

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

export interface TFrameworkProps {
  config: TikoConfig
  backgroundImage?: string
  loading?: boolean
  requireAuth?: boolean
  showSplashScreen?: boolean
  pwaRegisterSW?: RegisterSWFunc
}

export interface TFrameworkEmits {
  (e: 'settings-change', section: string, value: any): void
  (e: 'route-change', route: any): void
  (e: 'ready'): void
}
