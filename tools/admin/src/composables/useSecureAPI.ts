import { useAuthStore } from '@tiko/core'
import { computed } from 'vue'

/**
 * Secure API composable for admin tool
 * Validates JWT tokens and admin permissions before making API calls
 */
export function useSecureAPI() {
  const authStore = useAuthStore()

  const isAuthorized = computed(() => {
    return authStore.isAuthenticated && authStore.isAdmin && hasValidToken.value
  })

  const hasValidToken = computed(() => {
    const session = authStore.session
    if (!session?.access_token) return false

    // Check token expiration
    if (session.expires_at) {
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = typeof session.expires_at === 'string' 
        ? Math.floor(new Date(session.expires_at).getTime() / 1000)
        : session.expires_at

      if (now >= expiresAt) {
        console.warn('[SecureAPI] Token expired, clearing session')
        authStore.signOut()
        return false
      }
    }

    return true
  })

  /**
   * Validates authorization before API calls
   * Throws error if user is not authorized
   */
  const validateAuth = () => {
    if (!authStore.isAuthenticated) {
      throw new Error('User not authenticated. Please log in.')
    }

    if (!authStore.isAdmin) {
      throw new Error('Admin privileges required. Access denied.')
    }

    if (!hasValidToken.value) {
      throw new Error('Invalid or expired authentication token. Please log in again.')
    }

    if (!authStore.session?.access_token) {
      throw new Error('No valid access token found. Please log in again.')
    }
  }

  /**
   * Gets authorization headers for API requests
   * Validates auth and returns headers with JWT token
   */
  const getAuthHeaders = () => {
    validateAuth()
    
    return {
      'Authorization': `Bearer ${authStore.session?.access_token}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * Makes a secure API request with automatic auth validation
   */
  const secureRequest = async (url: string, options: RequestInit = {}) => {
    validateAuth()

    const headers = {
      ...getAuthHeaders(),
      ...options.headers
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    // Check for auth-related errors
    if (response.status === 401) {
      console.warn('[SecureAPI] 401 Unauthorized, clearing session')
      authStore.signOut()
      throw new Error('Authentication expired. Please log in again.')
    }

    if (response.status === 403) {
      throw new Error('Access forbidden. Admin privileges required.')
    }

    return response
  }

  /**
   * Secure GET request
   */
  const secureGet = async (url: string) => {
    return secureRequest(url, { method: 'GET' })
  }

  /**
   * Secure POST request
   */
  const securePost = async (url: string, data: any) => {
    return secureRequest(url, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * Secure PUT request
   */
  const securePut = async (url: string, data: any) => {
    return secureRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  /**
   * Secure DELETE request
   */
  const secureDelete = async (url: string) => {
    return secureRequest(url, { method: 'DELETE' })
  }

  return {
    isAuthorized,
    hasValidToken,
    validateAuth,
    getAuthHeaders,
    secureRequest,
    secureGet,
    securePost,
    securePut,
    secureDelete
  }
}