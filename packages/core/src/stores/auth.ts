import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

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

      if (authError) {
        throw authError
      }

      // Don't set user/session here as they need to confirm email first
      return data
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign up failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const signInWithApple = async () => {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: window.location.origin
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
    signInWithApple,
    logout,
    initializeFromStorage,
    setupAuthListener,
    updateUserMetadata,
    updateLanguage
  }
})