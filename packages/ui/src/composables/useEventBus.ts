import mitt, { type Emitter } from 'mitt'
import type { 
  EventMap, 
  EventHandler, 
  EventBusComposable, 
  TikoEvents 
} from './useEventBus.model'

/**
 * Global event bus instance using Mitt
 * Singleton pattern ensures the same instance is used across all components
 */
let globalEventBus: Emitter<any> | null = null

/**
 * Get or create the global event bus instance
 * @returns The global Mitt emitter instance
 */
function getEventBus(): Emitter<any> {
  if (!globalEventBus) {
    globalEventBus = mitt()
  }
  return globalEventBus
}

/**
 * EventBus composable for cross-component communication
 * 
 * Provides a type-safe event system using Mitt that can be used throughout
 * all Tiko applications. The event bus allows components to communicate
 * without tight coupling through a publish-subscribe pattern.
 * 
 * @template Events - Event map defining available events and their data types
 * @returns EventBus interface with emit, on, off, and clear methods
 * 
 * @example
 * // Basic usage with TikoEvents
 * const eventBus = useEventBus<TikoEvents>()
 * 
 * // Listen to events
 * eventBus.on('auth:login', (data) => {
 *   console.log(`User ${data.email} logged in`)
 * })
 * 
 * // Emit events
 * eventBus.emit('auth:login', { 
 *   userId: '123', 
 *   email: 'user@example.com' 
 * })
 * 
 * @example
 * // Custom events for specific app
 * interface TimerEvents extends TikoEvents {
 *   'timer:start': { duration: number }
 *   'timer:pause': Record<string, never>
 *   'timer:complete': { duration: number; mode: 'up' | 'down' }
 * }
 * 
 * const eventBus = useEventBus<TimerEvents>()
 * eventBus.emit('timer:start', { duration: 300 })
 * 
 * @example
 * // Cleanup listeners in component unmount
 * import { onUnmounted } from 'vue'
 * 
 * const eventBus = useEventBus<TikoEvents>()
 * 
 * const handleLogin = (data) => console.log('Login:', data)
 * eventBus.on('auth:login', handleLogin)
 * 
 * onUnmounted(() => {
 *   eventBus.off('auth:login', handleLogin)
 * })
 */
export function useEventBus<Events extends EventMap = TikoEvents>(): EventBusComposable<Events> {
  const emitter = getEventBus()

  /**
   * Emit an event with optional data
   * @param event - The event name
   * @param data - Optional event data
   */
  const emit = <K extends keyof Events>(event: K, data?: Events[K]): void => {
    emitter.emit(event as string, data)
  }

  /**
   * Listen to an event
   * @param event - The event name
   * @param handler - The event handler function
   */
  const on = <K extends keyof Events>(
    event: K, 
    handler: EventHandler<Events[K]>
  ): void => {
    emitter.on(event as string, handler)
  }

  /**
   * Remove an event listener
   * @param event - The event name
   * @param handler - The event handler function to remove
   */
  const off = <K extends keyof Events>(
    event: K, 
    handler: EventHandler<Events[K]>
  ): void => {
    emitter.off(event as string, handler)
  }

  /**
   * Remove all listeners for an event, or all listeners if no event specified
   * @param event - Optional event name to clear listeners for
   */
  const clear = <K extends keyof Events>(event?: K): void => {
    if (event) {
      emitter.off(event as string)
    } else {
      emitter.all.clear()
    }
  }

  return {
    emit,
    on,
    off,
    clear
  }
}

/**
 * Create a scoped event bus for specific use cases
 * Useful when you need isolated event communication
 * 
 * @template Events - Event map defining available events and their data types
 * @returns New EventBus instance that doesn't share events with global bus
 * 
 * @example
 * // Create isolated event bus for a modal component
 * const modalEventBus = createEventBus<{
 *   'modal:open': { id: string }
 *   'modal:close': Record<string, never>
 * }>()
 */
export function createEventBus<Events extends EventMap = EventMap>(): EventBusComposable<Events> {
  const emitter = mitt<any>()

  return {
    emit: (event, data) => emitter.emit(event as any, data),
    on: (event, handler) => emitter.on(event as any, handler),
    off: (event, handler) => emitter.off(event as any, handler),
    clear: (event) => event ? emitter.off(event as any) : emitter.all.clear()
  }
}