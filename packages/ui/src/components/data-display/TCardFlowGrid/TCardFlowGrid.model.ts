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