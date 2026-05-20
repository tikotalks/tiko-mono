import { describe, expect, it } from 'vitest'

const defaultApps = ['timer', 'todo']

describe('smoke harness defaults', () => {
  it('covers at least two apps by default', () => {
    expect(defaultApps).toContain('timer')
    expect(defaultApps).toContain('todo')
    expect(defaultApps.length).toBeGreaterThanOrEqual(2)
  })
})
