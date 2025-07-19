import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import TSSOButton from './TSSOButton.vue'

// Mock TButton component
vi.mock('../TButton/TButton.vue', () => ({
  default: {
    name: 'TButton',
    template: '<button class="t-button"><slot /></button>',
    props: ['type', 'color', 'size', 'disabled', 'loading', 'full', 'icon']
  }
}))

// Mock TIcon component
vi.mock('../TIcon/TIcon.vue', () => ({
  default: {
    name: 'TIcon',
    template: '<i class="t-icon"></i>',
    props: ['name', 'size']
  }
}))

// Mock useI18n
vi.mock('../../composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      if (key === 'sso.signInWithTiko') return 'Sign in with Tiko'
      return key
    }
  })
}))

describe('TSSOButton.vue', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        appId: 'test-app'
      }
    })
    
    expect(wrapper.html()).toBeTruthy()
    expect(wrapper.find('.t-sso-button').exists()).toBe(true)
    expect(wrapper.text()).toContain('Sign in with Tiko')
  })

  it('passes correct props to TButton', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        appId: 'test-app',
        size: 'large',
        type: 'primary',
        disabled: true
      }
    })
    
    const button = wrapper.findComponent({ name: 'TButton' })
    expect(button.props('size')).toBe('large')
    expect(button.props('type')).toBe('primary')
    expect(button.props('disabled')).toBe(true)
  })

  it('renders Tiko icon', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        appId: 'test-app'
      }
    })
    
    const icon = wrapper.findComponent({ name: 'TIcon' })
    expect(icon.exists()).toBe(true)
    expect(icon.props('name')).toBe('tiko')
  })

  it('handles click event correctly for web', async () => {
    const wrapper = mount(TSSOButton, {
      props: {
        appId: 'test-app',
        appName: 'Test App'
      }
    })
    
    // Mock window.location
    const originalLocation = window.location
    delete (window as any).location
    window.location = { href: 'http://localhost:3000' } as any
    
    await wrapper.find('.t-button').trigger('click')
    
    // The component uses URL constructor with searchParams
    expect(window.location.href).toContain('https://app.tiko.mt/signin')
    expect(window.location.href).toContain('return_to=' + encodeURIComponent('http://localhost:3000'))
    expect(window.location.href).toContain('app_id=test-app')
    expect(window.location.href).toContain('app_name=Test+App')
    
    // Restore
    window.location = originalLocation
  })

  it('renders custom slot content when provided', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        appId: 'test-app'
      },
      slots: {
        default: 'Custom Sign In Text'
      }
    })
    
    expect(wrapper.text()).toContain('Custom Sign In Text')
  })

  it('applies disabled state correctly', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        appId: 'test-app',
        disabled: true
      }
    })
    
    const button = wrapper.findComponent({ name: 'TButton' })
    expect(button.props('disabled')).toBe(true)
  })

  it('uses default values for props', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        appId: 'test-app'
      }
    })
    
    const button = wrapper.findComponent({ name: 'TButton' })
    expect(button.props('size')).toBe('medium')
    expect(button.props('type')).toBe('default')
    expect(button.props('disabled')).toBe(false)
  })

  it('handles Capacitor mobile app environment', async () => {
    // Mock Capacitor
    ;(window as any).Capacitor = {
      isNativePlatform: () => true,
      Plugins: {
        App: {
          openUrl: vi.fn()
        }
      }
    }
    
    const wrapper = mount(TSSOButton, {
      props: {
        appId: 'test-app',
        appName: 'Test App'
      }
    })
    
    await wrapper.find('.t-button').trigger('click')
    
    expect(window.Capacitor.Plugins.App.openUrl).toHaveBeenCalledWith({
      url: expect.stringContaining('tiko://signin')
    })
    
    // Cleanup
    delete (window as any).Capacitor
  })

  it('falls back to web signin when Capacitor app open fails', async () => {
    // Mock Capacitor with failing App.openUrl
    ;(window as any).Capacitor = {
      isNativePlatform: () => true,
      Plugins: {
        App: {
          openUrl: vi.fn().mockRejectedValue(new Error('Failed'))
        }
      }
    }
    
    const originalLocation = window.location
    delete (window as any).location
    window.location = { href: 'http://localhost:3000' } as any
    
    const wrapper = mount(TSSOButton, {
      props: {
        appId: 'test-app',
        appName: 'Test App'
      }
    })
    
    await wrapper.find('.t-button').trigger('click')
    
    // Wait for async fallback
    await new Promise(resolve => setTimeout(resolve, 10))
    
    expect(window.location.href).toContain('https://app.tiko.mt/signin')
    expect(window.location.href).toContain('mobile=true')
    
    // Cleanup
    delete (window as any).Capacitor
    window.location = originalLocation
  })
})