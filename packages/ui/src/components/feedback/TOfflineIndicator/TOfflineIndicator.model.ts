export interface TOfflineIndicatorProps {
  /**
   * Override the offline state (for testing)
   */
  offline?: boolean
  
  /**
   * Override the pending sync state (for testing)
   */
  pendingSync?: boolean
  
  /**
   * Custom message to display instead of default
   */
  message?: string
}