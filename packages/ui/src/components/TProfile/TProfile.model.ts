import type { User } from '@supabase/supabase-js'

export interface TProfileProps {
  user: User
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