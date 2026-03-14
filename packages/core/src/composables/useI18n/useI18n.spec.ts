import { describe, expect, it } from 'vitest'
import { useI18n } from './useI18n'

describe('useI18n', () => {
  it('builds nested key paths safely', () => {
    const { keys } = useI18n()

    expect(String(keys.value.type.typeGameSettings)).toBe('type.typeGameSettings')
    expect(String(keys.value.admin.translations.approvalTitle)).toBe('admin.translations.approvalTitle')
  })

  it('accepts proxied keys in t without throwing', () => {
    const { keys, t } = useI18n()

    expect(t(keys.value.type.typeGameSettings)).toBe('type.typeGameSettings')
    expect(t(keys.value.admin.translations.approveSelected, { count: 2 })).toBe('admin.translations.approveSelected')
  })
})
