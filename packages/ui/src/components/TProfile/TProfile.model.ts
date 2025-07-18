import type { AuthUser } from '@tiko/core'

export interface TProfileProps {
  user: AuthUser
  onClose?: () => void
  onEditProfile?: () => void
  onChangePassword?: () => void
}

export interface UserProfile {
  id: string
  user_id: string
  parent_pin_hash?: string
  parent_mode_enabled?: boolean
  parent_mode_settings?: Record<string, any>
  created_at?: string
  updated_at?: string
}