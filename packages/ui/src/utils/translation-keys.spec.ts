import { describe, it, expect } from 'vitest'
import { parseTranslationKeys, extractKeys, createKeyValueMap } from './translation-keys'

describe('parseTranslationKeys', () => {
  describe('key:value format', () => {
    it('should parse basic key:value pairs', () => {
      const input = `admin.title:Title
admin.description:Description
admin.save:Save`

      const result = parseTranslationKeys(input)
      
      expect(result).toEqual([
        { key: 'admin.title', value: 'Title' },
        { key: 'admin.description', value: 'Description' },
        { key: 'admin.save', value: 'Save' }
      ])
    })

    it('should handle values with spaces and punctuation', () => {
      const input = `admin.welcome:Welcome to the admin panel
admin.question:Are you sure?
admin.instruction:Click here, then proceed`

      const result = parseTranslationKeys(input)
      
      expect(result).toEqual([
        { key: 'admin.welcome', value: 'Welcome to the admin panel' },
        { key: 'admin.question', value: 'Are you sure?' },
        { key: 'admin.instruction', value: 'Click here, then proceed' }
      ])
    })

    it('should handle values with colons', () => {
      const input = `time.format:Time: HH:mm
url.example:https://example.com
ratio.display:Aspect Ratio: 16:9`

      const result = parseTranslationKeys(input)
      
      expect(result).toEqual([
        { key: 'time.format', value: 'Time: HH:mm' },
        { key: 'url.example', value: 'https://example.com' },
        { key: 'ratio.display', value: 'Aspect Ratio: 16:9' }
      ])
    })

    it('should trim whitespace from keys and values', () => {
      const input = `  admin.title  :  Title with spaces  
admin.description:    Description   `

      const result = parseTranslationKeys(input)
      
      expect(result).toEqual([
        { key: 'admin.title', value: 'Title with spaces' },
        { key: 'admin.description', value: 'Description' }
      ])
    })

    it('should skip empty lines', () => {
      const input = `admin.title:Title

admin.description:Description

admin.save:Save`

      const result = parseTranslationKeys(input)
      
      expect(result).toHaveLength(3)
    })

    it('should handle mixed format (some with values, some without)', () => {
      const input = `admin.title:Title
admin.placeholder
admin.save:Save`

      const result = parseTranslationKeys(input)
      
      expect(result).toEqual([
        { key: 'admin.title', value: 'Title' },
        { key: 'admin.placeholder', value: '' },
        { key: 'admin.save', value: 'Save' }
      ])
    })

    it('should skip lines that start with colon', () => {
      const input = `admin.title:Title
:invalid line
admin.save:Save`

      const result = parseTranslationKeys(input)
      
      expect(result).toEqual([
        { key: 'admin.title', value: 'Title' },
        { key: 'admin.save', value: 'Save' }
      ])
    })

    it('should remove duplicate keys (keeping first occurrence)', () => {
      const input = `admin.title:Title
admin.title:Different Title
admin.save:Save`

      const result = parseTranslationKeys(input)
      
      expect(result).toEqual([
        { key: 'admin.title', value: 'Title' },
        { key: 'admin.save', value: 'Save' }
      ])
    })
  })

  describe('simple key format', () => {
    it('should parse comma-separated keys', () => {
      const input = 'admin.title, admin.description, admin.save'

      const result = parseTranslationKeys(input)
      
      expect(result).toEqual([
        { key: 'admin.title', value: '' },
        { key: 'admin.description', value: '' },
        { key: 'admin.save', value: '' }
      ])
    })

    it('should parse space-separated keys (multiple spaces)', () => {
      const input = 'admin.title    admin.description    admin.save'

      const result = parseTranslationKeys(input)
      
      expect(result).toEqual([
        { key: 'admin.title', value: '' },
        { key: 'admin.description', value: '' },
        { key: 'admin.save', value: '' }
      ])
    })

    it('should parse newline-separated keys', () => {
      const input = `admin.title
admin.description
admin.save`

      const result = parseTranslationKeys(input)
      
      expect(result).toEqual([
        { key: 'admin.title', value: '' },
        { key: 'admin.description', value: '' },
        { key: 'admin.save', value: '' }
      ])
    })

    it('should parse semicolon-separated keys', () => {
      const input = 'admin.title; admin.description; admin.save'

      const result = parseTranslationKeys(input)
      
      expect(result).toEqual([
        { key: 'admin.title', value: '' },
        { key: 'admin.description', value: '' },
        { key: 'admin.save', value: '' }
      ])
    })

    it('should handle mixed separators', () => {
      const input = `admin.title, admin.description
admin.save;admin.cancel    admin.confirm`

      const result = parseTranslationKeys(input)
      
      expect(result).toEqual([
        { key: 'admin.title', value: '' },
        { key: 'admin.description', value: '' },
        { key: 'admin.save', value: '' },
        { key: 'admin.cancel', value: '' },
        { key: 'admin.confirm', value: '' }
      ])
    })

    it('should remove duplicates', () => {
      const input = 'admin.title, admin.save, admin.title, admin.cancel, admin.save'

      const result = parseTranslationKeys(input)
      
      expect(result).toEqual([
        { key: 'admin.title', value: '' },
        { key: 'admin.save', value: '' },
        { key: 'admin.cancel', value: '' }
      ])
    })

    it('should not split on single spaces (only multiple spaces)', () => {
      const input = 'admin.page title    admin.save button'

      const result = parseTranslationKeys(input)
      
      expect(result).toEqual([
        { key: 'admin.page title', value: '' },
        { key: 'admin.save button', value: '' }
      ])
    })
  })

  describe('edge cases', () => {
    it('should handle empty input', () => {
      expect(parseTranslationKeys('')).toEqual([])
      expect(parseTranslationKeys('   ')).toEqual([])
      expect(parseTranslationKeys('\n\n\n')).toEqual([])
    })

    it('should handle single key', () => {
      expect(parseTranslationKeys('admin.title')).toEqual([
        { key: 'admin.title', value: '' }
      ])
    })

    it('should handle single key:value', () => {
      expect(parseTranslationKeys('admin.title:Title')).toEqual([
        { key: 'admin.title', value: 'Title' }
      ])
    })
  })
})

describe('extractKeys', () => {
  it('should extract keys from parsed data', () => {
    const parsed = [
      { key: 'admin.title', value: 'Title' },
      { key: 'admin.save', value: 'Save' },
      { key: 'admin.cancel', value: '' }
    ]

    expect(extractKeys(parsed)).toEqual(['admin.title', 'admin.save', 'admin.cancel'])
  })

  it('should handle empty array', () => {
    expect(extractKeys([])).toEqual([])
  })
})

describe('createKeyValueMap', () => {
  it('should create a map from parsed data', () => {
    const parsed = [
      { key: 'admin.title', value: 'Title' },
      { key: 'admin.save', value: 'Save' },
      { key: 'admin.cancel', value: '' }
    ]

    const map = createKeyValueMap(parsed)
    
    expect(map.get('admin.title')).toBe('Title')
    expect(map.get('admin.save')).toBe('Save')
    expect(map.get('admin.cancel')).toBe('')
    expect(map.size).toBe(3)
  })

  it('should handle empty array', () => {
    const map = createKeyValueMap([])
    expect(map.size).toBe(0)
  })
})