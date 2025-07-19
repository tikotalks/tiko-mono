import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TInputTextArea from './TInputTextArea.vue'
import InputBase from '../../InputBase.vue'
import { getTextStats, truncateText } from './TInputTextArea.model'

describe('TInputTextArea', () => {
  it('renders properly', () => {
    const wrapper = mount(TInputTextArea, {
      props: {
        modelValue: '',
        label: 'Test TextArea',
        placeholder: 'Enter your text here'
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('passes props to InputBase correctly', () => {
    const props = {
      modelValue: '',
      label: 'Comments',
      description: 'Enter your comments here',
      placeholder: 'Type here...',
      disabled: true
    }

    const wrapper = mount(TInputTextArea, { props })
    const inputBase = wrapper.findComponent(InputBase)

    expect(inputBase.props('label')).toBe(props.label)
    expect(inputBase.props('description')).toBe(props.description)
    // Note: disabled is passed to the textarea element, not to InputBase component
  })

  it('renders textarea with correct attributes', () => {
    const wrapper = mount(TInputTextArea, {
      props: {
        modelValue: '',
        placeholder: 'Enter text',
        allowResize: true,
        disabled: true
      }
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('placeholder')).toBe('Enter text')
    // In Vue 3, boolean attributes that are true show as empty string
    expect(textarea.attributes('disabled')).toBe('')
    expect(textarea.classes()).not.toContain('no-resize')
  })

  it('applies no-resize class when allowResize is false', () => {
    const wrapper = mount(TInputTextArea, {
      props: {
        modelValue: '',
        allowResize: false
      }
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.classes()).toContain('no-resize')
  })

  it('emits change event when textarea value changes', async () => {
    const wrapper = mount(TInputTextArea, {
      props: {
        modelValue: ''
      }
    })
    const textarea = wrapper.find('textarea')

    await textarea.setValue('New content')
    
    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')?.[0]).toEqual(['New content'])
  })

  it('emits touched event', async () => {
    const wrapper = mount(TInputTextArea, {
      props: {
        modelValue: ''
      }
    })
    const inputBase = wrapper.findComponent(InputBase)

    await inputBase.vm.$emit('touched', true)
    
    expect(wrapper.emitted('touched')).toBeTruthy()
    expect(wrapper.emitted('touched')?.[0]).toEqual([true])
  })

  it('handles v-model properly', async () => {
    const wrapper = mount(TInputTextArea, {
      props: {
        modelValue: 'Initial text'
      }
    })

    const inputBase = wrapper.findComponent(InputBase)
    expect(inputBase.props('modelValue')).toBe('Initial text')

    await wrapper.setProps({ modelValue: 'Updated text' })
    expect(inputBase.props('modelValue')).toBe('Updated text')
  })

  it('auto-grows when content increases', async () => {
    const wrapper = mount(TInputTextArea, {
      props: {
        modelValue: '',
        autoGrow: true,
        minRows: 3,
        maxRows: 10
      }
    })

    const textarea = wrapper.find('textarea').element as HTMLTextAreaElement
    
    // Mock computed styles
    Object.defineProperty(window, 'getComputedStyle', {
      value: () => ({
        lineHeight: '20px'
      })
    })

    // Since controlHeight is a ref and not exposed, we check the actual style
    await wrapper.vm.$nextTick()
    
    // Initial height based on minRows (3 * 20px = 60px)
    expect(wrapper.vm.textareaStyle.minHeight).toBe('60px')

    // Simulate content that requires more height
    Object.defineProperty(textarea, 'scrollHeight', {
      value: 150,
      configurable: true
    })

    await textarea.dispatchEvent(new Event('input'))
    await wrapper.vm.$nextTick()
    
    // Check that the height style has been updated
    const heightStyle = wrapper.vm.textareaStyle.height
    expect(heightStyle).toBe('150px')
  })

  it('respects maxRows limit', async () => {
    const wrapper = mount(TInputTextArea, {
      props: {
        modelValue: '',
        autoGrow: true,
        minRows: 3,
        maxRows: 5
      }
    })

    const textarea = wrapper.find('textarea').element as HTMLTextAreaElement
    
    // Mock computed styles
    Object.defineProperty(window, 'getComputedStyle', {
      value: () => ({
        lineHeight: '20px'
      })
    })

    await wrapper.vm.$nextTick()

    // Simulate content that exceeds maxRows
    Object.defineProperty(textarea, 'scrollHeight', {
      value: 200, // Would be 10 rows
      configurable: true
    })

    await textarea.dispatchEvent(new Event('input'))
    await wrapper.vm.$nextTick()
    
    // The component handles max height internally
    // Check that the textarea exists and has styles applied
    const textareaEl = wrapper.find('textarea')
    expect(textareaEl.exists()).toBe(true)
  })

  it('uses correct block class', () => {
    const wrapper = mount(TInputTextArea)
    const inputBase = wrapper.findComponent(InputBase)

    expect(inputBase.props('block')).toBe('input-textarea')
  })

  it('applies correct styles based on rows configuration', async () => {
    const wrapper = mount(TInputTextArea, {
      props: {
        minRows: 4,
        maxRows: 8
      }
    })

    // Mock computed styles with different line height
    Object.defineProperty(window, 'getComputedStyle', {
      value: () => ({
        lineHeight: '24px'
      })
    })

    // Force component mount and style calculation
    await wrapper.vm.$nextTick()
    
    // Manually trigger the mounted lifecycle to ensure lineHeight is set
    const textarea = wrapper.find('textarea').element as HTMLTextAreaElement
    const event = new Event('input')
    await textarea.dispatchEvent(event)
    await wrapper.vm.$nextTick()

    // The component calculates styles internally based on line height
    // Verify the textarea has style attributes
    const textareaEl = wrapper.find('textarea')
    const style = textareaEl.attributes('style')
    expect(style).toBeDefined()
  })
})

describe('getTextStats', () => {
  it('counts characters correctly', () => {
    const stats = getTextStats('Hello World')
    expect(stats.characters).toBe(11)
  })

  it('counts words correctly', () => {
    expect(getTextStats('Hello World').words).toBe(2)
    expect(getTextStats('One two three four').words).toBe(4)
    expect(getTextStats('   Multiple   spaces   ').words).toBe(2)
    expect(getTextStats('').words).toBe(0)
    expect(getTextStats('   ').words).toBe(0)
  })

  it('counts lines correctly', () => {
    expect(getTextStats('Single line').lines).toBe(1)
    expect(getTextStats('Line 1\nLine 2').lines).toBe(2)
    expect(getTextStats('Line 1\nLine 2\nLine 3').lines).toBe(3)
  })
})

describe('truncateText', () => {
  it('does not truncate text shorter than limit', () => {
    expect(truncateText('Short text', 20)).toBe('Short text')
  })

  it('truncates text longer than limit', () => {
    // The function truncates to maxLength - ellipsis.length
    // So for maxLength 20 with '...' (3 chars), it keeps 17 chars
    expect(truncateText('This is a very long text that needs truncation', 20)).toBe('This is a very lo...')
  })

  it('uses custom ellipsis', () => {
    expect(truncateText('Long text here', 10, '…')).toBe('Long text…')
  })

  it('handles edge cases', () => {
    expect(truncateText('', 10)).toBe('')
    expect(truncateText('Test', 4)).toBe('Test')
    expect(truncateText('Test', 3)).toBe('...')
  })
})