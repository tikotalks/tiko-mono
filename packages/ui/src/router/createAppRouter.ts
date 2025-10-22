import { createRouter, createWebHistory, type RouteRecordRaw, type Router } from 'vue-router'
import AuthCallback from '../components/auth/TAuthCallback/TAuthCallback.vue'

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

  // Note: Magic link handling has been disabled
  // Only OTP-based authentication is now supported

  return router
}