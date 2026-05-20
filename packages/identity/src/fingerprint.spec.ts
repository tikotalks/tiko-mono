import { describe, expect, it } from 'vitest'
import { normalizeFingerprint } from './fingerprint'

it('normalizes equivalent fingerprints to the same stable string', () => {
  expect(
    normalizeFingerprint({ appId: 'cards', userAgent: ' Mozilla/5.0 ', language: 'en-US,en;q=0.9', timezone: 'Europe/Amsterdam' })
  ).toBe(normalizeFingerprint({ appId: 'cards', userAgent: 'mozilla/5.0', language: 'en-us', timezone: 'europe/amsterdam' }))
})

describe('normalizeFingerprint', () => {
  it('sorts extra fields for deterministic hashes', () => {
    const a = normalizeFingerprint({ appId: 'todo', extra: { b: 2, a: 1 } })
    const b = normalizeFingerprint({ appId: 'todo', extra: { a: 1, b: 2 } })
    expect(a).toBe(b)
  })
})
