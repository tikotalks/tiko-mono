import { describe, it, expect } from 'vitest'
import { defineConfig } from './defineConfig'

describe('defineConfig', () => {
  it('returns the config object as-is', () => {
    const config = {
      appId: 'test-app',
      appName: 'Test App',
      appIcon: 'test-icon.png'
    }
    
    const result = defineConfig(config)
    
    expect(result).toBe(config)
    expect(result).toEqual(config)
  })

  it('accepts optional properties', () => {
    const config = {
      appId: 'test-app',
      appName: 'Test App',
      appIcon: 'test-icon.png',
      description: 'A test application',
      primaryColor: '#ff0000',
      auth: {
        required: true,
        providers: ['email', 'apple'] as ('email' | 'apple')[]
      }
    }
    
    const result = defineConfig(config)
    
    expect(result.description).toBe('A test application')
    expect(result.primaryColor).toBe('#ff0000')
    expect(result.auth?.required).toBe(true)
    expect(result.auth?.providers).toEqual(['email', 'apple'])
  })

  it('works with minimal config', () => {
    const minimalConfig = {
      appId: 'minimal',
      appName: 'Minimal App',
      appIcon: 'icon.png'
    }
    
    const result = defineConfig(minimalConfig)
    
    expect(result.appId).toBe('minimal')
    expect(result.appName).toBe('Minimal App')
    expect(result.appIcon).toBe('icon.png')
    expect(result.description).toBeUndefined()
    expect(result.primaryColor).toBeUndefined()
    expect(result.auth).toBeUndefined()
  })
})