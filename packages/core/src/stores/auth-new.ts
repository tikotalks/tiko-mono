import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService, type AuthSession, type AuthUser } from '../services/auth.service'

export const useAuthStoreNew = defineStore('auth-new', () => {
  const user = ref<AuthUser | null>(null)
  const session = ref<AuthSession | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isAuthenticated = computed(() => !!session.value && !!user.value)

  const sendMagicLink = async (email: string) => {
    isLoading.value = true
    error.value = null
    try {
      const result = await authService.signInWithMagicLink(email)
      if (!result.success) throw new Error(result.error || 'Failed to send magic link')
      localStorage.setItem('tiko_pending_auth_email', email)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send magic link'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const checkSession = async () => {
    const currentSession = await authService.getSession()
    session.value = currentSession
    user.value = currentSession?.user || null
    return !!currentSession
  }

  const logout = async () => {
    await authService.signOut()
    session.value = null
    user.value = null
  }

  return { user, session, isLoading, error, isAuthenticated, sendMagicLink, checkSession, logout }
})
