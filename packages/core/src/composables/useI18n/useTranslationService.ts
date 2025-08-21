// Import the new translation service directly to avoid conflicts
import { translationService } from '../../services/translation.service'

/**
 * Composable for using the translation service
 * Provides easy access to translation management functions
 */
export function useTranslationService() {
  return translationService
}

export { translationService }
