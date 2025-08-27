import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@tiko/core'

/**
 * Admin authentication middleware
 * Validates JWT tokens and admin permissions for all routes
 */
export const adminAuthGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  // Skip auth guard for auth callback route
  if (to.path === '/auth/callback') {
    next()
    return
  }

  try {
    const authStore = useAuthStore()

    // Check if user is authenticated
    if (!authStore.isAuthenticated) {
      console.warn('[AdminAuth] User not authenticated, blocking access to:', to.path)
      // Let TAuthWrapper handle the login UI
      next()
      return
    }

    // Validate JWT token exists and is not expired
    const session = authStore.session
    if (!session?.access_token) {
      console.warn('[AdminAuth] No valid access token, blocking access to:', to.path)
      authStore.signOut() // Clear invalid session
      next()
      return
    }

    // Check token expiration
    if (session.expires_at) {
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = typeof session.expires_at === 'string' 
        ? Math.floor(new Date(session.expires_at).getTime() / 1000)
        : session.expires_at

      if (now >= expiresAt) {
        console.warn('[AdminAuth] Access token expired, blocking access to:', to.path)
        authStore.signOut() // Clear expired session
        next()
        return
      }
    }

    // Check if user has admin permissions
    if (!authStore.isAdmin) {
      console.warn('[AdminAuth] User lacks admin permissions, blocking access to:', to.path)
      
      // Redirect to not authorized page instead of login
      if (to.path !== '/not-authorized') {
        next({ path: '/not-authorized', replace: true })
        return
      }
    }

    // Validate JWT token format
    if (!isValidJwtFormat(session.access_token)) {
      console.warn('[AdminAuth] Invalid JWT token format, blocking access to:', to.path)
      authStore.signOut()
      next()
      return
    }

    // All checks passed - allow access
    console.log('[AdminAuth] Access granted to:', to.path)
    next()

  } catch (error) {
    console.error('[AdminAuth] Authentication check failed:', error)
    // On any error, block access and clear session
    try {
      const authStore = useAuthStore()
      authStore.signOut()
    } catch (e) {
      console.error('[AdminAuth] Failed to clear session:', e)
    }
    next()
  }
}

/**
 * Validates JWT token format (basic structure check)
 */
function isValidJwtFormat(token: string): boolean {
  if (!token || typeof token !== 'string') return false
  
  const parts = token.split('.')
  if (parts.length !== 3) return false
  
  try {
    // Validate that each part is valid base64
    parts.forEach(part => {
      const decoded = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
      if (!decoded) throw new Error('Invalid base64')
    })
    return true
  } catch {
    return false
  }
}

/**
 * Admin role validation middleware
 * Additional check for admin-only routes
 */
export const requireAdmin = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  try {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated || !authStore.isAdmin) {
      console.warn('[AdminAuth] Admin access required for:', to.path)
      next({ path: '/not-authorized', replace: true })
      return
    }
    
    next()
  } catch (error) {
    console.error('[AdminAuth] Admin check failed:', error)
    next({ path: '/not-authorized', replace: true })
  }
}