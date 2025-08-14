import type { ContextMenuItem } from '../TContextMenu'

export interface TTopBarProps {
  /**
   * The main title displayed in the top bar
   */
  title?: string

  /**
   * Subtitle text displayed below the title
   */
  subtitle?: string

  /**
   * Whether to show the back button
   * @default false
   */
  showBackButton?: boolean

  /**
   * Custom label for the back button
   * @default 'Go back'
   */
  backButtonLabel?: string

  /**
   * Whether to show user information in the user dropdown
   * @default true
   */
  showUserInfo?: boolean

  /**
   * Whether to show the online status indicator
   * @default false
   */
  showOnlineStatus?: boolean

  /**
   * Current online status of the user
   * @default true
   */
  isUserOnline?: boolean

  /**
   * Whether the top bar is in a loading state
   * @default false
   */
  isLoading?: boolean

  /**
   * Additional menu items for the user context menu
   */
  customMenuItems?: Partial<ContextMenuItem>[]

  /**
   * Name of the current app (for parent mode context)
   */
  appName?: string

  /**
   * Is the top bar part of an app or a website?
   */
  isApp?: boolean
}

export interface TTopBarEmits {
  /**
   * Emitted when the back button is clicked
   */
  back: []

  /**
   * Emitted when the profile menu item is clicked
   */
  profile: []

  /**
   * Emitted when the logout menu item is clicked
   */
  logout: []

  /**
   * Emitted when the settings menu item is clicked
   */
  settings: []

  /**
   * Emitted when a custom menu item is clicked
   */
  'menu-item-click': [item: ContextMenuItem]
}

export interface TTopBarSlots {
  /**
   * Content for the app controls section (left side, after title)
   */
  'app-controls': {}

  /**
   * Content for the center section of the top bar
   */
  center: {}

  /**
   * Content for the actions section (right side)
   */
  actions: {}
}

export interface TTopBarUser {
  /**
   * User's display name
   */
  displayName: string

  /**
   * User's initials for avatar fallback
   */
  initials: string

  /**
   * User's avatar image URL
   */
  avatar?: string

  /**
   * User's role or title
   */
  role?: string

  /**
   * Generated avatar background color
   */
  avatarColor: string

  /**
   * User's email address
   */
  email?: string
}
