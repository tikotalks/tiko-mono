import { describe, it, expect } from 'vitest'
import { processListFieldValue, processFieldValue, processContentFields } from './field-processing'

describe('field-processing', () => {
  describe('processListFieldValue', () => {
    it('should process multi-line key:value pairs', () => {
      const input = 'en : 🇬🇧\nfr : 🇫🇷\nde : 🇩🇪'
      const result = processListFieldValue(input)
      
      expect(result).toEqual([
        { key: 'en', value: '🇬🇧' },
        { key: 'fr', value: '🇫🇷' },
        { key: 'de', value: '🇩🇪' }
      ])
    })

    it('should process single-line key:value pairs', () => {
      const input = 'en : 🇬🇧 fr : 🇫🇷 de : 🇩🇪'
      const result = processListFieldValue(input)
      
      expect(result).toEqual([
        { key: 'en', value: '🇬🇧' },
        { key: 'fr', value: '🇫🇷' },
        { key: 'de', value: '🇩🇪' }
      ])
    })

    it('should process plain strings', () => {
      const input = 'Apple\nBanana\nOrange'
      const result = processListFieldValue(input)
      
      expect(result).toEqual(['Apple', 'Banana', 'Orange'])
    })

    it('should handle mixed content', () => {
      const input = 'Apple\nen : 🇬🇧\nBanana'
      const result = processListFieldValue(input)
      
      expect(result).toEqual([
        'Apple',
        { key: 'en', value: '🇬🇧' },
        'Banana'
      ])
    })

    it('should handle empty values', () => {
      expect(processListFieldValue('')).toEqual([])
      expect(processListFieldValue('   ')).toEqual([])
    })

    it('should handle malformed key:value pairs', () => {
      const input = 'en:\nfr : 🇫🇷\n: value'
      const result = processListFieldValue(input)
      
      expect(result).toEqual([
        'en:',
        { key: 'fr', value: '🇫🇷' },
        ': value'
      ])
    })
  })

  describe('processFieldValue', () => {
    it('should process list fields', () => {
      const input = 'en : 🇬🇧\nfr : 🇫🇷'
      const result = processFieldValue(input, 'list')
      
      expect(result).toEqual([
        { key: 'en', value: '🇬🇧' },
        { key: 'fr', value: '🇫🇷' }
      ])
    })

    it('should handle array items fields', () => {
      const input = [{ id: 1, name: 'Item 1' }]
      const result = processFieldValue(input, 'items')
      
      expect(result).toEqual(input)
    })

    it('should convert non-array to array for items', () => {
      const input = 'not an array'
      const result = processFieldValue(input, 'items')
      
      expect(result).toEqual([])
    })

    it('should process boolean fields', () => {
      expect(processFieldValue(true, 'boolean')).toBe(true)
      expect(processFieldValue(false, 'boolean')).toBe(false)
      expect(processFieldValue('true', 'boolean')).toBe(true)
      expect(processFieldValue('false', 'boolean')).toBe(true) // truthy string
      expect(processFieldValue('', 'boolean')).toBe(false)
      expect(processFieldValue(0, 'boolean')).toBe(false)
    })

    it('should process number fields', () => {
      expect(processFieldValue(42, 'number')).toBe(42)
      expect(processFieldValue('42', 'number')).toBe(42)
      expect(processFieldValue('42.5', 'number')).toBe(42.5)
      expect(processFieldValue('not a number', 'number')).toBe(0)
      expect(processFieldValue('', 'number')).toBe(0)
    })

    it('should pass through unknown field types', () => {
      const input = 'some value'
      const result = processFieldValue(input, 'unknown')
      
      expect(result).toBe(input)
    })
  })

  describe('processContentFields', () => {
    it('should process all fields based on their types', () => {
      const content = {
        title: 'My Title',
        languages: 'en : 🇬🇧\nfr : 🇫🇷',
        active: 'true',
        count: '42',
        items: [{ id: 1 }]
      }

      const fields = [
        { field_key: 'title', field_type: 'text' },
        { field_key: 'languages', field_type: 'list' },
        { field_key: 'active', field_type: 'boolean' },
        { field_key: 'count', field_type: 'number' },
        { field_key: 'items', field_type: 'items' }
      ]

      const result = processContentFields(content, fields)

      expect(result).toEqual({
        title: 'My Title',
        languages: [
          { key: 'en', value: '🇬🇧' },
          { key: 'fr', value: '🇫🇷' }
        ],
        active: true,
        count: 42,
        items: [{ id: 1 }]
      })
    })

    it('should keep untyped fields as-is', () => {
      const content = {
        typed: 'en : 🇬🇧',
        untyped: 'keep as is'
      }

      const fields = [
        { field_key: 'typed', field_type: 'list' }
      ]

      const result = processContentFields(content, fields)

      expect(result).toEqual({
        typed: [{ key: 'en', value: '🇬🇧' }],
        untyped: 'keep as is'
      })
    })
  })
})