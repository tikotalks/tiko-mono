import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import TBanner from './TBanner.vue'

// Mock child components
vi.mock('../TButton', () => ({
  TButton: {
    name: 'TButton',
    template: '<button class="t-button"><slot /></button>',
    props: ['icon', 'size', 'type']
  }
}))

vi.mock('../TIcon', () => ({
  TIcon: {
    name: 'TIcon',
    template: '<i class="t-icon"></i>',
    props: ['name']
  }
}))

describe('TBanner.vue', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(TBanner, {
      slots: {
        default: 'Banner message'
      }
    })
    
    expect(wrapper.html()).toBeTruthy()
    expect(wrapper.find('.banner').exists()).toBe(true)
    expect(wrapper.find('.banner__content').exists()).toBe(true)
    expect(wrapper.text()).toContain('Banner message')
  })

  it('applies correct type classes', () => {
    const types = ['default', 'info', 'success', 'warning', 'error']
    
    types.forEach(type => {
      const wrapper = mount(TBanner, {
        props: { type },
        slots: {
          default: 'Test banner'
        }
      })
      
      const banner = wrapper.find('.banner')
      expect(banner.exists()).toBe(true)
      expect(banner.classes()).toContain(`banner--${type}`)
    })
  })

  it('applies correct color CSS variable', () => {
    const wrapper = mount(TBanner, {
      props: { color: 'success' },
      slots: {
        default: 'Test banner'
      }
    })
    
    const banner = wrapper.find('.banner')
    expect(banner.attributes('style')).toContain('--banner-color: var(--color-success)')
  })

  it('shows close button when close prop is true', () => {
    const wrapper = mount(TBanner, {
      props: { close: true },
      slots: {
        default: 'Test banner'
      }
    })
    
    expect(wrapper.find('.banner__close').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'TButton' }).exists()).toBe(true)
  })

  it('hides close button when close prop is false', () => {
    const wrapper = mount(TBanner, {
      props: { close: false },
      slots: {
        default: 'Test banner'
      }
    })
    
    expect(wrapper.find('.banner__close').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'TButton' }).exists()).toBe(false)
  })

  it('shows icon when banner type has associated icon', () => {
    const wrapper = mount(TBanner, {
      props: { type: 'info' },
      slots: {
        default: 'Test banner'
      }
    })
    
    const icon = wrapper.findComponent({ name: 'TIcon' })
    expect(icon.exists()).toBe(true)
    expect(wrapper.find('.banner__icon').exists()).toBe(true)
  })

  it('hides banner when close button is clicked', async () => {
    const wrapper = mount(TBanner, {
      props: { close: true },
      slots: {
        default: 'Test banner'
      }
    })
    
    expect(wrapper.find('.banner').exists()).toBe(true)
    
    await wrapper.findComponent({ name: 'TButton' }).trigger('click')
    
    expect(wrapper.find('.banner').exists()).toBe(false)
  })

  it('renders slot content correctly', () => {
    const wrapper = mount(TBanner, {
      slots: {
        default: '<p>Custom banner content</p>'
      }
    })
    
    expect(wrapper.find('.banner__content').html()).toContain('<p>Custom banner content</p>')
  })

  it('passes correct props to close button', () => {
    const wrapper = mount(TBanner, {
      props: { close: true },
      slots: {
        default: 'Test banner'
      }
    })
    
    const closeButton = wrapper.findComponent({ name: 'TButton' })
    expect(closeButton.props('icon')).toBe('x')
    expect(closeButton.props('size')).toBe('small')
    expect(closeButton.props('type')).toBe('ghost')
  })

  it('maintains banner visibility state', () => {
    const wrapper = mount(TBanner, {
      props: { close: true },
      slots: {
        default: 'Test banner'
      }
    })
    
    expect(wrapper.vm.isActive).toBe(true)
    expect(wrapper.find('.banner').exists()).toBe(true)
  })

  it('handles different banner types with correct icons', () => {
    const typeIconMap = {
      info: 'info-circle',
      success: 'check-circle',
      warning: 'exclamation-triangle',
      error: 'x-circle'
    }
    
    Object.entries(typeIconMap).forEach(([type, expectedIcon]) => {
      const wrapper = mount(TBanner, {
        props: { type },
        slots: {
          default: 'Test banner'
        }
      })
      
      const icon = wrapper.findComponent({ name: 'TIcon' })
      if (icon.exists()) {
        expect(icon.props('name')).toBe(expectedIcon)
      }
    })
  })

  it('applies correct CSS classes structure', () => {
    const wrapper = mount(TBanner, {
      props: { 
        type: 'success',
        color: 'primary',
        close: true
      },
      slots: {
        default: 'Test banner'
      }
    })
    
    expect(wrapper.find('.banner').exists()).toBe(true)
    expect(wrapper.find('.banner--success').exists()).toBe(true)
    expect(wrapper.find('.banner__content').exists()).toBe(true)
    expect(wrapper.find('.banner__close').exists()).toBe(true)
    expect(wrapper.find('.banner__icon').exists()).toBe(true)
  })

  it('handles banner lifecycle correctly', () => {
    const wrapper = mount(TBanner, {
      slots: {
        default: 'Test banner'
      }
    })
    
    expect(wrapper.vm.isActive).toBe(true)
    
    // Test that banner can be manually set to inactive
    wrapper.vm.isActive = false
    expect(wrapper.find('.banner').exists()).toBe(false)
  })
})