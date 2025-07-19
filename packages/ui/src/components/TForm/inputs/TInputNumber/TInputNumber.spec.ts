import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TInputNumber from './TInputNumber.vue'
import InputBase from '../../InputBase.vue'
import { parseNumericValue, formatNumericValue } from './TInputNumber.model'

describe('TInputNumber', () => {
  it('renders properly', () => {
    const wrapper = mount(TInputNumber, {
      props: {
        label: 'Test Number Input',
        modelValue: 42
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('passes all props to InputBase', () => {
    const props = {
      label: 'Quantity',
      modelValue: 10,
      min: 0,
      max: 100,
      step: 5,
      disabled: true
    }

    const wrapper = mount(TInputNumber, { props })
    const inputBase = wrapper.findComponent(InputBase)

    expect(inputBase.props('label')).toBe(props.label)
    expect(inputBase.props('modelValue')).toBe(props.modelValue)
    expect(inputBase.props('disabled')).toBe(props.disabled)
    // min, max, and step are handled by the HTML input element, not InputBase
  })

  it('parses numeric values correctly', () => {
    const wrapper = mount(TInputNumber)
    const inputBase = wrapper.findComponent(InputBase)
    
    // Test parseValue function
    const parseValue = inputBase.props('parseValue') as Function
    
    expect(parseValue('123')).toBe(123)
    expect(parseValue('-456')).toBe(-456)
    expect(parseValue('78.9')).toBe(78.9)
    expect(parseValue('abc')).toBeUndefined()
    expect(parseValue('')).toBeUndefined()
  })

  it('formats numeric values correctly', () => {
    const wrapper = mount(TInputNumber, {
      props: {
        decimals: 2,
        formatThousands: true
      }
    })
    const inputBase = wrapper.findComponent(InputBase)
    
    // Test formatValue function
    const formatValue = inputBase.props('formatValue') as Function
    
    expect(formatValue(1234.567)).toBe('1,234.57')
    expect(formatValue(0)).toBe('0.00')
    expect(formatValue(undefined)).toBe('')
  })

  it('shows error for multiple numbers', async () => {
    const wrapper = mount(TInputNumber, {
      props: {
        modelValue: 0
      }
    })
    
    // Get the parseValue function from InputBase props
    const inputBase = wrapper.findComponent(InputBase)
    const parseValue = inputBase.props('parseValue') as Function
    
    // Call parseValue with multiple numbers - this should set the error
    parseValue('123 456')
    
    // Force update to ensure reactive changes are applied
    await wrapper.vm.$forceUpdate()
    await wrapper.vm.$nextTick()
    
    // The error should now be set
    expect(inputBase.props('error')).toEqual(['Only one number is allowed'])
  })

  it('emits change event when input changes', async () => {
    const wrapper = mount(TInputNumber)
    const inputBase = wrapper.findComponent(InputBase)

    await inputBase.vm.$emit('change', 99)
    
    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')?.[0]).toEqual([99])
  })

  it('emits touched event when input is touched', async () => {
    const wrapper = mount(TInputNumber)
    const inputBase = wrapper.findComponent(InputBase)

    await inputBase.vm.$emit('touched', true)
    
    expect(wrapper.emitted('touched')).toBeTruthy()
    expect(wrapper.emitted('touched')?.[0]).toEqual([true])
  })

  it('handles v-model properly', async () => {
    const wrapper = mount(TInputNumber, {
      props: {
        modelValue: 50
      }
    })

    const inputBase = wrapper.findComponent(InputBase)
    expect(inputBase.props('modelValue')).toBe(50)

    await wrapper.setProps({ modelValue: 75 })
    expect(inputBase.props('modelValue')).toBe(75)
  })

  it('uses correct block class', () => {
    const wrapper = mount(TInputNumber)
    const inputBase = wrapper.findComponent(InputBase)

    expect(inputBase.props('block')).toBe('input-number')
  })
})

describe('parseNumericValue', () => {
  it('parses valid numbers', () => {
    expect(parseNumericValue('123')).toBe(123)
    expect(parseNumericValue('-456')).toBe(-456)
    expect(parseNumericValue('78.9')).toBe(78.9)
    expect(parseNumericValue('0')).toBe(0)
  })

  it('handles invalid input', () => {
    expect(parseNumericValue('abc')).toBeUndefined()
    expect(parseNumericValue('')).toBeUndefined()
    expect(parseNumericValue('--')).toBeUndefined()
  })

  it('respects decimal places', () => {
    expect(parseNumericValue('123.456', 2)).toBe(123.46)
    expect(parseNumericValue('123.454', 2)).toBe(123.45)
    expect(parseNumericValue('123.999', 0)).toBe(124)
  })
})

describe('formatNumericValue', () => {
  it('formats basic numbers', () => {
    expect(formatNumericValue(123)).toBe('123')
    expect(formatNumericValue(0)).toBe('0')
    expect(formatNumericValue(-456)).toBe('-456')
  })

  it('handles undefined values', () => {
    expect(formatNumericValue(undefined)).toBe('')
    expect(formatNumericValue(null as any)).toBe('')
  })

  it('formats with decimal places', () => {
    expect(formatNumericValue(123.456, 2)).toBe('123.46')
    expect(formatNumericValue(123, 2)).toBe('123.00')
    expect(formatNumericValue(123.1, 3)).toBe('123.100')
  })

  it('formats with thousands separators', () => {
    expect(formatNumericValue(1234567, 0, true)).toBe('1,234,567')
    expect(formatNumericValue(1234.56, 2, true)).toBe('1,234.56')
    expect(formatNumericValue(123, 0, true)).toBe('123')
  })
})