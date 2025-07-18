import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '../lib/auth-api'
import type { AuthSession, AuthUser } from '../lib/auth-api'

export const useAuthStoreNew = defineStore('auth-new', () => {
  // State
  const user = ref<AuthUser | null>(null)
  const session = ref<AuthSession | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!session.value && !!user.value)

  // Actions
  const sendMagicLink = async (email: string) => {
    isLoading.value = true
    error.value = null
    
    try {
      await authAPI.sendMagicLink(email)
      // Store email for callback
      localStorage.setItem('tiko_pending_auth_email', email)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send magic link'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const checkSession = async () => {
    console.log('[AuthStoreNew] Checking session...')
    
    const storedSession = authAPI.getStoredSession()
    if (!storedSession) {
      console.log('[AuthStoreNew] No stored session')
      return false
    }
    
    try {
      // Verify session by getting user
      const userData = await authAPI.getUser(storedSession.access_token)
      session.value = storedSession
      user.value = userData
      console.log('[AuthStoreNew] Session valid, user:', userData.email)
      return true
    } catch (err) {
      console.error('[AuthStoreNew] Session invalid:', err)
      authAPI.clearSession()
      session.value = null
      user.value = null
      return false
    }
  }

  const logout = () => {
    authAPI.clearSession()
    session.value = null
    user.value = null
  }

  return {
    // State
    user,
    session,
    isLoading,
    error,
    
    // Getters
    isAuthenticated,
    
    // Actions
    sendMagicLink,
    checkSession,
    logout
  }
})