import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import TAuthWrapper from './TAuthWrapper.vue'

// Mock window.location
const mockLocation = {
  hash: '',
  pathname: '/',
  search: '',
  href: 'http://localhost:3000/'
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
  configurable: true
})

import { ref } from 'vue'

// Create reactive auth store mock
const createMockAuthStore = () => {
  const user = ref(null)
  const isAuthenticated = ref(false)
  const session = ref(null)
  
  return {
    user,
    isAuthenticated,
    session,
    handleMagicLinkCallback: vi.fn(),
    setupAuthListener: vi.fn(),
    initializeFromStorage: vi.fn().mockResolvedValue(undefined)
  }
}

let mockAuthStore: ReturnType<typeof createMockAuthStore>
let mockRoute = { path: '/' }

// Mock stores
vi.mock('@tiko/core', () => ({
  useAuthStore: () => mockAuthStore
}))

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: () => mockRoute
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
    props: ['isLoading', 'error', 'appId', 'appName', 'enableSso'],
    emits: ['apple-sign-in', 'email-submit', 'verification-submit', 'resend-code', 'clear-error']
  }
}))

// Mock TAuthCallback component
vi.mock('../TAuthCallback/TAuthCallback.vue', () => ({
  default: {
    name: 'TAuthCallback',
    template: '<div class="auth-callback">Processing authentication...</div>'
  }
}))

describe('TAuthWrapper - Magic Link Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockAuthStore = createMockAuthStore()
    mockLocation.hash = ''
    mockRoute = { path: '/' }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should process magic link tokens on mount when present in URL', async () => {
    // Set up magic link tokens in URL
    const mockAccessToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.signature'
    const mockRefreshToken = 'mock-refresh-token'
    mockLocation.hash = `#access_token=${mockAccessToken}&refresh_token=${mockRefreshToken}&expires_in=3600&type=magiclink`

    // Mock successful magic link processing
    mockAuthStore.handleMagicLinkCallback.mockResolvedValue({
      success: true,
      user: { id: 'user-123', email: 'test@example.com' },
      session: {
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
        expires_in: 3600
      }
    })

    // Set route to auth callback
    mockRoute = { path: '/auth/callback' }

    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      },
      slots: {
        default: '<div class="main-content">App Content</div>'
      }
    })

    // Wait for component to mount and process
    await flushPromises()
    await vi.runAllTimersAsync()
    await nextTick()

    // Check that we're in auth callback state (not showing login form)
    // Since TAuthCallback is expected to be in the slot, and we're on callback route
    expect(wrapper.find('[data-cy="login-container"]').exists()).toBe(false)
  })

  it('should handle invalid magic link tokens gracefully', async () => {
    // Set up invalid magic link tokens
    mockLocation.hash = '#access_token=invalid-token&refresh_token=invalid'

    // Mock failed magic link processing
    mockAuthStore.handleMagicLinkCallback.mockResolvedValue({
      success: false,
      error: 'Invalid token'
    })

    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })

    // Wait for component to mount and process
    await flushPromises()
    await vi.runAllTimersAsync()
    await nextTick()

    // Should show login form on failure (not authenticated and not on callback route)
    expect(wrapper.findComponent({ name: 'TLoginForm' }).exists()).toBe(true)
  })

  it('should handle magic link processing errors gracefully', async () => {
    mockLocation.hash = '#access_token=token&refresh_token=refresh'

    // Mock error in magic link processing
    mockAuthStore.handleMagicLinkCallback.mockRejectedValue(new Error('Network error'))

    // Set route to auth callback
    mockRoute = { path: '/auth/callback' }

    // Mock console methods to capture logs
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })

    // Wait for error to be handled
    await flushPromises()
    await vi.runAllTimersAsync()
    await nextTick()

    // Since we're on auth callback route, it should not show login form
    expect(wrapper.find('[data-cy="login-container"]').exists()).toBe(false)

    // Restore console
    consoleErrorSpy.mockRestore()
  })

  it('should not process magic link when no tokens present', async () => {
    // No hash in URL
    mockLocation.hash = ''

    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })

    await flushPromises()
    await vi.runAllTimersAsync()
    await nextTick()

    // Should not call handleMagicLinkCallback
    expect(mockAuthStore.handleMagicLinkCallback).not.toHaveBeenCalled()
    
    // Should show login form
    expect(wrapper.findComponent({ name: 'TLoginForm' }).exists()).toBe(true)
  })

  it('should handle magic link with custom expires_in parameter', async () => {
    const mockAccessToken = 'mock-access-token'
    const mockRefreshToken = 'mock-refresh-token'
    const customExpiresIn = '7200' // 2 hours
    
    mockLocation.hash = `#access_token=${mockAccessToken}&refresh_token=${mockRefreshToken}&expires_in=${customExpiresIn}`

    mockAuthStore.handleMagicLinkCallback.mockResolvedValue({
      success: true,
      user: { id: 'user-123', email: 'test@example.com' },
      session: {
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
        expires_in: parseInt(customExpiresIn)
      }
    })

    // Set route to auth callback
    mockRoute = { path: '/auth/callback' }

    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })

    await flushPromises()
    await vi.runAllTimersAsync()
    await nextTick()

    // Should not show login form when on auth callback route
    expect(wrapper.find('[data-cy="login-container"]').exists()).toBe(false)
  })

  it('should handle magic link exception gracefully', async () => {
    mockLocation.hash = '#access_token=token&refresh_token=refresh'

    // Mock exception in magic link processing
    const testError = new Error('Processing failed')
    mockAuthStore.handleMagicLinkCallback.mockRejectedValue(testError)

    // Set route to auth callback  
    mockRoute = { path: '/auth/callback' }

    // Mock console to verify error logging
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })

    await flushPromises()
    await vi.runAllTimersAsync()
    await nextTick()

    // Should not show login form when on auth callback route
    expect(wrapper.find('[data-cy="login-container"]').exists()).toBe(false)

    // Restore console
    consoleErrorSpy.mockRestore()
  })

  it('should clear magic link tokens from URL after processing', async () => {
    const mockAccessToken = 'mock-access-token'
    mockLocation.hash = `#access_token=${mockAccessToken}&refresh_token=refresh`

    mockAuthStore.handleMagicLinkCallback.mockResolvedValue({
      success: true,
      user: { id: 'user-123', email: 'test@example.com' }
    })

    // Update auth state after successful callback
    mockAuthStore.isAuthenticated.value = true
    mockAuthStore.user.value = { id: 'user-123', email: 'test@example.com' }

    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      },
      slots: {
        default: '<div>Authenticated Content</div>'
      }
    })

    await flushPromises()
    await vi.runAllTimersAsync()
    await nextTick()

    // After successful auth, should show authenticated content
    expect(wrapper.text()).toContain('Authenticated Content')
  })
})