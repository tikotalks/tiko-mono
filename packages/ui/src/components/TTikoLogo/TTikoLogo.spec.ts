import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TTikoLogo from './TTikoLogo.vue'
import type { TTikoLogoProps } from './TTikoLogo.model'

describe('TTikoLogo', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(TTikoLogo)
    const svg = wrapper.find('svg')
    
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('id')).toBe('tiko-logo')
    expect(svg.attributes('data-name')).toBe('tiko-logo')
  })

  it('applies custom color', () => {
    const wrapper = mount(TTikoLogo, {
      props: {
        color: '#ff0000'
      } as TTikoLogoProps
    })
    
    const svg = wrapper.find('svg')
    expect(svg.attributes('style')).toContain('color: rgb(255, 0, 0)')
  })

  it('applies small size correctly', () => {
    const wrapper = mount(TTikoLogo, {
      props: {
        size: 'small'
      } as TTikoLogoProps
    })
    
    const svg = wrapper.find('svg')
    expect(svg.attributes('style')).toContain('width: 80px')
    expect(svg.attributes('style')).toContain('height: 36px')
  })

  it('applies large size correctly', () => {
    const wrapper = mount(TTikoLogo, {
      props: {
        size: 'large'
      } as TTikoLogoProps
    })
    
    const svg = wrapper.find('svg')
    expect(svg.attributes('style')).toContain('width: 160px')
    expect(svg.attributes('style')).toContain('height: 72px')
  })

  it('applies custom width and height', () => {
    const wrapper = mount(TTikoLogo, {
      props: {
        width: '200px',
        height: '100px'
      } as TTikoLogoProps
    })
    
    const svg = wrapper.find('svg')
    expect(svg.attributes('style')).toContain('width: 200px')
    expect(svg.attributes('style')).toContain('height: 100px')
  })

  it('applies aria-label correctly', () => {
    const wrapper = mount(TTikoLogo, {
      props: {
        ariaLabel: 'Custom Logo Label'
      } as TTikoLogoProps
    })
    
    const svg = wrapper.find('svg')
    expect(svg.attributes('aria-label')).toBe('Custom Logo Label')
  })

  it('adds clickable class when clickable is true', () => {
    const wrapper = mount(TTikoLogo, {
      props: {
        clickable: true
      } as TTikoLogoProps
    })
    
    const svg = wrapper.find('svg')
    expect(svg.classes()).toContain('clickable')
  })

  it('emits click event when clickable', async () => {
    const wrapper = mount(TTikoLogo, {
      props: {
        clickable: true
      } as TTikoLogoProps
    })
    
    await wrapper.find('svg').trigger('click')
    expect(wrapper.emitted()).toHaveProperty('click')
  })

  it('custom dimensions override size prop', () => {
    const wrapper = mount(TTikoLogo, {
      props: {
        size: 'large',
        width: '300px',
        height: '150px'
      } as TTikoLogoProps
    })
    
    const svg = wrapper.find('svg')
    expect(svg.attributes('style')).toContain('width: 300px')
    expect(svg.attributes('style')).toContain('height: 150px')
    // Should not contain the large size values
    expect(svg.attributes('style')).not.toContain('width: 160px')
  })
})