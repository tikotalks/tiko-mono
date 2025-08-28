/**
 * Shared grid spacing constants used across grid components
 * to ensure consistent spacing behavior throughout the application
 */
export const GRID_SPACING = {
  /** Minimum spacing at the top of grid containers */
  MIN_TOP_SPACE: 80,
  /** Minimum spacing at the bottom of grid containers */
  MIN_BOTTOM_SPACE: 120,
  /** Total vertical padding (top + bottom) */
  get TOTAL_VERTICAL_PADDING() {
    return this.MIN_TOP_SPACE + this.MIN_BOTTOM_SPACE;
  },
  /** Horizontal padding (left + right combined) */
  HORIZONTAL_PADDING: 40,
  /** Gap between grid items */
  TILE_GAP: 16,
  /** Smaller gap between grid items on mobile */
  MOBILE_TILE_GAP: 8,
} as const;