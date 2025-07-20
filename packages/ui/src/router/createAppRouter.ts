import { createRouter, createWebHistory, type RouteRecordRaw, type Router } from 'vue-router'
import AuthCallback from '../components/TAuthCallback/TAuthCallback.vue'

export interface AppRouterOptions {
  routes?: RouteRecordRaw[]
  basePath?: string
}

/**
 * Creates a router instance with common authentication routes
 * that can be extended with app-specific routes
 */
export function createAppRouter(options: AppRouterOptions = {}): Router {
  const { routes = [], basePath = '/' } = options

  // Common routes that all apps need
  const commonRoutes: RouteRecordRaw[] = [
    {
      path: '/auth/callback',
      name: 'AuthCallback',
      component: AuthCallback
    }
  ]

  // Combine common routes with app-specific routes
  const allRoutes = [...routes, ...commonRoutes]

  // Create the router
  const router = createRouter({
    history: createWebHistory(basePath),
    routes: allRoutes
  })

  // Handle magic link tokens in URL hash
  router.beforeEach((to, from, next) => {
    // Check if we have magic link tokens in the hash
    if (window.location.hash && window.location.hash.includes('access_token')) {
      // Only redirect to auth callback if we're not already there
      if (to.path !== '/auth/callback') {
        // Preserve the hash when redirecting
        next({ 
          path: '/auth/callback',
          hash: window.location.hash
        })
      } else {
        // Already at auth callback, continue
        next()
      }
    } else {
      next()
    }
  })

  return router
}