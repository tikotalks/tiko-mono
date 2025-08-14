import { TikoConfig } from '../../../types'
import type { ContextMenuItem } from '../TContextMenu'

export interface TAppLayoutProps {
  /**
   * The main title displayed in the top bar
   */
  title?: string

  /**
   * Subtitle text displayed below the title
   */
  subtitle?: string

  /**
   * Whether to show the back button in the top bar
   * @default false
   */
  showBackButton?: boolean

  /**
   * Custom label for the back button
   * @default 'Back'
   */
  backButtonLabel?: string

  /**
   * Whether to show user information in the top bar
   * @default true
   */
  showUserInfo?: boolean

  /**
   * Whether to show online status indicator
   * @default false
   */
  showOnlineStatus?: boolean

  /**
   * Whether to show the header/top bar
   * @default true
   */
  showHeader?: boolean

  /**
   * Current online status of the user
   * @default true
   */
  isUserOnline?: boolean

  /**
   * Whether the app is in a loading state
   * @default false
   */
  isLoading?: boolean

  /**
   * Additional menu items for the context menu
   */
  customMenuItems?: ContextMenuItem[]

  /**
   * Name of the current app (for context and tracking)
   */
  appName?: string

  /**
   * configuration object for the app layout
   */
  config?: TikoConfig

  /**
   * Whether to show the user menu
   * @default true
   */
  showUserMenu?: boolean

  /**
   * User display name for the avatar
   */
  userDisplayName?: string

  /**
   * User avatar URL
   */
  userAvatar?: string

  /**
   * User initials for avatar fallback
   */
  userInitials?: string

  /**
   * User avatar background color
   */
  userAvatarColor?: string

  /**
   * User role/title
   */
  userRole?: string

  /**
   * Whether to show parent mode indicator
   * @default false
   */
  showParentModeIndicator?: boolean
}

export interface TAppLayoutEmits {
  /**
   * Emitted when the back button is clicked
   */
  back: []

  /**
   * Emitted when the profile button is clicked
   */
  profile: []

  /**
   * Emitted when the settings button is clicked
   */
  settings: []

  /**
   * Emitted when the logout button is clicked
   */
  logout: []

  /**
   * Emitted when a custom menu item is clicked
   */
  'menu-item-click': [item: ContextMenuItem]
}

export interface TAppLayoutSlots {
  /**
   * Main content area
   */
  default: {}

  /**
   * Content for the center of the top bar
   */
  'top-bar-center': {}

  /**
   * Actions area in the top bar
   */
  'top-bar-actions': {}

  /**
   * Footer content (optional)
   */
  footer: {}
}
