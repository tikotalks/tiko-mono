import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { en } from './base/en'

export const enCA: TranslationSchema = extendLocale(en, {
  // Canadian English specific overrides (mix of British and American conventions)
  cards: {
    backgroundColor: 'Background Colour',
    customColor: 'Custom colour',
    selectCardsToOrganize: 'Select cards to organize or delete' // Uses American 'organize'
  },
  yesno: {
    removeFromFavorites: 'Remove from favourites',
    addToFavorites: 'Add to favourites'
  },
  todo: {
    askParentCreate: 'Ask a parent to organize your first todo list!', // American 'organize'
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