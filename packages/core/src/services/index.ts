/**
 * Services Layer
 * 
 * This layer abstracts all backend operations from the UI components.
 * It provides a clean API that can be easily swapped out when changing backends.
 * 
 * Current implementation uses localStorage and direct API calls to bypass
 * the broken Supabase SDK, but can be easily replaced with any other backend.
 * 
 * @see {@link file://./README.md} for detailed documentation
 */

// Export all service interfaces and types
export * from './auth.service'
export * from './parent-mode.service'
export * from './user-settings.service'
export * from './item.service'
export * from './file.service'
export * from './media.service'
export * from './media-analysis.service'
export * from './user.service'
export * from './translation.service'
export * from './gpt-translation.service'
export * from './collections.service'

// Export Supabase implementations
export { SupabaseParentModeService } from './parent-mode-supabase.service'
export { SupabaseUserSettingsService } from './user-settings-supabase.service'
export { SupabaseItemService } from './item-supabase.service'
export { SupabaseMediaService } from './media-supabase.service'
export { collectionsSupabaseService } from './collections-supabase.service'

// Export active service instances
// Currently using localStorage implementations due to Supabase SDK issues
// To switch to Supabase, uncomment the Supabase imports and comment out localStorage ones
export { authService } from './auth.service'
export { authSyncService } from './auth-sync.service'
export { parentModeService } from './parent-mode.service'
export { userSettingsService } from './user-settings.service'
export { itemService } from './item.service'
export { fileService } from './file.service'
export { mediaService } from './media-supabase.service'
export { mediaAnalysisService } from './media-analysis.service'
export { userService } from './user.service'
export { translationService } from './translation.service'
export { gptTranslationService } from './gpt-translation.service'
export { collectionsSupabaseService as collectionsService } from './collections-supabase.service'
export { contentService } from './content.service'
export type { 
  ContentProject, 
  SectionTemplate, 
  ContentField,
  ItemFieldConfig,
  ItemSubField,
  PageTemplate, 
  ContentPage, 
  PageSection, 
  FieldValue,
  ContentSection,
  ContentPageSection,
  ContentData,
  Language,
  ItemTemplate,
  Item,
  ItemData,
  LinkedItem
} from './content.service'
export { sentenceService } from './sentence.service'
export type {
  SentencePrediction,
  SentencePredictResponse,
  SentenceSelectRequest,
  SentenceSelectResponse
} from './sentence.service'
export { deploymentService } from './deployment.service'
export type {
  DeploymentTarget,
  DeploymentHistory,
  GitHubWorkflowRun
} from './deployment.service'
export { backupService } from './backup.service'
export type {
  DatabaseBackup,
  CreateBackupRequest
} from './backup.service'
export { ContentWorkerService } from './content-worker.service'
export type { ContentWorkerConfig } from './content-worker.service'
export { UnifiedContentService } from './unified-content.service'
export type { UnifiedContentConfig, QueryOptions, FullPageContent, FullSectionContent, FullItemContent } from './unified-content.service'

// Alternative: Export Supabase implementations
// import { SupabaseParentModeService } from './parent-mode-supabase.service'
// import { SupabaseUserSettingsService } from './user-settings-supabase.service'
// export const parentModeService = new SupabaseParentModeService()
// export const userSettingsService = new SupabaseUserSettingsService()