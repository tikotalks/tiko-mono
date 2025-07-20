import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAppRouter } from './createAppRouter'
import type { RouteLocationNormalized } from 'vue-router'

// Mock window.location
const mockLocation = {
  hash: '',
  pathname: '/',
  search: ''
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

describe('createAppRouter - Magic Link Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.hash = ''
  })

  it('should create router with auth callback route', () => {
    const router = createAppRouter()
    
    const authRoute = router.getRoutes().find(route => route.path === '/auth/callback')
    expect(authRoute).toBeDefined()
    expect(authRoute?.name).toBe('AuthCallback')
  })

  it('should include custom routes along with auth callback', () => {
    const customRoutes = [
      {
        path: '/',
        name: 'Home',
        component: { template: '<div>Home</div>' }
      },
      {
        path: '/about',
        name: 'About',
        component: { template: '<div>About</div>' }
      }
    ]

    const router = createAppRouter({ routes: customRoutes })
    
    const routes = router.getRoutes()
    expect(routes).toHaveLength(3) // 2 custom + 1 auth callback
    expect(routes.find(r => r.name === 'Home')).toBeDefined()
    expect(routes.find(r => r.name === 'About')).toBeDefined()
    expect(routes.find(r => r.name === 'AuthCallback')).toBeDefined()
  })

  it('should redirect to auth callback when magic link tokens are present', async () => {
    mockLocation.hash = '#access_token=mock-token&refresh_token=mock-refresh&expires_in=3600'
    
    const router = createAppRouter()
    const mockNext = vi.fn()
    
    // Get the beforeEach guard
    const guards = router.getHooks().beforeEach
    expect(guards.length).toBeGreaterThan(0)
    
    // Create mock route objects
    const to = { path: '/' } as RouteLocationNormalized
    const from = { path: '/' } as RouteLocationNormalized
    
    // Execute the guard
    await guards[0](to, from, mockNext)
    
    // Should redirect to auth callback with hash preserved
    expect(mockNext).toHaveBeenCalledWith({
      path: '/auth/callback',
      hash: '#access_token=mock-token&refresh_token=mock-refresh&expires_in=3600'
    })
  })

  it('should not redirect when no magic link tokens present', async () => {
    mockLocation.hash = ''
    
    const router = createAppRouter()
    const mockNext = vi.fn()
    
    const guards = router.getHooks().beforeEach
    const to = { path: '/about' } as RouteLocationNormalized
    const from = { path: '/' } as RouteLocationNormalized
    
    await guards[0](to, from, mockNext)
    
    // Should call next without parameters (continue normal navigation)
    expect(mockNext).toHaveBeenCalledWith()
  })

  it('should not redirect when hash contains other fragments', async () => {
    mockLocation.hash = '#section-1'
    
    const router = createAppRouter()
    const mockNext = vi.fn()
    
    const guards = router.getHooks().beforeEach
    const to = { path: '/docs' } as RouteLocationNormalized
    const from = { path: '/' } as RouteLocationNormalized
    
    await guards[0](to, from, mockNext)
    
    // Should not redirect
    expect(mockNext).toHaveBeenCalledWith()
  })

  it('should redirect even when already on auth callback route', async () => {
    mockLocation.hash = '#access_token=new-token&refresh_token=new-refresh'
    
    const router = createAppRouter()
    const mockNext = vi.fn()
    
    const guards = router.getHooks().beforeEach
    const to = { path: '/auth/callback' } as RouteLocationNormalized
    const from = { path: '/' } as RouteLocationNormalized
    
    await guards[0](to, from, mockNext)
    
    // Should still redirect to preserve the hash
    expect(mockNext).toHaveBeenCalledWith({
      path: '/auth/callback',
      hash: '#access_token=new-token&refresh_token=new-refresh'
    })
  })

  it('should handle partial magic link URLs correctly', async () => {
    // Only access_token in hash (should still redirect)
    mockLocation.hash = '#access_token=mock-token'
    
    const router = createAppRouter()
    const mockNext = vi.fn()
    
    const guards = router.getHooks().beforeEach
    const to = { path: '/' } as RouteLocationNormalized
    const from = { path: '/' } as RouteLocationNormalized
    
    await guards[0](to, from, mockNext)
    
    expect(mockNext).toHaveBeenCalledWith({
      path: '/auth/callback',
      hash: '#access_token=mock-token'
    })
  })

  it('should use custom base path when provided', () => {
    const router = createAppRouter({ basePath: '/app' })
    
    // Router should be created with custom base path
    expect(router.options.history.base).toBe('/app')
  })

  it('should handle complex magic link URLs with all parameters', async () => {
    const complexHash = '#access_token=eyJhbGc.eyJzdWI.signature&expires_at=1753018840&expires_in=3600&refresh_token=vpxcv3cnrnau&token_type=bearer&type=magiclink'
    mockLocation.hash = complexHash
    
    const router = createAppRouter()
    const mockNext = vi.fn()
    
    const guards = router.getHooks().beforeEach
    const to = { path: '/' } as RouteLocationNormalized
    const from = { path: '/' } as RouteLocationNormalized
    
    await guards[0](to, from, mockNext)
    
    expect(mockNext).toHaveBeenCalledWith({
      path: '/auth/callback',
      hash: complexHash
    })
  })
})