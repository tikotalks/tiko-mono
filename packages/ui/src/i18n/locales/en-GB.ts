import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { en } from './base/en'

export const enGB: TranslationSchema = extendLocale(en, {
  // British English specific overrides
  cards: {
    backgroundColor: 'Background Colour',
    customColor: 'Custom colour',
    selectCardsToOrganize: 'Select cards to organise or delete'
  },
  yesno: {
    removeFromFavorites: 'Remove from favourites',
    addToFavorites: 'Add to favourites'
  },
  todo: {
    askParentCreate: 'Ask a parent to organise your first todo list!',
    colorOptional: 'Colour (optional)'
  },
  radio: {
    customThumbnailUrl: 'Custom thumbnail URL',
    markAsFavorite: 'Mark as favourite',
    favorites: 'Favourites',
    favorite: 'Favourite'
  },
  profile: {
    invalidFileType: 'Please select a valid image file',
    clickToChangeAvatar: 'Click to change avatar'
  },
  uiDocs: {
    colors: 'Colours',
    colorsDocumentation: 'Colours Documentation',
    colorSystem: 'Colour System',
    colorPaletteThemes: 'Colour palettes, themes and semantic colours'
  }
})