import type { TCardTile } from './TCardTile.model';
import { mockId, mockTitle, mockImage, mockSpeech, randomColor, randomIcon } from '../../../utils/mock';
import { CardTileType } from './TCardTile.model';

export const mockCardTile = (index: number = 0): TCardTile => {
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
};