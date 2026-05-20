import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const storage: Record<string, string> = {}
let mockFetch: ReturnType<typeof vi.fn>

const loadService = async () => {
  vi.resetModules()
  const module = await import('./translation-versioned.service')
  return module.translationService
}

describe('translation versioned service auth session selection', () => {
  beforeEach(() => {
    mockFetch = vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }))
    vi.stubGlobal('fetch', mockFetch)
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { storage[key] = value }),
      removeItem: vi.fn((key: string) => { delete storage[key] }),
      clear: vi.fn(() => {
        for (const key of Object.keys(storage)) delete storage[key]
      })
    })
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'anon-key')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    for (const key of Object.keys(storage)) delete storage[key]
  })

  it('uses the Tiko identity session token for authenticated translation requests', async () => {
    storage.tiko_auth_session = JSON.stringify({ access_token: 'identity-token' })
    storage['supabase.auth.token'] = JSON.stringify({ access_token: 'legacy-supabase-token' })

    const service = await loadService()

    await service.getTranslations('en')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/i18n_translations?'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer identity-token'
        })
      })
    )
  })

  it('does not fall back to legacy supabase.auth.token when no Tiko identity session exists', async () => {
    storage['supabase.auth.token'] = JSON.stringify({ access_token: 'legacy-supabase-token' })

    const service = await loadService()

    await service.getTranslations('en')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/i18n_translations?'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer anon-key'
        })
      })
    )
  })
})
