import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TInputRadio from './TInputRadio.vue'
import InputBase from '../../InputBase.vue'

describe('TInputRadio', () => {
  const defaultProps = {
    value: 'option1',
    label: 'Option 1',
    name: 'test-radio-group'
  }

  it('renders properly', () => {
    const wrapper = mount(TInputRadio, {
      props: defaultProps
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('passes props to InputBase correctly', () => {
    const props = {
      ...defaultProps,
      error: ['Selection required']
    }

    const wrapper = mount(TInputRadio, { props })
    const inputBase = wrapper.findComponent(InputBase)

    expect(inputBase.props('label')).toBe(props.label)
    expect(inputBase.props('block')).toBe('input-radio')
  })

  it('renders radio input with correct attributes', () => {
    const wrapper = mount(TInputRadio, {
      props: defaultProps
    })

    const input = wrapper.find('input[type="radio"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('name')).toBe(defaultProps.name)
    expect(input.attributes('value')).toBe(defaultProps.value)
  })

  it('handles checked state correctly when modelValue matches value', async () => {
    const wrapper = mount(TInputRadio, {
      props: {
        ...defaultProps,
        modelValue: 'option1'
      }
    })

    const input = wrapper.find('input[type="radio"]')
    expect((input.element as HTMLInputElement).checked).toBe(true)

    await wrapper.setProps({ modelValue: 'option2' })
    expect((input.element as HTMLInputElement).checked).toBe(false)
  })

  it('emits change event when selected', async () => {
    const wrapper = mount(TInputRadio, {
      props: defaultProps
    })

    const input = wrapper.find('input[type="radio"]')
    await input.trigger('change')

    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')?.[0]).toEqual(['option1'])
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['option1'])
  })

  it('emits touched event', async () => {
    const wrapper = mount(TInputRadio, {
      props: defaultProps
    })
    const inputBase = wrapper.findComponent(InputBase)

    await inputBase.vm.$emit('touched', true)
    
    expect(wrapper.emitted('touched')).toBeTruthy()
    expect(wrapper.emitted('touched')?.[0]).toEqual([true])
  })

  it('disables radio when disabled prop is true', () => {
    const wrapper = mount(TInputRadio, {
      props: {
        ...defaultProps,
        disabled: true
      }
    })

    const input = wrapper.find('input[type="radio"]')
    expect(input.attributes('disabled')).toBeDefined()
  })

  it('applies correct BEM classes', () => {
    const wrapper = mount(TInputRadio, {
      props: defaultProps
    })

    expect(wrapper.find('.input-radio__control').exists()).toBe(true)
    expect(wrapper.find('.input-radio__control-container').exists()).toBe(true)
    expect(wrapper.find('.input-radio__control-dot').exists()).toBe(true)
    expect(wrapper.find('.input-radio__label').exists()).toBe(true)
  })

  it('renders label with correct for attribute', () => {
    const wrapper = mount(TInputRadio, {
      props: defaultProps
    })

    const label = wrapper.find('label')
    const input = wrapper.find('input')
    
    expect(label.attributes('for')).toBe(input.attributes('id'))
  })

  it('works as part of a radio group', async () => {
    // Mount multiple radio buttons with same name
    const wrapper1 = mount(TInputRadio, {
      props: {
        value: 'option1',
        label: 'Option 1',
        name: 'group',
        modelValue: 'option1'
      }
    })

    const wrapper2 = mount(TInputRadio, {
      props: {
        value: 'option2',
        label: 'Option 2',
        name: 'group',
        modelValue: 'option1'
      }
    })

    // First radio should be checked
    expect(wrapper1.find('input').element.checked).toBe(true)
    expect(wrapper2.find('input').element.checked).toBe(false)

    // Select second radio
    await wrapper2.find('input').trigger('change')
    expect(wrapper2.emitted('update:modelValue')?.[0]).toEqual(['option2'])
  })

  it('handles visual styling for checked state', () => {
    const wrapper = mount(TInputRadio, {
      props: {
        ...defaultProps,
        modelValue: 'option1'
      }
    })

    // The CSS uses :has(:checked) selector
    const input = wrapper.find('input')
    expect((input.element as HTMLInputElement).checked).toBe(true)
  })
})