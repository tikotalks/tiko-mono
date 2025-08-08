export interface TGridProps {
  columns?: string | number
  gap?: string
  minItemWidth?: string
  responsive?: boolean
  /**
   * Enable lazy loading for grid items
   */
  lazy?: boolean
  /**
   * Root margin for intersection observer when lazy loading
   * Allows loading items before they enter the viewport
   */
  lazyRootMargin?: string
  /**
   * Threshold for intersection observer (0-1)
   * How much of the item should be visible before loading
   */
  lazyThreshold?: number
}