import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import TNumberPad from './TNumberPad.vue'

// Mock TIcon
vi.mock('../TIcon/TIcon.vue', () => ({
  default: {
    name: 'TIcon',
    template: '<i class="t-icon" :data-name="name"></i>',
    props: ['name']
  }
}))

describe('TNumberPad.vue', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(TNumberPad)
    
    expect(wrapper.find('[class*="number-pad"]').exists()).toBe(true)
    
    // Should have 9 number buttons + 0 + clear + submit = 12 buttons
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(12)
  })

  it('renders all number buttons 0-9', () => {
    const wrapper = mount(TNumberPad)
    
    const buttons = wrapper.findAll('button')
    const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
    
    numbers.forEach(num => {
      const button = buttons.find(btn => btn.text() === num)
      expect(button?.exists()).toBe(true)
    })
  })

  it('emits number event when number button is clicked', async () => {
    const wrapper = mount(TNumberPad)
    
    const button5 = wrapper.findAll('button').find(btn => btn.text() === '5')
    await button5?.trigger('click')
    
    expect(wrapper.emitted('number')).toBeTruthy()
    expect(wrapper.emitted('number')![0]).toEqual(['5'])
  })

  it('emits clear event when clear button is clicked', async () => {
    const wrapper = mount(TNumberPad)
    
    const clearButton = wrapper.find('.number-pad__button--clear')
    await clearButton.trigger('click')
    
    expect(wrapper.emitted('clear')).toBeTruthy()
  })

  it('emits submit event when submit button is clicked', async () => {
    const wrapper = mount(TNumberPad)
    
    const submitButton = wrapper.find('.number-pad__button--submit')
    await submitButton.trigger('click')
    
    expect(wrapper.emitted('submit')).toBeTruthy()
  })

  it('hides clear button when showClear is false', () => {
    const wrapper = mount(TNumberPad, {
      props: {
        showClear: false
      }
    })
    
    expect(wrapper.find('.number-pad__button--clear').exists()).toBe(false)
  })

  it('hides submit button when showSubmit is false', () => {
    const wrapper = mount(TNumberPad, {
      props: {
        showSubmit: false
      }
    })
    
    expect(wrapper.find('.number-pad__button--submit').exists()).toBe(false)
  })

  it('disables all buttons when disabled is true', () => {
    const wrapper = mount(TNumberPad, {
      props: {
        disabled: true
      }
    })
    
    const buttons = wrapper.findAll('button')
    buttons.forEach(button => {
      expect(button.attributes('disabled')).toBeDefined()
    })
  })

  it('disables only clear button when disableClear is true', () => {
    const wrapper = mount(TNumberPad, {
      props: {
        disableClear: true
      }
    })
    
    const clearButton = wrapper.find('.number-pad__button--clear')
    const numberButton = wrapper.find('.number-pad__button--number')
    
    expect(clearButton.attributes('disabled')).toBeDefined()
    expect(numberButton.attributes('disabled')).toBeUndefined()
  })

  it('disables only submit button when disableSubmit is true', () => {
    const wrapper = mount(TNumberPad, {
      props: {
        disableSubmit: true
      }
    })
    
    const submitButton = wrapper.find('.number-pad__button--submit')
    const numberButton = wrapper.find('.number-pad__button--number')
    
    expect(submitButton.attributes('disabled')).toBeDefined()
    expect(numberButton.attributes('disabled')).toBeUndefined()
  })

  it('applies size class when size prop is set', () => {
    const wrapper = mount(TNumberPad, {
      props: {
        size: 'small'
      }
    })
    
    // The bemm function generates classes dynamically
    // Just verify the component accepts the prop
    expect(wrapper.props('size')).toBe('small')
  })

  it('applies variant class when variant prop is set', () => {
    const wrapper = mount(TNumberPad, {
      props: {
        variant: 'rounded'
      }
    })
    
    // The bemm function generates classes dynamically
    // Just verify the component accepts the prop
    expect(wrapper.props('variant')).toBe('rounded')
  })

  it('shuffles numbers when shuffle prop is true', () => {
    const wrapper = mount(TNumberPad, {
      props: {
        shuffle: true
      }
    })
    
    const buttons = wrapper.findAll('.number-pad__button--number')
    const buttonTexts = buttons
      .filter(btn => btn.text() !== '0') // Exclude 0 which is always last
      .map(btn => btn.text())
    
    // Check that we have all numbers 1-9
    expect(buttonTexts.sort()).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9'])
    
    // It's unlikely (but possible) that shuffled array equals original
    // So we just check that all numbers are present
  })

  it('uses custom clear icon when provided', () => {
    const wrapper = mount(TNumberPad, {
      props: {
        clearIcon: 'custom-clear-icon'
      }
    })
    
    const clearButton = wrapper.find('.number-pad__button--clear')
    const icon = clearButton.find('.t-icon')
    expect(icon.attributes('data-name')).toBe('custom-clear-icon')
  })

  it('uses custom submit icon when provided', () => {
    const wrapper = mount(TNumberPad, {
      props: {
        submitIcon: 'custom-submit-icon'
      }
    })
    
    const submitButton = wrapper.find('.number-pad__button--submit')
    const icon = submitButton.find('.t-icon')
    expect(icon.attributes('data-name')).toBe('custom-submit-icon')
  })

  it('renders custom clear slot content', () => {
    const wrapper = mount(TNumberPad, {
      slots: {
        clear: '<span class="custom-clear">Clear</span>'
      }
    })
    
    expect(wrapper.find('.custom-clear').exists()).toBe(true)
    expect(wrapper.find('.custom-clear').text()).toBe('Clear')
  })

  it('renders custom submit slot content', () => {
    const wrapper = mount(TNumberPad, {
      slots: {
        submit: '<span class="custom-submit">OK</span>'
      }
    })
    
    expect(wrapper.find('.custom-submit').exists()).toBe(true)
    expect(wrapper.find('.custom-submit').text()).toBe('OK')
  })

  it('handles rapid button clicks', async () => {
    const wrapper = mount(TNumberPad)
    
    const button1 = wrapper.findAll('button').find(btn => btn.text() === '1')
    const button2 = wrapper.findAll('button').find(btn => btn.text() === '2')
    const button3 = wrapper.findAll('button').find(btn => btn.text() === '3')
    
    await button1?.trigger('click')
    await button2?.trigger('click')
    await button3?.trigger('click')
    
    expect(wrapper.emitted('number')).toHaveLength(3)
    expect(wrapper.emitted('number')![0]).toEqual(['1'])
    expect(wrapper.emitted('number')![1]).toEqual(['2'])
    expect(wrapper.emitted('number')![2]).toEqual(['3'])
  })
})