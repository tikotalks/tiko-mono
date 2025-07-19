import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { en } from './base/en'

export const enAU: TranslationSchema = extendLocale(en, {
  // Australian English specific overrides (uses British spelling conventions)
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
    markAsFavorite: 'Mark as favourite',
    favorites: 'Favourites',
    favorite: 'Favourite'
  },
  uiDocs: {
    colors: 'Colours',
    colorsDocumentation: 'Colours Documentation',
    colorSystem: 'Colour System',
    colorPaletteThemes: 'Colour palettes, themes and semantic colours'
  }
})