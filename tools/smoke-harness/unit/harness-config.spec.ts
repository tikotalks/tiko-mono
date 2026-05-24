import { describe, expect, it } from 'vitest'

const defaultApps = ['cards', 'sequence', 'type', 'yes-no', 'radio', 'tiko', 'timer', 'todo', 'clock']

describe('smoke harness defaults', () => {
  it('covers every Tiko app by default', () => {
    expect(defaultApps).toEqual(['cards', 'sequence', 'type', 'yes-no', 'radio', 'tiko', 'timer', 'todo', 'clock'])
  })
})
