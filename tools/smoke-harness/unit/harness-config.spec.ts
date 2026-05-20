import { describe, expect, it } from 'vitest'

const defaultApps = ['cards', 'sequence', 'type', 'yes-no', 'radio', 'tiko', 'timer', 'todo']

describe('smoke harness defaults', () => {
  it('covers every Tiko app by default', () => {
    expect(defaultApps).toEqual(['cards', 'sequence', 'type', 'yes-no', 'radio', 'tiko', 'timer', 'todo'])
  })
})
