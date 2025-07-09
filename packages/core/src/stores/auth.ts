import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, getAuthRedirectUrl } from '../lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
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
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        throw authError
      }

      user.value = data.user
      session.value = data.session
      
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
      
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            language: 'en'
          }
        }
      })

      console.log('Sign up response:', { data, error: authError })

      if (authError) {
        console.error('Supabase auth error:', authError)
        throw authError
      }

      // Don't set user/session here as they need to confirm email first
      return data
      
    } catch (err: any) {
      console.error('Sign up failed:', err)
      
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        error.value = 'Network error: Cannot connect to authentication service. Please check your internet connection and try again.'
      } else if (err?.error_code === 'email_address_invalid') {
        error.value = 'Please enter a valid email address'
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
      const { data, error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: getAuthRedirectUrl(),
          data: fullName ? {
            full_name: fullName,
            language: 'en'
          } : {
            language: 'en'
          }
        }
      })

      if (authError) {
        throw authError
      }

      return data
      
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
      const { data, error: authError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      })

      if (authError) {
        throw authError
      }

      if (data.user && data.session) {
        user.value = data.user
        session.value = data.session
      }

      return data
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Invalid verification code'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const resendEmailOtp = async (email: string) => {
    try {
      const { data, error: authError } = await supabase.auth.resend({
        type: 'email',
        email
      })

      if (authError) {
        throw authError
      }

      return data
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to resend verification code'
      throw err
    }
  }

  const signInWithApple = async () => {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: getAuthRedirectUrl()
        }
      })

      if (authError) {
        throw authError
      }

      // OAuth will redirect, so we don't set user/session here
      return data
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Apple Sign-In failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.warn('Logout error:', error)
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
      const { data: { session: currentSession }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        return
      }

      if (currentSession) {
        user.value = currentSession.user
        session.value = currentSession
      }
    } catch (err) {
      console.error('Failed to initialize auth:', err)
    }
  }

  const setupAuthListener = () => {
    supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'SIGNED_IN' && currentSession) {
        user.value = currentSession.user
        session.value = currentSession
      } else if (event === 'SIGNED_OUT') {
        user.value = null
        session.value = null
      }
    })
  }

  const updateUserMetadata = async (metadata: Record<string, any>) => {
    if (!user.value) return

    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: metadata
      })

      if (updateError) {
        throw updateError
      }

      if (data.user) {
        user.value = data.user
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