import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import TAuthCallback from './TAuthCallback.vue'
import { createRouter, createWebHistory } from 'vue-router'

// Mock auth store
const mockAuthStore = {
  isAuthenticated: false,
  handleMagicLinkCallback: vi.fn(),
  initializeFromStorage: vi.fn()
}

// Mock stores
vi.mock('@tiko/core', () => ({
  useAuthStore: () => mockAuthStore
}))

// Create a test router
const createTestRouter = (initialHash = '') => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
      { path: '/auth/callback', name: 'AuthCallback', component: TAuthCallback }
    ]
  })
  
  // Mock the route
  router.currentRoute.value.hash = initialHash
  
  return router
}

describe('TAuthCallback Component', () => {
  let router: any
  
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockAuthStore.isAuthenticated = false
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render loading state initially', () => {
    router = createTestRouter()
    
    const wrapper = mount(TAuthCallback, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('.t-auth-callback').exists()).toBe(true)
    expect(wrapper.find('.t-auth-callback__spinner').exists()).toBe(true)
    expect(wrapper.text()).toContain('Processing authentication...')
  })

  it('should process magic link tokens from route hash', async () => {
    const mockHash = '#access_token=mock-access&refresh_token=mock-refresh'
    router = createTestRouter(mockHash)
    
    mockAuthStore.handleMagicLinkCallback.mockResolvedValue({
      success: true,
      user: { id: 'user-123' },
      session: { access_token: 'mock-access' }
    })

    const wrapper = mount(TAuthCallback, {
      global: {
        plugins: [router]
      }
    })

    await nextTick()
    await flushPromises()

    expect(mockAuthStore.handleMagicLinkCallback).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Authentication successful! Redirecting...')
  })

  it('should process magic link tokens from window.location.hash as fallback', async () => {
    router = createTestRouter('') // No hash in route
    
    // Set window.location.hash
    Object.defineProperty(window, 'location', {
      value: { hash: '#access_token=window-token&refresh_token=window-refresh' },
      writable: true
    })

    mockAuthStore.handleMagicLinkCallback.mockResolvedValue({
      success: true
    })

    const wrapper = mount(TAuthCallback, {
      global: {
        plugins: [router]
      }
    })

    await nextTick()
    await flushPromises()

    expect(mockAuthStore.handleMagicLinkCallback).toHaveBeenCalled()
  })

  it('should redirect to home after successful authentication', async () => {
    router = createTestRouter('#access_token=token&refresh_token=refresh')
    const pushSpy = vi.spyOn(router, 'push')
    
    mockAuthStore.handleMagicLinkCallback.mockResolvedValue({
      success: true
    })

    mount(TAuthCallback, {
      global: {
        plugins: [router]
      }
    })

    await nextTick()
    await flushPromises()
    
    // Wait for redirect timeout
    await vi.advanceTimersByTime(1000)
    
    expect(pushSpy).toHaveBeenCalledWith('/')
  })

  it('should show error message and redirect on authentication failure', async () => {
    router = createTestRouter('#access_token=token&refresh_token=refresh')
    const pushSpy = vi.spyOn(router, 'push')
    
    mockAuthStore.handleMagicLinkCallback.mockResolvedValue({
      success: false,
      error: 'Invalid token'
    })

    const wrapper = mount(TAuthCallback, {
      global: {
        plugins: [router]
      }
    })

    await nextTick()
    await flushPromises()
    
    expect(wrapper.text()).toContain('Authentication failed. Redirecting to login...')
    
    // Wait for redirect timeout
    await vi.advanceTimersByTime(2000)
    
    expect(pushSpy).toHaveBeenCalledWith('/')
  })

  it('should check existing session when no magic link tokens present', async () => {
    router = createTestRouter('') // No hash
    
    // Reset window.location.hash
    Object.defineProperty(window, 'location', {
      value: { hash: '' },
      writable: true
    })

    mockAuthStore.initializeFromStorage.mockResolvedValue(undefined)
    mockAuthStore.isAuthenticated = false

    const wrapper = mount(TAuthCallback, {
      global: {
        plugins: [router]
      }
    })

    await nextTick()
    await flushPromises()

    // Should attempt to check existing session
    expect(mockAuthStore.initializeFromStorage).toHaveBeenCalled()
    
    // Should try multiple times
    await vi.advanceTimersByTime(500)
    expect(mockAuthStore.initializeFromStorage).toHaveBeenCalledTimes(2)
  })

  it('should redirect after successful session check', async () => {
    router = createTestRouter('')
    const pushSpy = vi.spyOn(router, 'push')
    
    // Mock successful session on second attempt
    mockAuthStore.initializeFromStorage
      .mockResolvedValueOnce(undefined)
      .mockImplementationOnce(async () => {
        mockAuthStore.isAuthenticated = true
      })

    const wrapper = mount(TAuthCallback, {
      global: {
        plugins: [router]
      }
    })

    await nextTick()
    await flushPromises()
    
    // First check
    expect(mockAuthStore.isAuthenticated).toBe(false)
    
    // Wait for second check
    await vi.advanceTimersByTime(500)
    await flushPromises()
    
    expect(wrapper.text()).toContain('Authentication successful! Redirecting...')
    
    // Wait for redirect
    await vi.advanceTimersByTime(1000)
    
    expect(pushSpy).toHaveBeenCalledWith('/')
  })

  it('should give up after max attempts and redirect to login', async () => {
    router = createTestRouter('')
    const pushSpy = vi.spyOn(router, 'push')
    
    mockAuthStore.initializeFromStorage.mockResolvedValue(undefined)
    mockAuthStore.isAuthenticated = false

    const wrapper = mount(TAuthCallback, {
      global: {
        plugins: [router]
      }
    })

    await nextTick()
    await flushPromises()

    // Advance through all attempts (10 * 500ms = 5000ms)
    for (let i = 0; i < 10; i++) {
      await vi.advanceTimersByTime(500)
      await flushPromises()
    }

    expect(wrapper.text()).toContain('Authentication failed. Redirecting to login...')
    
    // Wait for redirect
    await vi.advanceTimersByTime(2000)
    
    expect(pushSpy).toHaveBeenCalledWith('/')
  })

  it('should handle errors gracefully', async () => {
    router = createTestRouter('#access_token=token&refresh_token=refresh')
    const pushSpy = vi.spyOn(router, 'push')
    
    mockAuthStore.handleMagicLinkCallback.mockRejectedValue(new Error('Network error'))

    const wrapper = mount(TAuthCallback, {
      global: {
        plugins: [router]
      }
    })

    await nextTick()
    await flushPromises()

    expect(wrapper.text()).toContain('Authentication error. Redirecting to login...')
    
    // Wait for redirect
    await vi.advanceTimersByTime(2000)
    
    expect(pushSpy).toHaveBeenCalledWith('/')
  })

  it('should apply correct CSS classes and show spinner', () => {
    router = createTestRouter()
    
    const wrapper = mount(TAuthCallback, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('.t-auth-callback').exists()).toBe(true)
    expect(wrapper.find('.t-auth-callback__container').exists()).toBe(true)
    expect(wrapper.find('.t-auth-callback__loading').exists()).toBe(true)
    expect(wrapper.find('.t-auth-callback__spinner').exists()).toBe(true)
    
    // Check if spinner has animation
    const spinner = wrapper.find('.t-auth-callback__spinner')
    expect(spinner.element.style.animation || window.getComputedStyle(spinner.element).animation).toBeTruthy()
  })
})