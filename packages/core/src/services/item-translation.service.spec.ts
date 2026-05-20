/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { itemTranslationService } from './item-translation.service'

const mockFetch = vi.fn()

describe('itemTranslationService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
    vi.stubEnv('VITE_ITEMS_API_URL', 'https://example.tikoapi.org')
    vi.stubEnv('VITE_ITEMS_API_TOKEN', 'anon-key')
  })

  it('falls back from a locale variant to the base locale', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              item_id: 'item-1',
              locale: 'en',
              name: 'Hello',
              content: 'Hello there',
            },
          ]),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )

    const translation = await itemTranslationService.getTranslation('item-1', 'en-GB')

    expect(translation?.locale).toBe('en')
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch.mock.calls[0][0]).toContain('locale=eq.en-GB')
    expect(mockFetch.mock.calls[1][0]).toContain('locale=eq.en')
  })

  it('applies translated fields to items', () => {
    const items = [
      {
        id: 'item-1',
        name: 'Base name',
        content: 'Base content',
        base_locale: 'en',
        effective_locale: 'en',
      },
    ]

    const result = itemTranslationService.applyTranslations(items, [
      {
        item_id: 'item-1',
        locale: 'nl',
        name: 'Naam',
        content: 'Inhoud',
      },
    ])

    expect(result[0]).toMatchObject({
      name: 'Naam',
      content: 'Inhoud',
      effective_locale: 'nl',
    })
  })
})
