// Re-export types from core package for consistency
export type { MediaSourceType, MediaFieldValue } from '@tiko/core'

// Additional admin-specific types
export interface MediaFieldMultipleValue {
  items: import('@tiko/core').MediaFieldValue[];
}

// Re-export normalized function from core
import { mediaSourceService } from '@tiko/core'

export const normalizeMediaValue = mediaSourceService.normalizeMediaValue.bind(mediaSourceService)