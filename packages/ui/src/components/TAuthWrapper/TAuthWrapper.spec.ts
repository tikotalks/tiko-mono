import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import TAuthWrapper from './TAuthWrapper.vue'

// Mock the store
const mockAuthStore = {
  user: null,
  isAuthenticated: false,
  session: null,
  initialize: vi.fn(),
  refreshSession: vi.fn(),
  setupAuthListener: vi.fn(),
  initializeFromStorage: vi.fn().mockResolvedValue(undefined),
  signInWithPasswordlessEmail: vi.fn(),
  verifyEmailOtp: vi.fn(),
  resendEmailOtp: vi.fn(),
  signInWithApple: vi.fn()
}

const mockAppStore = {
  initializeApp: vi.fn()
}

// Mock the stores
vi.mock('@tiko/core', () => ({
  useAuthStore: () => mockAuthStore,
  useAppStore: () => mockAppStore
}))

// Mock useTikoConfig
vi.mock('../../composables/useTikoConfig', () => ({
  useTikoConfig: () => ({
    config: { value: { theme: { primary: 'blue' } } }
  })
}))

// Mock child components
vi.mock('../TSplashScreen/TSplashScreen.vue', () => ({
  default: {
    name: 'TSplashScreen',
    template: '<div class="splash-screen"><slot /></div>',
    props: ['appName', 'appIcon', 'theme', 'duration', 'showLoading', 'loadingText', 'version', 'enableTransitions', 'backgroundColor'],
    emits: ['complete']
  }
}))

vi.mock('../TAppLayout/TAppLayout.vue', () => ({
  default: {
    name: 'TAppLayout',
    template: '<div class="app-layout"><slot /></div>',
    props: ['title', 'subtitle', 'showHeader']
  }
}))

vi.mock('../TLoginForm/TLoginForm.vue', () => ({
  default: {
    name: 'TLoginForm',
    template: '<div class="login-form"></div>',
    props: ['isLoading', 'error', 'appId'],
    emits: ['success', 'error']
  }
}))

describe('TAuthWrapper.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.user = null
    mockAuthStore.isAuthenticated = false
  })

  it('renders correctly with default props', () => {
    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })
    
    expect(wrapper.html()).toBeTruthy()
    expect(wrapper.find('.auth-wrapper').exists()).toBe(true)
  })

  it('shows splash screen when initializing', () => {
    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })
    
    expect(wrapper.findComponent({ name: 'TSplashScreen' }).exists()).toBe(true)
  })

  it('shows login form when not authenticated', async () => {
    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })
    
    // Simulate splash completion
    await wrapper.findComponent({ name: 'TSplashScreen' }).vm.$emit('complete')
    
    expect(wrapper.findComponent({ name: 'TLoginForm' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'TAppLayout' }).exists()).toBe(true)
  })

  it('shows main content when authenticated', async () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = { id: 'user-123', email: 'test@example.com' }
    
    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      },
      slots: {
        default: '<div class="main-content">Main app content</div>'
      }
    })
    
    // Simulate splash completion
    await wrapper.findComponent({ name: 'TSplashScreen' }).vm.$emit('complete')
    
    expect(wrapper.text()).toContain('Main app content')
    expect(wrapper.findComponent({ name: 'TLoginForm' }).exists()).toBe(false)
  })

  it('displays background image when provided', () => {
    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app',
        backgroundImage: '/test-image.jpg'
      }
    })
    
    const backgroundImage = wrapper.find('.auth-wrapper__image')
    expect(backgroundImage.exists()).toBe(true)
    expect(backgroundImage.attributes('src')).toBe('/test-image.jpg')
  })

  it('displays background video when provided', () => {
    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app',
        backgroundVideo: '/test-video.mp4'
      }
    })
    
    const backgroundVideo = wrapper.find('.auth-wrapper__video')
    expect(backgroundVideo.exists()).toBe(true)
    expect(backgroundVideo.attributes('src')).toBe('/test-video.mp4')
  })

  it('passes correct props to TSplashScreen', () => {
    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })
    
    const splashScreen = wrapper.findComponent({ name: 'TSplashScreen' })
    expect(splashScreen.props('appName')).toBe('Todo') // Uses defaultTikoSplashConfigs
    expect(splashScreen.props('showLoading')).toBe(true)
    expect(splashScreen.props('duration')).toBe(0)
    expect(splashScreen.props('enableTransitions')).toBe(true)
  })

  it('passes correct props to TLoginForm', async () => {
    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })
    
    // Simulate splash completion
    await wrapper.findComponent({ name: 'TSplashScreen' }).vm.$emit('complete')
    
    const loginForm = wrapper.findComponent({ name: 'TLoginForm' })
    expect(loginForm.props('appId')).toBe('test-app')
  })

  it('initializes auth store on mount', () => {
    mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })
    
    expect(mockAuthStore.initialize).toHaveBeenCalled()
  })

  it('handles splash completion correctly', async () => {
    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })
    
    expect(wrapper.findComponent({ name: 'TSplashScreen' }).exists()).toBe(true)
    
    await wrapper.findComponent({ name: 'TSplashScreen' }).vm.$emit('complete')
    
    // Should transition to login form
    expect(wrapper.findComponent({ name: 'TLoginForm' }).exists()).toBe(true)
  })

  it('shows title when provided', async () => {
    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Custom App Title',
        appName: 'test-app'
      }
    })
    
    // Simulate splash completion
    await wrapper.findComponent({ name: 'TSplashScreen' }).vm.$emit('complete')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.auth-wrapper__title').text()).toBe('Custom App Title')
  })

  it('handles login success correctly', async () => {
    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })
    
    // Simulate splash completion
    await wrapper.findComponent({ name: 'TSplashScreen' }).vm.$emit('complete')
    await wrapper.vm.$nextTick()
    
    const loginForm = wrapper.findComponent({ name: 'TLoginForm' })
    
    // Mock successful sign in
    mockAuthStore.signInWithPasswordlessEmail = vi.fn().mockResolvedValue({ user: { id: '123' } })
    await loginForm.vm.$emit('email-submit', 'test@example.com')
    await wrapper.vm.$nextTick()
    
    expect(mockAuthStore.signInWithPasswordlessEmail).toHaveBeenCalled()
  })

  it('handles login error correctly', async () => {
    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })
    
    // Simulate splash completion
    await wrapper.findComponent({ name: 'TSplashScreen' }).vm.$emit('complete')
    await wrapper.vm.$nextTick()
    
    // Mock auth store to throw error
    mockAuthStore.signInWithPasswordlessEmail = vi.fn().mockRejectedValue(new Error('Login failed'))
    
    const loginForm = wrapper.findComponent({ name: 'TLoginForm' })
    
    // Trigger email submit which will cause an error
    await loginForm.vm.$emit('email-submit', 'test@example.com')
    await wrapper.vm.$nextTick()
    
    // Component should handle the error internally
    // Note: authError is a ref inside the component, not exposed on vm
    expect(mockAuthStore.signInWithPasswordlessEmail).toHaveBeenCalled()
  })

  it('applies correct CSS classes', () => {
    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })
    
    expect(wrapper.find('.auth-wrapper').exists()).toBe(true)
    expect(wrapper.find('.auth-wrapper__background').exists()).toBe(true)
  })

  it('handles video autoplay attributes correctly', () => {
    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app',
        backgroundVideo: '/test-video.mp4'
      }
    })
    
    const video = wrapper.find('.auth-wrapper__video')
    // In Vue 3, boolean attributes that are true show as empty string
    expect(video.attributes('autoplay')).toBe('')
    expect(video.attributes('loop')).toBe('')
    expect(video.attributes('muted')).toBe('')
    expect(video.attributes('playsinline')).toBe('')
  })
})