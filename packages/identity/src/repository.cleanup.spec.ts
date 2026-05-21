import { describe, expect, it, vi } from 'vitest'
import { cleanupInactiveAnonymousUsers } from './repository'
import type { IdentityEnv } from './types'

function statement(result: unknown) {
  return {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn(),
    all: vi.fn(),
    run: vi.fn().mockResolvedValue(result)
  }
}

describe('cleanupInactiveAnonymousUsers', () => {
  it('deletes only anonymous unclaimed users inactive before the cutoff', async () => {
    const prepared = statement({ success: true, meta: { changes: 3 } })
    const prepare = vi.fn(() => prepared)
    const env = { IDENTITY_DB: { prepare } } as unknown as IdentityEnv

    const result = await cleanupInactiveAnonymousUsers(env, '2026-05-14T00:00:00.000Z')

    expect(result.deletedUsers).toBe(3)
    expect(prepare).toHaveBeenCalledWith(expect.stringContaining('primary_email is null'))
    expect(prepare).toHaveBeenCalledWith(expect.stringContaining('display_name is null'))
    expect(prepare).toHaveBeenCalledWith(expect.stringContaining('coalesce(last_seen_at, updated_at, created_at) < ?'))
    expect(prepared.bind).toHaveBeenCalledWith('2026-05-14T00:00:00.000Z')
  })
})
