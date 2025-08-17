// Services (New clean API layer)
export * from './services'

// Stores
export * from './stores/auth'
export * from './stores/app'
export { useFavoritesStore } from './stores/favorites.store'
export { useCollectionsStore, type Collection } from './stores/collections.store'
export { useEditModeStore } from './stores/editMode'

// Auth API (excluding types that are already exported from services)
export { authAPI } from './lib/auth-api'

// Composables
export { useSSO } from './composables/useSSO'
export type { SSOOptions } from './composables/useSSO'
export { useEditMode } from './composables/useEditMode'
export { useSpeak } from './composables/useSpeak'
export type { SpeakOptions } from './composables/useSpeak'
export { useItems } from './composables/useItems'
export type { UseItemsOptions, UseItemsReturn } from './composables/useItems'
export { useImageUrl } from './composables/useImageUrl'
export type { ImageVariants, ImageUrlOptions } from './composables/useImageUrl'
export { useImages, ImageLibraryType } from './composables/useImages'
export type { UseImagesReturn, ImageStats, UseImagesOptions } from './composables/useImages'
export { useUserSettings } from './composables/useUserSettings'
export type { UseUserSettingsReturn } from './composables/useUserSettings'
export { useUpload } from './composables/useUpload'
export type { UploadItem } from './composables/useUpload'
export { useEventBus, createEventBus } from './composables/useEventBus'
export type {
  EventMap,
  EventHandler,
  EventBusComposable,
  TikoEvents
} from './composables/useEventBus.model'
export { useTranslationService } from './composables/useTranslationService'
export { useI18nDatabaseService } from './composables/useI18nDatabaseService'
export { useUserPreferences } from './composables/useUserPreferences'
export type { UserPreferences, ListPreferences } from './composables/useUserPreferences'
export { useContent } from './composables/useContent'
export type { PageContent, UseContentOptions } from './composables/useContent'
export { useSentenceBuilder, useSentenceBuilders } from './composables/useSentenceBuilder'
export type { UseSentenceBuilderOptions, UseSentenceBuilderReturn } from './composables/useSentenceBuilder'

// Constants
export * from './constants'

// Types
export * from './types/user'

// Utils
export * from './utils/format'
export * from './utils/logger'
// Export everything except ContentField from field-processing (ContentField is exported from services)
export { 
  processContentFields,
  processFieldValue,
  processListFieldValue
} from './utils/field-processing'
export { createTikoApp } from './utils/createTikoApp'
export type { TikoAppOptions } from './utils/createTikoApp'
export { defineConfig } from './utils/defineConfig'
export type { TikoConfig } from './utils/defineConfig'
