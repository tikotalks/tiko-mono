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

// Mock auth store
const mockAuthStore = {
  user: null,
  isAuthenticated: false,
  session: null,
  handleMagicLinkCallback: vi.fn(),
  setupAuthListener: vi.fn(),
  initializeFromStorage: vi.fn().mockResolvedValue(undefined)
}

// Mock stores
vi.mock('@tiko/core', () => ({
  useAuthStore: () => mockAuthStore
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

describe('TAuthWrapper - Magic Link Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockAuthStore.user = null
    mockAuthStore.isAuthenticated = false
    mockAuthStore.session = null
    mockLocation.hash = ''
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
      session: { access_token: mockAccessToken, refresh_token: mockRefreshToken }
    })

    // Mount the component
    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })

    // Wait for component to mount and process magic link
    await nextTick()
    await flushPromises()

    // Verify magic link callback was called
    expect(mockAuthStore.handleMagicLinkCallback).toHaveBeenCalled()
  })

  it('should not process magic link when no tokens in URL', async () => {
    mockLocation.hash = ''

    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })

    await nextTick()
    await flushPromises()

    // Should not call magic link handler
    expect(mockAuthStore.handleMagicLinkCallback).not.toHaveBeenCalled()
  })

  it('should continue with normal flow after successful magic link processing', async () => {
    mockLocation.hash = `#access_token=token&refresh_token=refresh&expires_in=3600`

    // Mock successful authentication
    mockAuthStore.handleMagicLinkCallback.mockResolvedValue({
      success: true,
      user: { id: 'user-123', email: 'test@example.com' },
      session: { access_token: 'token', refresh_token: 'refresh' }
    })

    // Update auth state after magic link processing
    mockAuthStore.handleMagicLinkCallback.mockImplementation(async () => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.user = { id: 'user-123', email: 'test@example.com' }
      return { success: true }
    })

    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      },
      slots: {
        default: '<div class="authenticated-content">Welcome!</div>'
      }
    })

    // Process magic link
    await nextTick()
    await flushPromises()

    // Run timers to complete splash screen
    await vi.runAllTimersAsync()
    await nextTick()

    // Should show authenticated content
    expect(wrapper.text()).toContain('Welcome!')
  })

  it('should handle magic link processing errors gracefully', async () => {
    mockLocation.hash = `#access_token=invalid&refresh_token=invalid`

    // Mock failed magic link processing
    mockAuthStore.handleMagicLinkCallback.mockResolvedValue({
      success: false,
      error: 'Invalid token'
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })

    await nextTick()
    await flushPromises()

    // Should log error
    expect(consoleSpy).toHaveBeenCalledWith(
      '[TAuthWrapper] Failed to process magic link:',
      'Invalid token'
    )

    // Run timers to show login form
    await vi.runAllTimersAsync()
    await nextTick()

    // Should show login form
    expect(wrapper.findComponent({ name: 'TLoginForm' }).exists()).toBe(true)

    consoleSpy.mockRestore()
  })

  it('should skip splash screen when returning from auth with valid session', async () => {
    mockLocation.hash = `#access_token=token&refresh_token=refresh`

    // Mock existing session in localStorage
    const mockSession = {
      access_token: 'token',
      refresh_token: 'refresh',
      expires_at: Date.now() / 1000 + 3600
    }
    
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'tiko_auth_session') {
        return JSON.stringify(mockSession)
      }
      return null
    })

    // Mock successful magic link processing
    mockAuthStore.handleMagicLinkCallback.mockResolvedValue({ success: true })
    mockAuthStore.isAuthenticated = true

    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })

    await nextTick()
    await flushPromises()

    // Should not show splash screen (isInitializing should be false)
    await vi.advanceTimersByTime(100)
    await nextTick()

    expect(wrapper.findComponent({ name: 'TSplashScreen' }).exists()).toBe(false)
  })

  it('should handle magic link with custom expires_in parameter', async () => {
    const customExpiresIn = '7200'
    mockLocation.hash = `#access_token=token&refresh_token=refresh&expires_in=${customExpiresIn}`

    mockAuthStore.handleMagicLinkCallback.mockResolvedValue({
      success: true,
      session: { expires_in: parseInt(customExpiresIn) }
    })

    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })

    await nextTick()
    await flushPromises()

    expect(mockAuthStore.handleMagicLinkCallback).toHaveBeenCalled()
  })

  it('should handle magic link exception gracefully', async () => {
    mockLocation.hash = `#access_token=token&refresh_token=refresh`

    // Mock exception during magic link processing
    mockAuthStore.handleMagicLinkCallback.mockRejectedValue(new Error('Network error'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(TAuthWrapper, {
      props: {
        title: 'Test App',
        appName: 'test-app'
      }
    })

    await nextTick()
    await flushPromises()

    // Should log error
    expect(consoleSpy).toHaveBeenCalledWith(
      '[TAuthWrapper] Error processing magic link:',
      expect.any(Error)
    )

    consoleSpy.mockRestore()
  })
})