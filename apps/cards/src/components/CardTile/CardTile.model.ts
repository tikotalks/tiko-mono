import { Icons } from "open-icon";
import { Colors, randomColor, randomIcon } from "../../../../../packages/ui/src";
import { mockId, mockTitle, mockImage, mockSpeech } from "@tiko/ui";

export const CardTileType = {
  RESPONSE: 'response',
  QUESTION: 'question'
} as const;
export type CardTileType = (typeof CardTileType)[keyof typeof CardTileType];


export interface CardTile {
  id: string;
  title: string;
  icon?: Icons;
  color?: Colors;
  type?: CardTileType;
  image?: string;
  speech?: string;
  index?: number;
  parentId?: string;
}

export const mockCardTile = (index: number = 0): CardTile => {
  return {
    id: mockId(index),
    title: mockTitle(index),
    icon: randomIcon(),
    color: randomColor(),
    type: CardTileType.QUESTION,
    image: mockImage(index),
    speech: mockSpeech(index),
    index: index,
  };
}

