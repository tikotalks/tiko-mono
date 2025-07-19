import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TInputToggle from './TInputToggle.vue'
import InputBase from '../../InputBase.vue'

describe('TInputToggle', () => {
  it('renders properly', () => {
    const wrapper = mount(TInputToggle, {
      props: {
        label: 'Enable notifications'
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('passes props to InputBase correctly', () => {
    const props = {
      label: 'Dark mode',
      error: ['Toggle is required'],
      disabled: true
    }

    const wrapper = mount(TInputToggle, { props })
    const inputBase = wrapper.findComponent(InputBase)

    expect(inputBase.props('label')).toBe(props.label)
    expect(inputBase.props('block')).toBe('input-toggle')
  })

  it('renders hidden checkbox input', () => {
    const wrapper = mount(TInputToggle)
    const input = wrapper.find('input[type="checkbox"]')
    
    expect(input.exists()).toBe(true)
    expect(input.classes()).toContain('input-toggle__control')
  })

  it('handles toggle state correctly', async () => {
    const wrapper = mount(TInputToggle, {
      props: {
        modelValue: true
      }
    })

    const input = wrapper.find('input[type="checkbox"]')
    expect((input.element as HTMLInputElement).checked).toBe(true)

    await wrapper.setProps({ modelValue: false })
    expect((input.element as HTMLInputElement).checked).toBe(false)
  })

  it('emits change event when toggled', async () => {
    const wrapper = mount(TInputToggle, {
      props: {
        modelValue: false
      }
    })

    const input = wrapper.find('input[type="checkbox"]')
    
    // Simulate toggle
    ;(input.element as HTMLInputElement).checked = true
    await input.trigger('change')

    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')?.[0]).toEqual([true])
  })

  it('emits touched event', async () => {
    const wrapper = mount(TInputToggle)
    const inputBase = wrapper.findComponent(InputBase)

    await inputBase.vm.$emit('touched', true)
    
    expect(wrapper.emitted('touched')).toBeTruthy()
    expect(wrapper.emitted('touched')?.[0]).toEqual([true])
  })

  it('handles v-model properly', async () => {
    const wrapper = mount(TInputToggle, {
      props: {
        modelValue: false
      }
    })

    const input = wrapper.find('input[type="checkbox"]')
    
    // Toggle on
    ;(input.element as HTMLInputElement).checked = true
    await input.trigger('change')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('applies correct BEM classes', () => {
    const wrapper = mount(TInputToggle, {
      props: {
        label: 'Test Toggle' // Label is required for check-control elements to be rendered
      }
    })

    expect(wrapper.find('.input-toggle__control').exists()).toBe(true)
    expect(wrapper.find('.input-toggle__control-container').exists()).toBe(true)
    expect(wrapper.find('.input-toggle__control-switch').exists()).toBe(true)
    expect(wrapper.find('.input-toggle__check-control').exists()).toBe(true)
    expect(wrapper.find('.input-toggle__check-control-dot').exists()).toBe(true)
  })

  it('disables toggle when disabled prop is true', () => {
    const wrapper = mount(TInputToggle, {
      props: {
        modelValue: false,
        disabled: true,
        label: 'Disabled Toggle'
      }
    })

    const input = wrapper.find('.input-toggle__control')
    expect(input.attributes('disabled')).toBeDefined()
  })

  it('hides icon when showIcon is false', () => {
    const wrapper = mount(TInputToggle, {
      props: {
        value: false,
        showIcon: false,
        label: 'Test'
      }
    })

    const label = wrapper.find('.input-toggle__label')
    // Check if the no-icon modifier is applied
    expect(label.exists()).toBe(true)
    // The component uses a dynamic class binding with bemm('label', { 'no-icon': !showIcon })
    expect(label.classes()).toContain('input-toggle__label--no-icon')
  })

  it('renders label with correct for attribute', () => {
    const wrapper = mount(TInputToggle, {
      props: {
        label: 'Test Toggle'
      }
    })

    const label = wrapper.find('label')
    const input = wrapper.find('input')
    
    expect(label.attributes('for')).toBe(input.attributes('id'))
  })

  it('maintains visual toggle state', async () => {
    const wrapper = mount(TInputToggle, {
      props: {
        modelValue: false
      }
    })

    // Initial state - toggle should be off
    const container = wrapper.find('.input-toggle__control-container')
    expect(container.exists()).toBe(true)

    // Toggle on
    await wrapper.setProps({ modelValue: true })
    
    // The CSS uses :has(:checked) to apply styles
    const input = wrapper.find('input')
    expect((input.element as HTMLInputElement).checked).toBe(true)
  })
})