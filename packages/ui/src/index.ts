// Components
export * from './components/ui-elements/TButton'
export * from './components/ui-elements/TIcon'
export * from './components/ui-elements/TCard'

// Icon Registry for tree-shaking
export { IconRegistryPlugin, useIconRegistry } from './icons'
export type { IconRegistry, IconRegistryPluginOptions } from './icons'
// Re-export Icons type to avoid direct open-icon imports in apps
// Commenting out to fix vite-plugin-pwa build issue
// export type { Icons } from 'open-icon'
// export { Icons as IconList } from 'open-icon'

export * from './components/forms/TInput'
export * from './components/auth/TLoginForm'
export * from './components/auth/TAuthWrapper'
export * from './components/media/TAvatar'
export * from './components/media/TImage'
export * from './components/navigation/TUserMenu'
export * from './components/layout/TTopBar'
export * from './components/navigation/TContextMenu'
export * from './components/layout/TAppLayout'
export * from './components/feedback/TPopup'
export * from './components/feedback/TOfflineIndicator'
export * from './components/user/TProfile'
export * from './components/auth/TParentMode'
export * from './components/data-display/TDraggableList'
export * from './components/data-display/TDragList'
export * from './components/data-display/TCardTile'
export * from './components/data-display/TCardGrid'
export * from './components/data-display/TCardFlowGrid'
export * from './components/data-display/TCardGhostTile'
export * from './components/forms/TToggle'
export * from './components/feedback/TSplashScreen'
export * from './components/layout/TFramework'
export * from './components/ui-elements/TTikoLogo'
export * from './components/ui-elements/TLogo'
export * from './components/auth/TSSOButton'
export * from './components/feedback/TSpinner'
export * from './components/feedback/TAlert'
export * from './components/user/TChooseLanguage'
export * from './components/user/TUserSettings'
export * from './components/auth/TAuthCallback'
export * from './components/forms/TPinInput'
export * from './components/forms/TNumberPad'
export * from './components/ui-elements/TChip'
export * from './components/media/TMediaTile'
export * from './components/media/TMediaPicker'
export * from './components/media/TMediaSelector'
export { default as TUploadStatus } from './components/media/TUploadStatus/TUploadStatus.vue'
export * from './components/data-display/TList'
export * from './components/data-display/TListItem'
export * from './components/data-display/TListCell'
export * from './components/data-display/TOrderableList'
export * from './components/layout/TGrid'
export * from './components/navigation/TNavigation'
export * from './components/user/TViewToggle'
export * from './components/layout/TStatusBar'
export * from './components/content/TPageContent'
export * from './components/content/TSectionRenderer'
export * from './components/feedback/TProgressBar'
export * from './components/content/TKeyValue'
export * from './components/content/TText'
export * from './components/data-display/TCountUp'
export * from './components/content/TMarkdownRenderer'
export * from './components/layout/TVirtualGrid'

export { default as TInputText } from './components/forms/TForm/inputs/TInputText/TInputText.vue';
export { default as TInputNumber } from './components/forms/TForm/inputs/TInputNumber/TInputNumber.vue';
export { default as TInputEmail } from './components/forms/TForm/InputEmail/InputEmail.vue';
export { default as TInputRange } from './components/forms/TForm/InputRange.vue';
export { default as TInputTextArea } from './components/forms/TForm/InputTextArea.vue';
export { default as TInputSelect } from './components/forms/TForm/inputs/TInputSelect/TInputSelect.vue';
export { default as TInputCheckbox } from './components/forms/TForm/inputs/TInputCheckbox/TInputCheckbox.vue';
export { default as TInputRadio } from './components/forms/TForm/inputs/TInputRadio/TInputRadio.vue';
export { default as TInputSwitch } from './components/forms/TForm/inputs/TInputSwitch/TInputSwitch.vue';
export { default as TTextArea } from './components/forms/TForm/inputs/TInputTextArea/TInputTextArea.vue';
export { default as TFormGroup } from './components/forms/TForm/TFormGroup.vue';
export { default as TFormField } from './components/forms/TForm/TFormField.vue';
export { default as TColorPicker } from './components/forms/TColorPicker/TColorPicker.vue';
export * from './components/forms/TColorPickerPopup';
export { default as TImageInput } from './components/forms/TImageInput/TImageInput.vue';
export { default as TForm } from './components/forms/TForm/TForm.vue';
export { default as TFormActions } from './components/forms/TFormActions/TFormActions.vue';
export { default as TTextarea } from './components/forms/TForm/inputs/TInputTextArea/TInputTextArea.vue';
// export * from './components/forms/TRichTextEditor'; // Temporarily disabled until TipTap deps are installed

// TrustCafe-style components with T prefix (temporarily disabled due to import issues)
// ============================================
// Specialized Components
// ============================================
export { default as TCardCommunication } from './components/ui-elements/TCard/TCardCommunication.vue'
export type { Card } from './components/ui-elements/TCard/TCardCommunication.ts'

// Empty State Components
export { default as TEmpty } from './components/feedback/TEmpty/TEmpty.vue'
export type { TEmptyProps } from './components/feedback/TEmpty/TEmpty.model'
export { default as TEmptyState } from './components/feedback/TEmptyState/TEmptyState.vue'
export type { TEmptyStateProps } from './components/feedback/TEmptyState/TEmptyState.model'

// ============================================
// Additional Specific Component Exports
// ============================================
// Header Component
export { default as THeader } from './components/layout/THeader/THeader.vue'
export type { THeaderProps } from './components/layout/THeader/THeader.model'

// Development Tools
export { default as TI18nDebug } from './components/dev-tools/TI18nDebug/TI18nDebug.vue'
export type { TI18nDebugProps } from './components/dev-tools/TI18nDebug/TI18nDebug.model'

// Composables
export { useI18n } from './composables/useI18n'
export { i18nDevtoolsPlugin, useI18nDevtools } from './composables/useI18nDevtools'
export { initializeDatabaseKeys, getDatabaseKeys, databaseKeys } from './i18n/database-keys'
export type { TranslationKey } from './i18n/types'

// Stores
export { useI18nStore } from './stores/i18n.store'
export type { I18nState } from './stores/i18n.store'
export { useParentModeStore } from './stores/parentMode'
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
export { usePWAUpdate } from './composables/usePWAUpdate'
export type { PWAUpdateOptions } from './composables/usePWAUpdate'

// Sections
export * from './sections'

// Utilities
export * from './utils'
export * from './utils/splash-screen-config'

// Types
export * from './types'

// Re-export icon types and utilities for documentation

// Router utilities
export { createAppRouter } from './router/createAppRouter'
export type { AppRouterOptions } from './router/createAppRouter'
