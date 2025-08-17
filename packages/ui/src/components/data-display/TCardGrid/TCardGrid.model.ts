import type { TCardTile } from '../TCardTile/TCardTile.model'

export interface TCardGridProps {
  cards: Array<TCardTile>;
  showArrows?: boolean;
  editMode?: boolean;
  tilesWithChildren?: Set<string>;
  tileChildrenMap?: Map<string, TCardTile[]>;
  isTileDragging?: boolean;
  selectionMode?: boolean;
  selectedTileIds?: Set<string>;
  isLoading?: boolean;
  getContextMenu?: (card: TCardTile, index: number) => any[];
}