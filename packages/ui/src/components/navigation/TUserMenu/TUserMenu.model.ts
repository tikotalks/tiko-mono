import type { ContextMenuItem } from '../TContextMenu'

export interface TUserMenuProps {
  user?: any // User object from auth store
  showUserInfo?: boolean
  showOnlineStatus?: boolean
  isOnline?: boolean
  showChevron?: boolean
  avatarSize?: 'small' | 'medium' | 'large'
  customMenuItems?: Partial<ContextMenuItem>[]
  menuPosition?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
}

export interface TUserMenuEmits {
  (e: 'logout'): void
  (e: 'profile'): void
  (e: 'settings'): void
}