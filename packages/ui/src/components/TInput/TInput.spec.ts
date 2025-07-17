import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import TInput from './TInput.vue'

// Mock TIcon component
vi.mock('../TIcon/TIcon.vue', () => ({
  default: {
    name: 'TIcon',
    template: '<i class="t-icon"></i>',
    props: ['name', 'size']
  }
}))

describe('TInput.vue', () => {
  it('renders correctly with basic props', () => {
    const wrapper = mount(TInput, {
      props: {
        modelValue: 'test value',
        label: 'Test Label'
      }
    })
    
    expect(wrapper.html()).toBeTruthy()
    expect(wrapper.find('.input').exists()).toBe(true)
    expect(wrapper.find('.input__label').text()).toBe('Test Label')
    expect(wrapper.find('.input__field').element.value).toBe('test value')
  })

  it('shows required asterisk when required is true', () => {
    const wrapper = mount(TInput, {
      props: {
        label: 'Required Field',
        required: true
      }
    })
    
    expect(wrapper.find('.input__required').exists()).toBe(true)
    expect(wrapper.find('.input__required').text()).toBe('*')
  })

  it('applies correct input type', () => {
    const wrapper = mount(TInput, {
      props: {
        type: 'email',
        modelValue: 'test@example.com'
      }
    })
    
    expect(wrapper.find('.input__field').attributes('type')).toBe('email')
  })

  it('shows placeholder text', () => {
    const wrapper = mount(TInput, {
      props: {
        placeholder: 'Enter your text here'
      }
    })
    
    expect(wrapper.find('.input__field').attributes('placeholder')).toBe('Enter your text here')
  })

  it('applies disabled state correctly', () => {
    const wrapper = mount(TInput, {
      props: {
        disabled: true
      }
    })
    
    expect(wrapper.find('.input__field').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.input').classes()).toContain('input--disabled')
  })

  it('applies readonly state correctly', () => {
    const wrapper = mount(TInput, {
      props: {
        readonly: true
      }
    })
    
    expect(wrapper.find('.input__field').attributes('readonly')).toBeDefined()
    expect(wrapper.find('.input').classes()).toContain('input--readonly')
  })

  it('shows error state when error prop is provided', () => {
    const wrapper = mount(TInput, {
      props: {
        error: 'This field is required'
      }
    })
    
    expect(wrapper.find('.input').classes()).toContain('input--error')
    expect(wrapper.find('.input__error').text()).toBe('This field is required')
  })

  it('shows help text when provided', () => {
    const wrapper = mount(TInput, {
      props: {
        help: 'This is help text'
      }
    })
    
    expect(wrapper.find('.input__help').text()).toBe('This is help text')
  })

  it('displays prefix icon when provided', () => {
    const wrapper = mount(TInput, {
      props: {
        prefixIcon: 'user'
      }
    })
    
    const prefixIcon = wrapper.find('.input__icon--prefix')
    expect(prefixIcon.exists()).toBe(true)
    expect(prefixIcon.findComponent({ name: 'TIcon' }).props('name')).toBe('user')
  })

  it('displays suffix icon when provided', () => {
    const wrapper = mount(TInput, {
      props: {
        suffixIcon: 'search'
      }
    })
    
    const suffixIcon = wrapper.find('.input__icon--suffix')
    expect(suffixIcon.exists()).toBe(true)
    expect(suffixIcon.findComponent({ name: 'TIcon' }).props('name')).toBe('search')
  })

  it('shows spinners for number input when enabled', () => {
    const wrapper = mount(TInput, {
      props: {
        type: 'number',
        showSpinners: true
      }
    })
    
    expect(wrapper.find('.input__spinners').exists()).toBe(true)
    expect(wrapper.find('.input__spinner--up').exists()).toBe(true)
    expect(wrapper.find('.input__spinner--down').exists()).toBe(true)
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(TInput, {
      props: {
        modelValue: ''
      }
    })
    
    const input = wrapper.find('.input__field')
    await input.setValue('new value')
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['new value'])
  })

  it('emits focus event on input focus', async () => {
    const wrapper = mount(TInput)
    
    const input = wrapper.find('.input__field')
    await input.trigger('focus')
    
    expect(wrapper.emitted('focus')).toBeTruthy()
  })

  it('emits blur event on input blur', async () => {
    const wrapper = mount(TInput)
    
    const input = wrapper.find('.input__field')
    await input.trigger('blur')
    
    expect(wrapper.emitted('blur')).toBeTruthy()
  })

  it('emits keydown event on keydown', async () => {
    const wrapper = mount(TInput)
    
    const input = wrapper.find('.input__field')
    await input.trigger('keydown', { key: 'Enter' })
    
    expect(wrapper.emitted('keydown')).toBeTruthy()
  })

  it('increments number value when up spinner is clicked', async () => {
    const wrapper = mount(TInput, {
      props: {
        type: 'number',
        modelValue: '5',
        showSpinners: true
      }
    })
    
    const upSpinner = wrapper.find('.input__spinner--up')
    await upSpinner.trigger('click')
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([6])
  })

  it('decrements number value when down spinner is clicked', async () => {
    const wrapper = mount(TInput, {
      props: {
        type: 'number',
        modelValue: '5',
        showSpinners: true
      }
    })
    
    const downSpinner = wrapper.find('.input__spinner--down')
    await downSpinner.trigger('click')
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([4])
  })

  it('respects min and max values for number input', async () => {
    const wrapper = mount(TInput, {
      props: {
        type: 'number',
        modelValue: '10',
        min: 5,
        max: 10,
        showSpinners: true
      }
    })
    
    const input = wrapper.find('.input__field')
    expect(input.attributes('min')).toBe('5')
    expect(input.attributes('max')).toBe('10')
    
    // Up spinner should be disabled at max value
    const upSpinner = wrapper.find('.input__spinner--up')
    expect(upSpinner.attributes('disabled')).toBeDefined()
  })

  it('applies step attribute for number input', () => {
    const wrapper = mount(TInput, {
      props: {
        type: 'number',
        step: 0.5
      }
    })
    
    const input = wrapper.find('.input__field')
    expect(input.attributes('step')).toBe('0.5')
  })

  it('applies correct aria attributes', () => {
    const wrapper = mount(TInput, {
      props: {
        label: 'Test Label',
        error: 'Error message',
        help: 'Help text'
      }
    })
    
    const input = wrapper.find('.input__field')
    expect(input.attributes('aria-label')).toBe('Test Label')
    expect(input.attributes('aria-describedby')).toBeDefined()
    expect(input.attributes('aria-invalid')).toBe('true')
  })

  it('generates unique input id', () => {
    const wrapper1 = mount(TInput, { props: { label: 'Test 1' } })
    const wrapper2 = mount(TInput, { props: { label: 'Test 2' } })
    
    const input1 = wrapper1.find('.input__field')
    const input2 = wrapper2.find('.input__field')
    
    expect(input1.attributes('id')).toBeDefined()
    expect(input2.attributes('id')).toBeDefined()
    expect(input1.attributes('id')).not.toBe(input2.attributes('id'))
  })

  it('applies focused class on focus', async () => {
    const wrapper = mount(TInput)
    
    const input = wrapper.find('.input__field')
    await input.trigger('focus')
    
    expect(wrapper.find('.input').classes()).toContain('input--focused')
  })

  it('removes focused class on blur', async () => {
    const wrapper = mount(TInput)
    
    const input = wrapper.find('.input__field')
    await input.trigger('focus')
    expect(wrapper.find('.input').classes()).toContain('input--focused')
    
    await input.trigger('blur')
    expect(wrapper.find('.input').classes()).not.toContain('input--focused')
  })

  it('applies correct size classes', () => {
    const sizes = ['small', 'medium', 'large']
    
    sizes.forEach(size => {
      const wrapper = mount(TInput, {
        props: { size }
      })
      
      expect(wrapper.find('.input').classes()).toContain(`input--${size}`)
    })
  })

  it('applies correct variant classes', () => {
    const variants = ['default', 'filled', 'outlined']
    
    variants.forEach(variant => {
      const wrapper = mount(TInput, {
        props: { variant }
      })
      
      expect(wrapper.find('.input').classes()).toContain(`input--${variant}`)
    })
  })

  it('handles null/undefined modelValue gracefully', () => {
    const wrapper = mount(TInput, {
      props: {
        modelValue: null
      }
    })
    
    expect(wrapper.find('.input__field').element.value).toBe('')
  })
})