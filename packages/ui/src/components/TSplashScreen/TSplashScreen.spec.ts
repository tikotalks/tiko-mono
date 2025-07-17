import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import TSplashScreen from './TSplashScreen.vue'

// Mock child components
vi.mock('../TIcon/TIcon.vue', () => ({
  default: {
    name: 'TIcon',
    template: '<i class="t-icon"></i>',
    props: ['name', 'size']
  }
}))

vi.mock('../TSpinner/TSpinner.vue', () => ({
  default: {
    name: 'TSpinner',
    template: '<div class="t-spinner"></div>',
    props: ['size', 'color']
  }
}))

vi.mock('../TTikoLogo/TTikoLogo.vue', () => ({
  default: {
    name: 'TTikoLogo',
    template: '<div class="t-tiko-logo"></div>',
    props: ['size']
  }
}))

describe('TSplashScreen.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders correctly with default props', () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App'
      }
    })
    
    expect(wrapper.html()).toBeTruthy()
    expect(wrapper.find('.splash-screen').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test App')
  })

  it('displays app name correctly', () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'My Amazing App'
      }
    })
    
    expect(wrapper.find('.splash-screen__app-name').text()).toBe('My Amazing App')
  })

  it('displays custom app icon when provided', () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App',
        appIcon: 'custom-icon'
      }
    })
    
    const icon = wrapper.findComponent({ name: 'TIcon' })
    expect(icon.exists()).toBe(true)
    expect(icon.props('name')).toBe('custom-icon')
  })

  it('displays Tiko logo when no app icon is provided', () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App'
      }
    })
    
    const logo = wrapper.findComponent({ name: 'TTikoLogo' })
    expect(logo.exists()).toBe(true)
  })

  it('shows loading spinner when showLoading is true', () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App',
        showLoading: true
      }
    })
    
    const spinner = wrapper.findComponent({ name: 'TSpinner' })
    expect(spinner.exists()).toBe(true)
  })

  it('hides loading spinner when showLoading is false', () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App',
        showLoading: false
      }
    })
    
    const spinner = wrapper.findComponent({ name: 'TSpinner' })
    expect(spinner.exists()).toBe(false)
  })

  it('displays loading text when provided', () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App',
        showLoading: true,
        loadingText: 'Loading amazing features...'
      }
    })
    
    expect(wrapper.find('.splash-screen__loading-text').text()).toBe('Loading amazing features...')
  })

  it('displays version when provided', () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App',
        version: '1.2.3'
      }
    })
    
    expect(wrapper.find('.splash-screen__version').text()).toBe('v1.2.3')
  })

  it('applies custom background color', () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App',
        backgroundColor: '#ff0000'
      }
    })
    
    const splashScreen = wrapper.find('.splash-screen')
    expect(splashScreen.attributes('style')).toContain('background-color: #ff0000')
  })

  it('applies theme styles when provided', () => {
    const theme = {
      primary: '#007bff',
      secondary: '#6c757d'
    }
    
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App',
        theme
      }
    })
    
    const splashScreen = wrapper.find('.splash-screen')
    expect(splashScreen.attributes('style')).toContain('--color-primary: #007bff')
    expect(splashScreen.attributes('style')).toContain('--color-secondary: #6c757d')
  })

  it('emits complete event after duration', async () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App',
        duration: 1000
      }
    })
    
    // Fast forward time
    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.emitted('complete')).toBeTruthy()
    expect(wrapper.emitted('complete')).toHaveLength(1)
  })

  it('emits complete event immediately when duration is 0', async () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App',
        duration: 0
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.emitted('complete')).toBeTruthy()
    expect(wrapper.emitted('complete')).toHaveLength(1)
  })

  it('does not emit complete event when duration is negative', async () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App',
        duration: -1
      }
    })
    
    vi.advanceTimersByTime(5000)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.emitted('complete')).toBeFalsy()
  })

  it('applies fade-in transition when enableTransitions is true', () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App',
        enableTransitions: true
      }
    })
    
    expect(wrapper.find('.splash-screen').classes()).toContain('splash-screen--transitions')
  })

  it('applies correct size to app icon', () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App',
        appIcon: 'custom-icon'
      }
    })
    
    const icon = wrapper.findComponent({ name: 'TIcon' })
    expect(icon.props('size')).toBe('4rem')
  })

  it('applies correct size to Tiko logo', () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App'
      }
    })
    
    const logo = wrapper.findComponent({ name: 'TTikoLogo' })
    expect(logo.props('size')).toBe('large')
  })

  it('applies correct size to loading spinner', () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App',
        showLoading: true
      }
    })
    
    const spinner = wrapper.findComponent({ name: 'TSpinner' })
    expect(spinner.props('size')).toBe('medium')
  })

  it('applies correct color to loading spinner', () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App',
        showLoading: true
      }
    })
    
    const spinner = wrapper.findComponent({ name: 'TSpinner' })
    expect(spinner.props('color')).toBe('primary')
  })

  it('handles empty app name gracefully', () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: ''
      }
    })
    
    expect(wrapper.find('.splash-screen').exists()).toBe(true)
    expect(wrapper.find('.splash-screen__app-name').text()).toBe('')
  })

  it('clears timeout on component unmount', () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App',
        duration: 2000
      }
    })
    
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
    wrapper.unmount()
    
    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  it('maintains proper component structure', () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App',
        showLoading: true,
        loadingText: 'Loading...',
        version: '1.0.0'
      }
    })
    
    expect(wrapper.find('.splash-screen').exists()).toBe(true)
    expect(wrapper.find('.splash-screen__content').exists()).toBe(true)
    expect(wrapper.find('.splash-screen__icon').exists()).toBe(true)
    expect(wrapper.find('.splash-screen__app-name').exists()).toBe(true)
    expect(wrapper.find('.splash-screen__loading').exists()).toBe(true)
    expect(wrapper.find('.splash-screen__loading-text').exists()).toBe(true)
    expect(wrapper.find('.splash-screen__version').exists()).toBe(true)
  })

  it('applies correct CSS classes for different states', () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App',
        showLoading: true,
        enableTransitions: true
      }
    })
    
    const splashScreen = wrapper.find('.splash-screen')
    expect(splashScreen.classes()).toContain('splash-screen--loading')
    expect(splashScreen.classes()).toContain('splash-screen--transitions')
  })

  it('handles theme object with missing properties', () => {
    const theme = {
      primary: '#007bff'
      // Missing secondary color
    }
    
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App',
        theme
      }
    })
    
    const splashScreen = wrapper.find('.splash-screen')
    expect(splashScreen.attributes('style')).toContain('--color-primary: #007bff')
  })

  it('respects minimum duration for user experience', async () => {
    const wrapper = mount(TSplashScreen, {
      props: {
        appName: 'Test App',
        duration: 50 // Very short duration
      }
    })
    
    vi.advanceTimersByTime(50)
    await wrapper.vm.$nextTick()
    
    // Should still emit complete event
    expect(wrapper.emitted('complete')).toBeTruthy()
  })
})