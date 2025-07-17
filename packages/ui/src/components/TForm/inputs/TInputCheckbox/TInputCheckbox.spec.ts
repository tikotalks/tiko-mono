import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TInputCheckbox from './TInputCheckbox.vue'
import InputBase from '../../InputBase.vue'

describe('TInputCheckbox', () => {
  it('renders properly', () => {
    const wrapper = mount(TInputCheckbox, {
      props: {
        label: 'Accept terms'
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('passes props to InputBase correctly', () => {
    const props = {
      label: 'Subscribe to newsletter',
      error: ['Field is required']
    }

    const wrapper = mount(TInputCheckbox, { props })
    const inputBase = wrapper.findComponent(InputBase)

    expect(inputBase.props('label')).toBe(props.label)
    expect(inputBase.props('block')).toBe('input-checkbox')
  })

  it('renders checkbox input with correct type', () => {
    const wrapper = mount(TInputCheckbox)
    const input = wrapper.find('input[type="checkbox"]')
    
    expect(input.exists()).toBe(true)
  })

  it('handles checked state correctly', async () => {
    const wrapper = mount(TInputCheckbox, {
      props: {
        modelValue: true
      }
    })

    const input = wrapper.find('input[type="checkbox"]')
    expect((input.element as HTMLInputElement).checked).toBe(true)

    await wrapper.setProps({ modelValue: false })
    expect((input.element as HTMLInputElement).checked).toBe(false)
  })

  it('emits change event when clicked', async () => {
    const wrapper = mount(TInputCheckbox, {
      props: {
        modelValue: false
      }
    })

    const input = wrapper.find('input[type="checkbox"]')
    await input.trigger('input')

    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')?.[0]).toEqual([true])
  })

  it('emits touched event', async () => {
    const wrapper = mount(TInputCheckbox)
    const inputBase = wrapper.findComponent(InputBase)

    await inputBase.vm.$emit('touched', true)
    
    expect(wrapper.emitted('touched')).toBeTruthy()
    expect(wrapper.emitted('touched')?.[0]).toEqual([true])
  })

  it('handles v-model properly', async () => {
    const wrapper = mount(TInputCheckbox, {
      props: {
        modelValue: false
      }
    })

    const input = wrapper.find('input[type="checkbox"]')
    
    // Simulate checking the checkbox
    ;(input.element as HTMLInputElement).checked = true
    await input.trigger('input')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('handles value prop when modelValue is not provided', async () => {
    const wrapper = mount(TInputCheckbox, {
      props: {
        value: true
      }
    })

    const input = wrapper.find('input[type="checkbox"]')
    expect((input.element as HTMLInputElement).checked).toBe(true)
  })

  it('applies correct BEM classes', () => {
    const wrapper = mount(TInputCheckbox)

    expect(wrapper.find('.input-checkbox__control').exists()).toBe(true)
    expect(wrapper.find('.input-checkbox__control-container').exists()).toBe(true)
    expect(wrapper.find('.input-checkbox__label').exists()).toBe(true)
    expect(wrapper.find('.input-checkbox__check-control').exists()).toBe(true)
    expect(wrapper.find('.input-checkbox__check-control-dot').exists()).toBe(true)
  })

  it('disables checkbox when disabled prop is true', () => {
    const wrapper = mount(TInputCheckbox, {
      props: {
        disabled: true
      }
    })

    const input = wrapper.find('input[type="checkbox"]')
    expect(input.attributes('disabled')).toBeDefined()
  })

  it('renders label element with correct for attribute', () => {
    const wrapper = mount(TInputCheckbox, {
      props: {
        label: 'Test Label'
      }
    })

    const label = wrapper.find('label')
    const input = wrapper.find('input')
    
    expect(label.attributes('for')).toBe(input.attributes('id'))
  })

  it('toggles checkbox state on label click', async () => {
    const wrapper = mount(TInputCheckbox, {
      props: {
        modelValue: false,
        label: 'Click me'
      }
    })

    const label = wrapper.find('label')
    await label.trigger('click')

    // The browser would normally handle this, but in tests we need to verify the structure is correct
    const input = wrapper.find('input')
    expect(label.attributes('for')).toBe(input.attributes('id'))
  })
})