import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '../services'
import type { AuthUser, AuthSession } from '../services/auth.service'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<AuthUser | null>(null)
  const session = ref<AuthSession | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!session.value)
  const currentLanguage = computed(() => user.value?.user_metadata?.language || 'en')

  // Actions
  const signInWithEmail = async (email: string, password: string) => {
    isLoading.value = true
    error.value = null

    try {
      const result = await authService.signInWithEmail(email, password)

      if (!result.success) {
        throw new Error(result.error || 'Authentication failed')
      }

      if (result.user) user.value = result.user
      if (result.session) session.value = result.session
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Authentication failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    isLoading.value = true
    error.value = null

    try {
      console.log('Attempting sign up with:', { email, hasPassword: !!password, fullName })
      
      const result = await authService.signUpWithEmail(email, password, fullName)

      console.log('Sign up response:', result)

      if (!result.success) {
        throw new Error(result.error || 'Sign up failed')
      }

      // Don't set user/session here as they need to confirm email first
      return result
      
    } catch (err: any) {
      console.error('Sign up failed:', err)
      
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        error.value = 'Network error: Cannot connect to authentication service. Please check your internet connection and try again.'
      } else if (err?.message?.includes('email')) {
        error.value = 'Email format is invalid. Please use a valid email address.'
      } else if (err?.message?.includes('password')) {
        error.value = 'Password must be at least 6 characters long'
      } else {
        error.value = err instanceof Error ? err.message : 'Sign up failed'
      }
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const signInWithPasswordlessEmail = async (email: string, fullName?: string) => {
    isLoading.value = true
    error.value = null

    try {
      const result = await authService.signInWithMagicLink(email, fullName)

      if (!result.success) {
        throw new Error(result.error || 'Failed to send verification code')
      }

      return result
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send verification code'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const verifyEmailOtp = async (email: string, token: string) => {
    isLoading.value = true
    error.value = null

    try {
      const result = await authService.verifyOtp(email, token)

      if (!result.success) {
        throw new Error(result.error || 'Invalid verification code')
      }

      if (result.user) user.value = result.user
      if (result.session) session.value = result.session

      return result
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Invalid verification code'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const resendEmailOtp = async (email: string) => {
    try {
      const result = await authService.resendOtp(email)

      if (!result.success) {
        throw new Error(result.error || 'Failed to resend verification code')
      }

      return result
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to resend verification code'
      throw err
    }
  }

  const signInWithApple = async () => {
    isLoading.value = true
    error.value = null

    try {
      // TODO: Implement OAuth in authService
      // For now, throw an error
      throw new Error('Apple Sign-In not yet implemented in auth service')
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Apple Sign-In failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      const result = await authService.signOut()
      if (!result.success) {
        console.warn('Logout error:', result.error)
      }
    } catch (err) {
      console.warn('Logout failed:', err)
    } finally {
      // Clear local state
      user.value = null
      session.value = null
    }
  }

  const initializeFromStorage = async () => {
    try {
      console.log('[Auth Store] initializeFromStorage called')
      console.log('[Auth Store] Current URL:', window.location.href)
      console.log('[Auth Store] Calling authService.getSession()...')
      
      const currentSession = await authService.getSession()
      
      console.log('[Auth Store] getSession result:', {
        hasSession: !!currentSession,
        userId: currentSession?.user?.id,
        email: currentSession?.user?.email
      })

      if (currentSession) {
        user.value = currentSession.user
        session.value = currentSession
      }
    } catch (err) {
      console.error('Failed to initialize auth:', err)
    }
  }

  const setupAuthListener = () => {
    // TODO: Implement auth state change listener in authService
    // For now, we'll rely on manual session checks
    console.log('[Auth Store] Auth listener setup skipped - using authService')
  }

  const updateUserMetadata = async (metadata: Record<string, any>) => {
    if (!user.value) return

    try {
      const result = await authService.updateUserMetadata(metadata)

      if (!result.success) {
        throw new Error(result.error || 'Failed to update user')
      }

      if (result.user) {
        user.value = result.user
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update user'
      throw err
    }
  }

  const updateLanguage = async (language: string) => {
    await updateUserMetadata({ language })
  }

  return {
    // State
    user,
    session,
    isLoading,
    error,
    
    // Getters
    isAuthenticated,
    currentLanguage,
    
    // Actions
    signInWithEmail,
    signUpWithEmail,
    signInWithPasswordlessEmail,
    verifyEmailOtp,
    resendEmailOtp,
    signInWithApple,
    logout,
    initializeFromStorage,
    setupAuthListener,
    updateUserMetadata,
    updateLanguage
  }
})