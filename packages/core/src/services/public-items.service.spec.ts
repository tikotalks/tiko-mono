/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { publicItemService } from './public-items.service'

const mockFetch = vi.fn()

describe('publicItemService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'anon-key')
  })

  it('normalizes joined custom order values from user_item_order', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: 'item-1',
            user_id: 'user-1',
            app_name: 'sequence',
            type: 'sequence',
            name: 'Item 1',
            order_index: 0,
            created_at: '2025-01-01T00:00:00.000Z',
            updated_at: '2025-01-01T00:00:00.000Z',
            user_item_order: [{ custom_index: 7 }],
          },
        ]),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    )

    const items = await publicItemService.getPublicItems({
      appName: 'sequence',
      userId: 'user-1',
    })

    expect(items[0]).toMatchObject({
      custom_index: 7,
      owner_id: 'user-1',
    })
  })

  it('creates a new custom order when no order exists yet', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      )

    await publicItemService.saveUserItemOrder('user-1', 'item-1', 3)

    expect(mockFetch.mock.calls[0][0]).toContain('user_item_order?')
    expect(mockFetch.mock.calls[1][0]).toContain('/rest/v1/user_item_order')
    expect(mockFetch.mock.calls[1][1]).toMatchObject({
      method: 'POST',
    })
  })
})
