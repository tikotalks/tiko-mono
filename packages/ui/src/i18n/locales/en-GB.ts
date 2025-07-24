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
  },
  admin: {
    login: {
      title: 'Admin Login',
      subtitle: 'Admin and Editor access only',
      emailPlaceholder: 'Enter your email',
      passwordPlaceholder: 'Enter your password',
      accessInfo: 'This area is restricted to editors and administrators only.',
      noPermission: 'You do not have permission to access the admin panel. Only editors and administrators can use this tool.'
    },
    dashboard: {
      title: 'Admin Dashboard',
      totalImages: 'Total Images',
      storageUsed: 'Storage Used',
      lastUpload: 'Last Upload',
      uploadImages: 'Upload Images',
      uploadDescription: 'Add new images to the media library',
      viewLibrary: 'View Library',
      libraryDescription: 'Browse and manage existing media'
    },
    upload: {
      title: 'Upload Images',
      dropZone: 'Drop images here or click to select',
      selectFiles: 'Select Files',
      uploading: 'Uploading...',
      processing: 'Processing images...',
      complete: 'Upload complete!',
      dragDrop: 'Drag & drop images here',
      or: 'or',
      uploadQueue: 'Upload Queue',
      startUpload: 'Start Upload',
      clearQueue: 'Clear Queue',
      onlyImages: 'Only image files are allowed',
      uploadSuccess: '{name} uploaded successfully',
      uploadError: 'Failed to upload {name}'
    },
    library: {
      title: 'Media Library',
      search: 'Search media...',
      filter: 'Filter by',
      category: 'Category',
      tags: 'Tags',
      noImages: 'No images found'
    }
  }
})