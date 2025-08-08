export interface NavigationItem {
  id: string
  title: string
  path: string
  order?: number
  is_visible?: boolean
  children?: NavigationItem[]
}

export interface TNavigationProps {
  /**
   * Navigation items to display
   */
  items: NavigationItem[]
  
  /**
   * Current active path
   */
  currentPath?: string
  
  /**
   * Show mobile menu toggle
   */
  showMobileToggle?: boolean
  
  /**
   * Logo component or text to display
   */
  logo?: string
  
  /**
   * Whether to show logo
   */
  showLogo?: boolean
}