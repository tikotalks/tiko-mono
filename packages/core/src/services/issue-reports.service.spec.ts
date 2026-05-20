/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { issueReportsService } from './issue-reports.service'

const mockFetch = vi.fn()

describe('issueReportsService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    vi.stubEnv('VITE_ISSUE_REPORTS_API_URL', 'https://example.tikoapi.org')
  })

  it('requests issue reports through the shared backend layer', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    await issueReportsService.getReports({
      app: 'sequence',
      type: 'bug',
      search: 'broken',
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        '/rest/v1/issue_reports?order=created_at.desc&app_name=eq.sequence&issue_type=eq.bug'
      ),
      expect.objectContaining({
        credentials: 'include',
        headers: expect.any(Headers),
      })
    )
  })
})
