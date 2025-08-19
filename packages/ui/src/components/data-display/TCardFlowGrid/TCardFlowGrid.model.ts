import type { TCardTile } from '../TCardTile/TCardTile.model'
import type { MenuItem } from '../../navigation/TContextMenu/TContextMenu.model'

export interface TCardFlowGridProps {
  cards: TCardTile[]
  scrollDirection?: 'horizontal' | 'vertical'
  editMode?: boolean
  selectionMode?: boolean
  selectedTileIds?: Set<string>
  isLoading?: boolean
  minTileSize?: number
  maxTileSize?: number
  gap?: number
  centerItems?: boolean
  getContextMenu?: (card: TCardTile, index: number) => MenuItem[]
}

export interface TCardFlowGridEmits {
  'card-click': [card: TCardTile, index: number]
  'card-dragstart': [event: DragEvent, card: TCardTile]
  'card-dragend': []
  'card-drop': [event: DragEvent, index: number]
}

// Layout configuration constants
export const VERTICAL_PADDING = 80 // 64px (4rem) + 16px (typical --spacing value)

// Screen size breakpoints
export const SCREEN_BREAKPOINTS = {
  LARGE: 1200,
  MEDIUM: 768
} as const

// Layout mappings: [columns, rows]
export const LAYOUT_MAPPINGS: Record<number, { 
  large: [number, number], 
  medium: [number, number], 
  small: [number, number] 
}> = {
  1: { large: [1, 1], medium: [1, 1], small: [1, 1] },
  2: { large: [2, 1], medium: [2, 1], small: [1, 2] },
  3: { large: [3, 1], medium: [3, 1], small: [2, 2] }, // 3 in a row on large screens
  4: { large: [2, 2], medium: [2, 2], small: [2, 2] },
  5: { large: [3, 2], medium: [3, 2], small: [2, 3] },
  6: { large: [3, 2], medium: [3, 2], small: [2, 3] },
  7: { large: [4, 2], medium: [3, 3], small: [2, 4] },
  8: { large: [4, 2], medium: [3, 3], small: [2, 4] },
  9: { large: [3, 3], medium: [3, 3], small: [3, 3] },
  10: { large: [5, 2], medium: [4, 3], small: [3, 4] },
  11: { large: [4, 3], medium: [4, 3], small: [3, 4] },
  12: { large: [4, 3], medium: [4, 3], small: [3, 4] },
}

// Helper function to get preferred layout
export const getPreferredLayout = (itemCount: number, screenWidth: number): [number, number] => {
  // Define breakpoints
  const isLarge = screenWidth >= SCREEN_BREAKPOINTS.LARGE
  const isMedium = screenWidth >= SCREEN_BREAKPOINTS.MEDIUM && screenWidth < SCREEN_BREAKPOINTS.LARGE
  const isSmall = screenWidth < SCREEN_BREAKPOINTS.MEDIUM
  
  // Get the appropriate layout or calculate for larger numbers
  if (LAYOUT_MAPPINGS[itemCount]) {
    if (isLarge) return LAYOUT_MAPPINGS[itemCount].large
    if (isMedium) return LAYOUT_MAPPINGS[itemCount].medium
    return LAYOUT_MAPPINGS[itemCount].small
  }
  
  // For larger numbers, calculate based on screen size
  if (isLarge) {
    const cols = Math.min(8, Math.ceil(Math.sqrt(itemCount * 1.5)))
    return [cols, Math.ceil(itemCount / cols)]
  } else if (isMedium) {
    const cols = Math.min(6, Math.ceil(Math.sqrt(itemCount * 1.2)))
    return [cols, Math.ceil(itemCount / cols)]
  } else {
    const cols = Math.min(4, Math.ceil(Math.sqrt(itemCount)))
    return [cols, Math.ceil(itemCount / cols)]
  }
}