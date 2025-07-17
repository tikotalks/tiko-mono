import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TInputTextArea from './TInputTextArea.vue'
import InputBase from '../../InputBase.vue'
import { getTextStats, truncateText } from './TInputTextArea.model'

describe('TInputTextArea', () => {
  it('renders properly', () => {
    const wrapper = mount(TInputTextArea, {
      props: {
        label: 'Test TextArea',
        placeholder: 'Enter your text here'
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('passes props to InputBase correctly', () => {
    const props = {
      label: 'Comments',
      description: 'Enter your comments here',
      placeholder: 'Type here...',
      disabled: true
    }

    const wrapper = mount(TInputTextArea, { props })
    const inputBase = wrapper.findComponent(InputBase)

    expect(inputBase.props('label')).toBe(props.label)
    expect(inputBase.props('description')).toBe(props.description)
    expect(inputBase.props('disabled')).toBe(undefined) // Disabled is passed to textarea, not InputBase
  })

  it('renders textarea with correct attributes', () => {
    const wrapper = mount(TInputTextArea, {
      props: {
        placeholder: 'Enter text',
        allowResize: true,
        disabled: true
      }
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('placeholder')).toBe('Enter text')
    expect(textarea.attributes('disabled')).toBeDefined()
    expect(textarea.classes()).not.toContain('no-resize')
  })

  it('applies no-resize class when allowResize is false', () => {
    const wrapper = mount(TInputTextArea, {
      props: {
        allowResize: false
      }
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.classes()).toContain('no-resize')
  })

  it('emits change event when textarea value changes', async () => {
    const wrapper = mount(TInputTextArea)
    const textarea = wrapper.find('textarea')

    await textarea.setValue('New content')
    
    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')?.[0]).toEqual(['New content'])
  })

  it('emits touched event', async () => {
    const wrapper = mount(TInputTextArea)
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

    // Initial height should be based on minRows
    expect(wrapper.vm.controlHeight).toBe(60) // 3 rows * 20px

    // Simulate content that requires more height
    Object.defineProperty(textarea, 'scrollHeight', {
      value: 150,
      configurable: true
    })

    await textarea.dispatchEvent(new Event('input'))
    
    expect(wrapper.vm.controlHeight).toBe(150)
  })

  it('respects maxRows limit', async () => {
    const wrapper = mount(TInputTextArea, {
      props: {
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

    // Simulate content that exceeds maxRows
    Object.defineProperty(textarea, 'scrollHeight', {
      value: 200, // Would be 10 rows
      configurable: true
    })

    await textarea.dispatchEvent(new Event('input'))
    
    expect(wrapper.vm.controlHeight).toBe(100) // 5 rows * 20px (maxRows limit)
  })

  it('uses correct block class', () => {
    const wrapper = mount(TInputTextArea)
    const inputBase = wrapper.findComponent(InputBase)

    expect(inputBase.props('block')).toBe('input-textarea')
  })

  it('applies correct styles based on rows configuration', () => {
    const wrapper = mount(TInputTextArea, {
      props: {
        minRows: 4,
        maxRows: 8
      }
    })

    // Mock line height
    wrapper.vm.lineHeight = 24

    const styles = wrapper.vm.textareaStyle
    expect(styles.minHeight).toBe('96px') // 4 * 24
    expect(styles.maxHeight).toBe('192px') // 8 * 24
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
    expect(truncateText('This is a very long text that needs truncation', 20)).toBe('This is a very l...')
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