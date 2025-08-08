// Components
export * from './components/TButton'
export * from './components/TIcon'
export * from './components/TCard'

// Icon Registry for tree-shaking
export { IconRegistryPlugin, useIconRegistry } from './icons'
export type { IconRegistry, IconRegistryPluginOptions } from './icons'
// Re-export Icons type to avoid direct open-icon imports in apps
// Commenting out to fix vite-plugin-pwa build issue
// export type { Icons } from 'open-icon'
// export { Icons as IconList } from 'open-icon'

export * from './components/TInput'
export * from './components/TLoginForm'
export * from './components/TAuthWrapper'
export * from './components/TTopBar'
export * from './components/TContextMenu'
export * from './components/TAppLayout'
export * from './components/TPopup'
export * from './components/TProfile'
export * from './components/TParentMode'
export * from './components/TDraggableList'
export * from './components/TDragList'
export * from './components/TToggle'
export * from './components/TSplashScreen'
export * from './components/TFramework'
export * from './components/TTikoLogo'
export * from './components/TLogo'
export * from './components/TSSOButton'
export * from './components/TSpinner'
export * from './components/TAlert'
export * from './components/TChooseLanguage'
export * from './components/TUserSettings'
export * from './components/TAuthCallback'
export * from './components/TPinInput'
export * from './components/TNumberPad'
export * from './components/TChip'
export * from './components/TMediaTile'
export * from './components/TList'
export * from './components/TListItem'
export * from './components/TListCell'
export * from './components/TOrderableList'
export * from './components/TGrid'
export * from './components/TNavigation'
export * from './components/TViewToggle'
export * from './components/TStatusBar'
export * from './components/TProgressBar'
export * from './components/TKeyValue'
export * from './components/TText'

export { default as TInputText } from './components/TForm/inputs/TInputText/TInputText.vue';
export { default as TInputNumber } from './components/TForm/inputs/TInputNumber/TInputNumber.vue';
export { default as TInputEmail } from './components/TForm/InputEmail/InputEmail.vue';
export { default as TInputRange } from './components/TForm/InputRange.vue';
export { default as TInputTextArea } from './components/TForm/InputTextArea.vue';
export { default as TInputSelect } from './components/TForm/inputs/TInputSelect/TInputSelect.vue';
export { default as TInputCheckbox } from './components/TForm/inputs/TInputCheckbox/TInputCheckbox.vue';
export { default as TInputRadio } from './components/TForm/inputs/TInputRadio/TInputRadio.vue';
export { default as TTextArea } from './components/TForm/inputs/TInputTextArea/TInputTextArea.vue';
export { default as TFormGroup } from './components/TForm/TFormGroup.vue';
export { default as TFormField } from './components/TForm/TFormField.vue';
// export * from './components/TRichTextEditor'; // Temporarily disabled until TipTap deps are installed

// TrustCafe-style components with T prefix (temporarily disabled due to import issues)
// export * from './components/TForm'
// export * from './components/TBanner'
export * from './components/TToast'
// export * from './components/TChip'
// export * from './components/TToolTip'

// Specialized Components
export { default as TCardCommunication } from './components/TCard/TCardCommunication.vue'
export type { Card } from './components/TCard/TCardCommunication.ts'

// Empty State Components
export { default as TEmpty } from './components/TEmpty/TEmpty.vue'
export type { TEmptyProps } from './components/TEmpty/TEmpty.model'
export { default as TEmptyState } from './components/TEmptyState/TEmptyState.vue'
export type { TEmptyStateProps } from './components/TEmptyState/TEmptyState.model'

// Header Component
export { default as THeader } from './components/THeader/THeader.vue'
export type { THeaderProps } from './components/THeader/THeader.model'
export { default as TI18nDebug } from './components/TI18nDebug/TI18nDebug.vue'
export type { TI18nDebugProps } from './components/TI18nDebug/TI18nDebug.model'

// Composables
export { useI18n } from './composables/useI18n'
export { i18nDevtoolsPlugin, useI18nDevtools } from './composables/useI18nDevtools'
export { initializeDatabaseKeys, getDatabaseKeys, databaseKeys } from './i18n/database-keys'
export type { TranslationKey } from './i18n/types'

// Stores
export { useI18nStore } from './stores/i18n.store'
export type { I18nState } from './stores/i18n.store'
export { useEventBus, createEventBus } from '@tiko/core'
export { useTextToSpeech } from './composables/useTextToSpeech'
export type {
  EventMap,
  EventHandler,
  EventBusComposable,
  TikoEvents
} from '@tiko/core'
export { useId, useIds, useFormIds } from './composables/useId'
export { useParentMode } from './composables/useParentMode'
export type {
  ParentModeState,
  ParentModeSettings,
  ParentModeAppPermissions,
  ParentModeResponse,
  ParentModeToggleProps,
  ParentModePinInputProps
} from './composables/useParentMode.model'
export { useTikoConfig } from './composables/useTikoConfig'
export { useDraggable } from './composables/useDraggable'
export type { DraggableItem, UseDraggableOptions } from './composables/useDraggable'
export { useLocalStorage, storage } from './composables/useLocalStorage'
export { useBuildInfo } from './composables/useBuildInfo'
export type { BuildInfo } from './composables/useBuildInfo'

// Utilities
export * from './utils'
export * from './utils/splash-screen-config'

// Types
export * from './types'

// Re-export icon types and utilities for documentation

// Router utilities
export { createAppRouter } from './router/createAppRouter'
export type { AppRouterOptions } from './router/createAppRouter'
