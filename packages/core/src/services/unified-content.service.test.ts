import { describe, expect, it } from 'vitest'
import { UnifiedContentService } from './unified-content.service'

describe('UnifiedContentService', () => {
  it('constructs without requiring external API configuration', () => {
    const service = new UnifiedContentService({ apiUrl: 'https://example.tikoapi.org' })

    expect(service).toBeInstanceOf(UnifiedContentService)
  })

  it('exposes cache-compatible no-op methods used by legacy callers', () => {
    const service = new UnifiedContentService({ apiUrl: 'https://example.tikoapi.org' })

    expect(service.getCacheStats()).toEqual({ enabled: false, size: 0 })
    expect(() => service.clearCache()).not.toThrow()
  })
})
