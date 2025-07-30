/**
 * TypeScript interfaces for the EventBus composable
 * Provides type-safe event handling with Mitt
 */

/**
 * Generic event map interface for type-safe event definitions
 * Usage: extend this interface to define app-specific events
 * 
 * @example
 * interface AppEvents extends EventMap {
 *   'user:login': { userId: string; username: string }
 *   'timer:complete': { duration: number }
 *   'notification:show': { message: string; type: 'success' | 'error' }
 * }
 */
export interface EventMap {
  [key: string | symbol]: any
}

/**
 * Event handler function type
 * @template T - The event data type
 */
export type EventHandler<T = any> = (data: T) => void

/**
 * EventBus composable return type
 * @template Events - Event map defining available events and their data types
 */
export interface EventBusComposable<Events extends EventMap = EventMap> {
  /**
   * Emit an event with optional data
   * @param event - The event name
   * @param data - Optional event data
   */
  emit: <K extends keyof Events>(event: K, data?: Events[K]) => void
  
  /**
   * Listen to an event
   * @param event - The event name
   * @param handler - The event handler function
   */
  on: <K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) => void
  
  /**
   * Remove an event listener
   * @param event - The event name
   * @param handler - The event handler function to remove
   */
  off: <K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) => void
  
  /**
   * Remove all listeners for an event, or all listeners if no event specified
   * @param event - Optional event name to clear listeners for
   */
  clear: <K extends keyof Events>(event?: K) => void
}

/**
 * Common Tiko application events
 * These events are available across all Tiko apps
 */
export interface TikoEvents extends EventMap {
  // Authentication events
  'auth:login': { userId: string; email: string }
  'auth:logout': Record<string, never>
  'auth:session-expired': Record<string, never>
  
  // Navigation events
  'nav:back': Record<string, never>
  'nav:home': Record<string, never>
  'nav:settings': Record<string, never>
  
  // Notification events
  'notification:show': { 
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    duration?: number
  }
  'notification:hide': { id?: string }
  
  // Theme events
  'theme:change': { theme: 'light' | 'dark' | 'auto' }
  
  // App state events
  'app:ready': Record<string, never>
  'app:error': { error: Error; context?: string }
  'app:focus': Record<string, never>
  'app:blur': Record<string, never>
  
  // UI interaction events
  'app:key': { key: string }
  
  // Popup events
  'app:popup-open': { component: any; id?: string; [key: string]: any }
  'app:popup-close': { id?: string }
  'app:popup-force-close': Record<string, never>

  // Media events (for cross-component communication)
  'media:refresh': Record<string, never>

  // Parent mode events
  'parent:unlocked': Record<string, never>
  'parent:locked': Record<string, never>  
  'parent:permission-denied': { permission: string }
}