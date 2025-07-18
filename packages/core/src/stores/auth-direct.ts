import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Session } from '@supabase/supabase-js'

// Direct API implementation bypassing Supabase SDK
const SUPABASE_URL = 'https://kejvhvszhevfwgsztedf.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'

export const useAuthStoreDirect = defineStore('auth-direct', () => {
  // State
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!session.value)

  // Direct API call to get user from token
  const getUserFromToken = async (accessToken: string) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': ANON_KEY
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        return userData
      }
      return null
    } catch (err) {
      console.error('Failed to get user:', err)
      return null
    }
  }

  // Initialize from localStorage
  const initializeFromStorage = async () => {
    console.log('[AuthStoreDirect] Initializing from storage...')
    
    try {
      // Check localStorage for Supabase session
      const storedAuth = localStorage.getItem('supabase.auth.token')
      if (!storedAuth) {
        console.log('[AuthStoreDirect] No stored auth found')
        return
      }
      
      const parsed = JSON.parse(storedAuth)
      if (!parsed.currentSession || !parsed.currentSession.access_token) {
        console.log('[AuthStoreDirect] Invalid stored auth')
        return
      }
      
      const storedSession = parsed.currentSession
      
      // Check if expired
      const now = Math.floor(Date.now() / 1000)
      if (storedSession.expires_at && storedSession.expires_at < now) {
        console.log('[AuthStoreDirect] Session expired')
        localStorage.removeItem('supabase.auth.token')
        return
      }
      
      // Get user data
      const userData = await getUserFromToken(storedSession.access_token)
      if (userData) {
        user.value = userData
        session.value = storedSession as Session
        console.log('[AuthStoreDirect] Session restored successfully')
      }
    } catch (err) {
      console.error('[AuthStoreDirect] Failed to initialize:', err)
    }
  }

  // Sign in with OTP
  const signInWithPasswordlessEmail = async (email: string, fullName?: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY
        },
        body: JSON.stringify({
          email,
          create_user: true,
          data: fullName ? { full_name: fullName } : {},
          options: {
            email_redirect_to: `${window.location.origin}/auth/callback`
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.msg || 'Failed to send magic link')
      }

      return { error: null }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send magic link'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Logout
  const logout = async () => {
    try {
      // Clear local state
      user.value = null
      session.value = null
      localStorage.removeItem('supabase.auth.token')
    } catch (err) {
      console.warn('Logout failed:', err)
    }
  }

  // Setup listener (no-op for now since we can't use Supabase SDK)
  const setupAuthListener = () => {
    console.log('[AuthStoreDirect] Auth listener not implemented')
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
    signInWithPasswordlessEmail,
    logout,
    initializeFromStorage,
    setupAuthListener
  }
})