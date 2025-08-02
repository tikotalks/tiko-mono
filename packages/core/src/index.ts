// Services (New clean API layer)
export * from './services'

// Stores
export * from './stores/auth'
export * from './stores/app'

// Auth API (excluding types that are already exported from services)
export { authAPI } from './lib/auth-api'

// Composables
export { useSSO } from './composables/useSSO'
export type { SSOOptions } from './composables/useSSO'
export { useItems } from './composables/useItems'
export type { UseItemsOptions, UseItemsReturn } from './composables/useItems'
export { useImageUrl } from './composables/useImageUrl'
export type { ImageVariants, ImageUrlOptions } from './composables/useImageUrl'
export { useImages } from './composables/useImages'
export type { UseImagesReturn, ImageStats } from './composables/useImages'
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
export { createTikoApp } from './utils/createTikoApp'
export type { TikoAppOptions } from './utils/createTikoApp'
export { defineConfig } from './utils/defineConfig'
export type { TikoConfig } from './utils/defineConfig'
