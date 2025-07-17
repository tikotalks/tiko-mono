import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TInputText from './TInputText.vue'
import InputBase from '../../InputBase.vue'

describe('TInputText', () => {
  it('renders properly', () => {
    const wrapper = mount(TInputText, {
      props: {
        label: 'Test Input'
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('passes all props to InputBase', () => {
    const props = {
      label: 'Test Label',
      placeholder: 'Enter text',
      description: 'Test description',
      disabled: true,
      error: ['Test error'],
      maxlength: 100,
      minlength: 5,
      pattern: '^[a-zA-Z]+$',
      autofocus: true
    }

    const wrapper = mount(TInputText, { props })
    const inputBase = wrapper.findComponent(InputBase)

    expect(inputBase.props('label')).toBe(props.label)
    expect(inputBase.props('placeholder')).toBe(props.placeholder)
    expect(inputBase.props('description')).toBe(props.description)
    expect(inputBase.props('disabled')).toBe(props.disabled)
    expect(inputBase.props('error')).toEqual(props.error)
    expect(inputBase.props('maxlength')).toBe(props.maxlength)
    expect(inputBase.props('minlength')).toBe(props.minlength)
    expect(inputBase.props('pattern')).toBe(props.pattern)
    expect(inputBase.props('autofocus')).toBe(props.autofocus)
  })

  it('emits change event when input changes', async () => {
    const wrapper = mount(TInputText)
    const inputBase = wrapper.findComponent(InputBase)

    await inputBase.vm.$emit('change', 'new value')
    
    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')?.[0]).toEqual(['new value'])
  })

  it('emits touched event when input is touched', async () => {
    const wrapper = mount(TInputText)
    const inputBase = wrapper.findComponent(InputBase)

    await inputBase.vm.$emit('touched', true)
    
    expect(wrapper.emitted('touched')).toBeTruthy()
    expect(wrapper.emitted('touched')?.[0]).toEqual([true])
  })

  it('emits focus event when input is focused', async () => {
    const wrapper = mount(TInputText)
    const inputBase = wrapper.findComponent(InputBase)

    await inputBase.vm.$emit('focus', true)
    
    expect(wrapper.emitted('focus')).toBeTruthy()
    expect(wrapper.emitted('focus')?.[0]).toEqual([true])
  })

  it('emits blur event when input loses focus', async () => {
    const wrapper = mount(TInputText)
    const inputBase = wrapper.findComponent(InputBase)

    await inputBase.vm.$emit('blur', true)
    
    expect(wrapper.emitted('blur')).toBeTruthy()
    expect(wrapper.emitted('blur')?.[0]).toEqual([true])
  })

  it('emits reset event when reset is triggered', async () => {
    const wrapper = mount(TInputText, {
      props: {
        reset: true
      }
    })
    const inputBase = wrapper.findComponent(InputBase)

    await inputBase.vm.$emit('reset')
    
    expect(wrapper.emitted('reset')).toBeTruthy()
  })

  it('handles v-model properly', async () => {
    const wrapper = mount(TInputText, {
      props: {
        modelValue: 'initial value'
      }
    })

    const inputBase = wrapper.findComponent(InputBase)
    expect(inputBase.props('modelValue')).toBe('initial value')

    await wrapper.setProps({ modelValue: 'updated value' })
    expect(inputBase.props('modelValue')).toBe('updated value')
  })

  it('uses correct block class', () => {
    const wrapper = mount(TInputText)
    const inputBase = wrapper.findComponent(InputBase)

    expect(inputBase.props('block')).toBe('input-text')
  })
})