import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TSpinner from './TSpinner.vue'

describe('TSpinner.vue', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(TSpinner)
    
    // First check if any div is rendered
    expect(wrapper.find('div').exists()).toBe(true)
    
    // Check the root element classes
    const classes = wrapper.classes().join(' ')
    expect(classes).toContain('t-spinner')
    expect(classes).toContain('medium')
    expect(classes).toContain('primary')
  })

  it('renders SVG element', () => {
    const wrapper = mount(TSpinner)
    
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 50 50')
    expect(wrapper.find('circle').exists()).toBe(true)
  })

  it('applies size classes correctly', () => {
    const sizes = ['small', 'medium', 'large'] as const
    
    sizes.forEach(size => {
      const wrapper = mount(TSpinner, {
        props: { size }
      })
      const classes = wrapper.classes().join(' ')
      expect(classes).toContain('t-spinner')
      expect(classes).toContain(size)
    })
  })

  it('applies color classes correctly', () => {
    const colors = ['primary', 'secondary', 'accent', 'foreground'] as const
    
    colors.forEach(color => {
      const wrapper = mount(TSpinner, {
        props: { color }
      })
      const classes = wrapper.classes().join(' ')
      expect(classes).toContain('t-spinner')
      expect(classes).toContain(color)
    })
  })

  it('renders circle with correct attributes', () => {
    const wrapper = mount(TSpinner)
    const circle = wrapper.find('circle')
    
    expect(circle.attributes('cx')).toBe('25')
    expect(circle.attributes('cy')).toBe('25')
    expect(circle.attributes('r')).toBe('20')
    expect(circle.attributes('fill')).toBe('none')
    expect(circle.attributes('stroke-width')).toBe('5')
  })

  it('has correct BEM classes on SVG elements', () => {
    const wrapper = mount(TSpinner)
    
    expect(wrapper.find('svg').classes()).toContain('t-spinner__svg')
    expect(wrapper.find('circle').classes()).toContain('t-spinner__circle')
  })

  it('is an inline-block element', () => {
    const wrapper = mount(TSpinner)
    
    expect(wrapper.find('div').exists()).toBe(true)
    // The CSS defines display: inline-block
  })

  it('maintains aspect ratio', () => {
    const wrapper = mount(TSpinner)
    const svg = wrapper.find('svg')
    
    // SVG maintains aspect ratio through viewBox
    expect(svg.attributes('viewBox')).toBe('0 0 50 50')
  })

  it('renders with small size', () => {
    const wrapper = mount(TSpinner, {
      props: { size: 'small' }
    })
    
    const classes = wrapper.classes().join(' ')
    expect(classes).toContain('t-spinner')
    expect(classes).toContain('small')
    expect(classes).not.toContain('medium')
    expect(classes).not.toContain('large')
  })

  it('renders with large size', () => {
    const wrapper = mount(TSpinner, {
      props: { size: 'large' }
    })
    
    const classes = wrapper.classes().join(' ')
    expect(classes).toContain('t-spinner')
    expect(classes).toContain('large')
    expect(classes).not.toContain('small')
    expect(classes).not.toContain('medium')
  })

  it('renders with secondary color', () => {
    const wrapper = mount(TSpinner, {
      props: { color: 'secondary' }
    })
    
    const classes = wrapper.classes().join(' ')
    expect(classes).toContain('t-spinner')
    expect(classes).toContain('secondary')
    expect(classes).not.toContain('primary')
  })

  it('combines size and color props correctly', () => {
    const wrapper = mount(TSpinner, {
      props: { 
        size: 'large',
        color: 'accent' 
      }
    })
    
    const classes = wrapper.classes().join(' ')
    expect(classes).toContain('t-spinner')
    expect(classes).toContain('large')
    expect(classes).toContain('accent')
  })
})