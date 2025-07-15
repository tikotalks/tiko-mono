import { describe, it, expect } from 'vitest'

describe('Tiko App', () => {
  it('can run basic tests', () => {
    expect(true).toBe(true)
  })

  it('can handle basic math', () => {
    expect(2 + 2).toBe(4)
  })

  it('can handle string operations', () => {
    expect('hello'.toUpperCase()).toBe('HELLO')
  })
})