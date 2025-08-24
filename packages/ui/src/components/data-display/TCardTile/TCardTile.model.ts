import { Icons } from "open-icon";
import { Colors } from "../../../types/color";

export const CardTileType = {
  RESPONSE: 'response',
  QUESTION: 'question',
  GHOST: 'ghost'
} as const;
export type CardTileType = (typeof CardTileType)[keyof typeof CardTileType];

export interface TCardTile {
  id: string;
  title: string;
  icon?: Icons;
  color?: Colors;
  type?: CardTileType;
  image?: string;
  speech?: string;
  index?: number;
  parentId?: string;
  base_locale?: string;
  effective_locale?: string; // The locale of the content being displayed (from translation)
  isPublic?: boolean;
  isCurated?: boolean;
  isHidden?: boolean; // Item is hidden but being shown with opacity
  has_children?: boolean; // Performance optimization: indicates if this card has child cards
  updated_at?: string; // Timestamp for tracking recent modifications
  ownerId?: string; // ID of the user who owns this card
  user_id?: string; // Legacy field for compatibility
}

export interface GridPosition {
  row: number;
  col: number;
  isRight: boolean;
  isLeft: boolean;
  isBottom: boolean;
  isTop: boolean;
  totalRows: number;
  totalCols: number;
}

export interface TCardTileProps {
  card: TCardTile;
  showImage?: boolean;
  showTitle?: boolean;
  showStatus?: boolean;
  editMode?: boolean;
  isEmpty?: boolean;
  hasChildren?: boolean;
  children?: TCardTile[];
  isSelected?: boolean;
  selectionMode?: boolean;
  contextMenu?: any[];
  customState?: string;
  gridPosition?: GridPosition;
}
