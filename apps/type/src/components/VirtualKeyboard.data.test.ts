import { describe, it, expect } from 'vitest'
import {
  getAvailableCharacterSets,
  getAvailableKeyboardLanguages,
  getAvailableLayouts,
  getKeyboardLayout,
  resolveKeyboardSelection,
} from './VirtualKeyboard.data'

describe('VirtualKeyboard.data', () => {
  it('returns alphabet layout in available layouts', () => {
    const layouts = getAvailableLayouts('en-US')

    expect(layouts.map(layout => layout.value)).toEqual(
      expect.arrayContaining(['qwerty', 'azerty', 'alphabet'])
    )
  })

  it('builds latin alphabet layout for english locale', () => {
    const layout = getKeyboardLayout('alphabet', 'en-US')
    const flatKeys = layout.rows.flat().map(key => key.key)

    expect(layout.name).toBe('Alphabet')
    expect(flatKeys.slice(0, 5)).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(flatKeys).toContain('z')
    expect(flatKeys).toEqual(expect.arrayContaining([',', '.', '!', '?']))
    expect(flatKeys[flatKeys.length - 1]).toBe('?')
  })

  it('builds cyrillic alphabet layout for russian locale', () => {
    const layout = getKeyboardLayout('alphabet', 'ru-RU')
    const flatKeys = layout.rows.flat().map(key => key.key)

    expect(flatKeys.slice(0, 5)).toEqual(['а', 'б', 'в', 'г', 'д'])
    expect(flatKeys).toContain('я')
    expect(flatKeys).not.toContain('q')
  })

  it('builds the selected character set independently from the app locale', () => {
    const layout = getKeyboardLayout('alphabet', 'en-US', 'fa')
    const flatKeys = layout.rows.flat().map(key => key.key)

    expect(flatKeys.slice(0, 5)).toEqual(['ا', 'آ', 'ب', 'پ', 'ت'])
    expect(flatKeys).toContain('ی')
    expect(flatKeys).not.toContain('q')
  })

  it('returns character set options including app language matching and requested scripts', () => {
    const options = getAvailableCharacterSets('mt-MT')

    expect(options).toEqual(
      expect.arrayContaining([
        { value: 'auto', label: 'Match App Language (Maltese)' },
        { value: 'hy', label: 'Armenian' },
        { value: 'ru', label: 'Russian' },
        { value: 'el', label: 'Greek' },
        { value: 'fa', label: 'Persian' },
        { value: 'mt', label: 'Maltese' },
      ])
    )
  })

  it('returns keyboard language options including app language matching and requested languages', () => {
    const options = getAvailableKeyboardLanguages('ru-RU')

    expect(options).toEqual(
      expect.arrayContaining([
        { value: 'auto', label: 'Match App Language (Russian)' },
        { value: 'en', label: 'English' },
        { value: 'ru', label: 'Russian' },
        { value: 'hy', label: 'Armenian' },
        { value: 'fa', label: 'Persian' },
      ])
    )
  })

  it('resolves native layouts from the selected keyboard language', () => {
    expect(resolveKeyboardSelection('ru', false, 'en-US')).toEqual({
      language: 'ru',
      layout: 'russian',
      characterSet: 'ru',
    })
  })

  it('resolves alphabetical layouts from the selected keyboard language', () => {
    expect(resolveKeyboardSelection('hy', true, 'en-US')).toEqual({
      language: 'hy',
      layout: 'alphabet',
      characterSet: 'hy',
    })
  })

  it('falls back to qwerty for unknown layouts', () => {
    const layout = getKeyboardLayout('does-not-exist', 'en-US')

    expect(layout.name).toBe('QWERTY')
  })

  it('includes punctuation keys on qwerty layouts', () => {
    const layout = getKeyboardLayout('qwerty', 'en-US')
    const flatKeys = layout.rows.flat().map(key => key.key)

    expect(flatKeys).toEqual(expect.arrayContaining([',', '.', '!', '?']))
  })
})
