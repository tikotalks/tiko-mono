import { describe, it, expect } from 'vitest'
import { defineConfig } from './defineConfig'

describe('defineConfig', () => {
  it('merges the config object with Tiko defaults', () => {
    const config = {
      id: 'test-app',
      name: 'Test App',
      icon: { mediaId: 'test-icon', color: '#ff0000' }
    }

    const result = defineConfig(config)

    expect(result).not.toBe(config)
    expect(result.id).toBe('test-app')
    expect(result.name).toBe('Test App')
    expect(result.icon).toEqual({ mediaId: 'test-icon', color: '#ff0000' })
    expect(result.auth.required).toBe(false)
  })

  it('accepts optional properties', () => {
    const config = {
      id: 'test-app',
      name: 'Test App',
      icon: { mediaId: 'test-icon', color: '#ff0000' },
      description: 'A test application',
      theme: { primary: '#ff0000' },
      auth: {
        required: true,
        providers: ['email', 'apple'] as ('email' | 'apple')[]
      }
    }
    
    const result = defineConfig(config)
    
    expect(result.description).toBe('A test application')
    expect(result.theme.primary).toBe('#ff0000')
    expect(result.auth?.required).toBe(true)
    expect(result.auth?.providers).toEqual(['email', 'apple'])
  })

  it('works with minimal config', () => {
    const minimalConfig = {
      id: 'minimal',
      name: 'Minimal App',
      icon: { mediaId: 'icon', color: '#000000' }
    }
    
    const result = defineConfig(minimalConfig)
    
    expect(result.id).toBe('minimal')
    expect(result.name).toBe('Minimal App')
    expect(result.icon).toEqual({ mediaId: 'icon', color: '#000000' })
    expect(result.description).toBe('')
    expect(result.theme.primary).toBe('#6200ee')
    expect(result.auth.required).toBe(false)
  })
})