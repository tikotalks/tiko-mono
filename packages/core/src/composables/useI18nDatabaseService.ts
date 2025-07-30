// Import the new i18n database translation service
import { translationService } from '../services/translation.service'

/**
 * Composable for using the new i18n database translation service
 * Provides access to database-driven translation management
 */
export function useI18nDatabaseService() {
  return translationService
}

export { translationService as i18nDatabaseService }