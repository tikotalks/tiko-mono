import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TInputSelect from './TInputSelect.vue'
import InputBase from '../../InputBase.vue'
import { Size } from '../../../../types'

describe('TInputSelect', () => {
  const simpleOptions = ['Option 1', 'Option 2', 'Option 3']
  
  const objectOptions = [
    { label: 'First', value: 'first' },
    { label: 'Second', value: 'second' },
    { label: 'Third', value: 'third' }
  ]
  
  const groupedOptions = [
    {
      title: 'Group A',
      options: ['A1', 'A2', 'A3']
    },
    {
      title: 'Group B',
      options: [
        { label: 'B1 Label', value: 'b1' },
        { label: 'B2 Label', value: 'b2' }
      ]
    }
  ]

  it('renders properly', () => {
    const wrapper = mount(TInputSelect, {
      props: {
        label: 'Select an option',
        options: simpleOptions
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('passes props to InputBase correctly', () => {
    const props = {
      label: 'Choose one',
      description: 'Select your preference',
      error: ['Selection required'],
      size: Size.LARGE,
      options: simpleOptions
    }

    const wrapper = mount(TInputSelect, { props })
    const inputBase = wrapper.findComponent(InputBase)

    expect(inputBase.props('label')).toBe(props.label)
    expect(inputBase.props('description')).toBe(props.description)
    expect(inputBase.props('error')).toEqual(props.error)
    expect(inputBase.props('size')).toBe(props.size)
    expect(inputBase.props('block')).toBe('input-select')
  })

  it('renders simple string options', () => {
    const wrapper = mount(TInputSelect, {
      props: {
        options: simpleOptions
      }
    })

    const options = wrapper.findAll('option')
    expect(options).toHaveLength(simpleOptions.length)
    
    simpleOptions.forEach((option, index) => {
      expect(options[index].text()).toBe(option)
      expect(options[index].attributes('value')).toBe(option)
    })
  })

  it('renders object options with label and value', () => {
    const wrapper = mount(TInputSelect, {
      props: {
        options: objectOptions
      }
    })

    const options = wrapper.findAll('option')
    expect(options).toHaveLength(objectOptions.length)
    
    objectOptions.forEach((option, index) => {
      expect(options[index].text()).toBe(option.label)
      expect(options[index].attributes('value')).toBe(option.value)
    })
  })

  it('renders grouped options correctly', () => {
    const wrapper = mount(TInputSelect, {
      props: {
        options: groupedOptions
      }
    })

    const optgroups = wrapper.findAll('optgroup')
    expect(optgroups).toHaveLength(2)
    
    expect(optgroups[0].attributes('label')).toBe('Group A')
    expect(optgroups[1].attributes('label')).toBe('Group B')
    
    // Check Group A options
    const groupAOptions = optgroups[0].findAll('option')
    expect(groupAOptions).toHaveLength(3)
    expect(groupAOptions[0].text()).toBe('A1')
    
    // Check Group B options
    const groupBOptions = optgroups[1].findAll('option')
    expect(groupBOptions).toHaveLength(2)
    expect(groupBOptions[0].text()).toBe('B1 Label')
    expect(groupBOptions[0].attributes('value')).toBe('b1')
  })

  it('renders null option when allowNull is true', () => {
    const wrapper = mount(TInputSelect, {
      props: {
        options: simpleOptions,
        allowNull: true,
        nullLabel: 'Select something...'
      }
    })

    const options = wrapper.findAll('option')
    expect(options[0].text()).toBe('Select something...')
    expect(options[0].attributes('value')).toBe('')
  })

  it('emits change event with selected value', async () => {
    const wrapper = mount(TInputSelect, {
      props: {
        options: objectOptions
      }
    })

    const select = wrapper.find('select')
    await select.setValue('second')

    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')?.[0]).toEqual(['second'])
  })

  it('emits change event with null when allowNull and empty selected', async () => {
    const wrapper = mount(TInputSelect, {
      props: {
        options: simpleOptions,
        allowNull: true
      }
    })

    const select = wrapper.find('select')
    await select.setValue('')

    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')?.[0]).toEqual([null])
  })

  it('emits touched event', async () => {
    const wrapper = mount(TInputSelect)
    const inputBase = wrapper.findComponent(InputBase)

    await inputBase.vm.$emit('touched', true)
    
    expect(wrapper.emitted('touched')).toBeTruthy()
    expect(wrapper.emitted('touched')?.[0]).toEqual([true])
  })

  it('handles v-model properly', async () => {
    const wrapper = mount(TInputSelect, {
      props: {
        modelValue: 'second',
        options: objectOptions
      }
    })

    const select = wrapper.find('select')
    expect(select.element.value).toBe('second')

    await wrapper.setProps({ modelValue: 'third' })
    expect(select.element.value).toBe('third')
  })

  it('handles null modelValue correctly', async () => {
    const wrapper = mount(TInputSelect, {
      props: {
        modelValue: null,
        options: simpleOptions,
        allowNull: true
      }
    })

    const select = wrapper.find('select')
    expect(select.element.value).toBe('')
  })

  it('disables select when disabled prop is true', () => {
    const wrapper = mount(TInputSelect, {
      props: {
        disabled: true,
        options: simpleOptions
      }
    })

    const select = wrapper.find('select')
    expect(select.attributes('disabled')).toBeDefined()
  })

  it('applies custom CSS classes', () => {
    const wrapper = mount(TInputSelect, {
      props: {
        options: simpleOptions
      }
    })

    const select = wrapper.find('select')
    expect(select.classes()).toContain('input-select__control')
  })

  it('throws error for invalid option format', () => {
    const invalidOptions = [{ invalid: 'format' }]
    
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      mount(TInputSelect, {
        props: {
          options: invalidOptions as any
        }
      })
    }).toThrow()
    
    consoleError.mockRestore()
  })
})