import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAppRouter } from './createAppRouter'

// Simple test to verify the router creates routes correctly
describe('createAppRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('should use custom base path when provided', () => {
    const router = createAppRouter({ basePath: '/app' })
    
    // Router should be created with custom base path
    expect(router.options.history.base).toBe('/app')
  })
})