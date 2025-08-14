import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TToolTip from './TToolTip.vue'
import { ToolTipPosition } from './TToolTip.model'

describe('TToolTip.vue', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(TToolTip, {
      slots: {
        default: 'Tooltip content'
      }
    })
    
    expect(wrapper.html()).toBeTruthy()
    expect(wrapper.find('.tool-tip').exists()).toBe(true)
    expect(wrapper.text()).toContain('Tooltip content')
  })

  it('renders slot content correctly', () => {
    const wrapper = mount(TToolTip, {
      slots: {
        default: '<span>Custom tooltip text</span>'
      }
    })
    
    expect(wrapper.find('.tool-tip__text').text()).toBe('Custom tooltip text')
  })

  it('applies correct position classes', () => {
    const positions = [
      ToolTipPosition.TOP,
      ToolTipPosition.BOTTOM,
      ToolTipPosition.RIGHT
    ]

    positions.forEach(position => {
      const wrapper = mount(TToolTip, {
        props: { position },
        slots: { default: 'Test' }
      })
      
      expect(wrapper.find(`.tool-tip--${position}`).exists()).toBe(true)
    })
  })

  it('sets custom delay style', () => {
    const wrapper = mount(TToolTip, {
      props: {
        delay: 1.5
      },
      slots: {
        default: 'Delayed tooltip'
      }
    })
    
    const tooltip = wrapper.find('.tool-tip')
    expect(tooltip.attributes('style')).toContain('--tooltip-delay: 1.5s')
  })

  it('uses default delay when not specified', () => {
    const wrapper = mount(TToolTip, {
      slots: {
        default: 'Default delay tooltip'
      }
    })
    
    const tooltip = wrapper.find('.tool-tip')
    expect(tooltip.attributes('style')).toContain('--tooltip-delay: 0.5s')
  })

  it('uses bottom position by default', () => {
    const wrapper = mount(TToolTip, {
      slots: {
        default: 'Default position'
      }
    })
    
    expect(wrapper.find('.tool-tip--bottom').exists()).toBe(true)
  })

  it('renders with minimal slot content', () => {
    const wrapper = mount(TToolTip, {
      slots: {
        default: 'A'
      }
    })
    
    expect(wrapper.find('.tool-tip').exists()).toBe(true)
    expect(wrapper.find('.tool-tip__text').text()).toBe('A')
  })

  it('applies block classes correctly', () => {
    const wrapper = mount(TToolTip, {
      props: {
        position: ToolTipPosition.TOP
      },
      slots: {
        default: 'Top tooltip'
      }
    })
    
    const tooltip = wrapper.find('.tool-tip')
    expect(tooltip.classes()).toContain('tool-tip')
    expect(tooltip.classes()).toContain('tool-tip--top')
  })

  it('handles empty slot gracefully', () => {
    const wrapper = mount(TToolTip, {
      slots: {
        default: ''
      }
    })
    
    expect(wrapper.find('.tool-tip').exists()).toBe(true)
    expect(wrapper.find('.tool-tip__text').text()).toBe('')
  })

  it('handles HTML content in slot', () => {
    const wrapper = mount(TToolTip, {
      slots: {
        default: '<strong>Bold</strong> text'
      }
    })
    
    expect(wrapper.find('.tool-tip__text').html()).toContain('<strong>Bold</strong>')
  })
})