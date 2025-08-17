import { Icons } from "open-icon";
import { Colors } from "../../../types/colors";

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
}

export interface TCardTileProps {
  card: TCardTile;
  showImage?: boolean;
  showTitle?: boolean;
  editMode?: boolean;
  isEmpty?: boolean;
  hasChildren?: boolean;
  children?: TCardTile[];
  isSelected?: boolean;
  selectionMode?: boolean;
  contextMenu?: any[];
}