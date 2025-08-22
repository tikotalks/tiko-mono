import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { authService } from '../services'
import { authSyncService } from '../services/auth-sync.service'
import type { AuthUser, AuthSession } from '../services/auth.service'

// User profile settings interface (for auth store)
export interface UserProfileSettings {
  theme?: 'light' | 'dark' | 'auto'
  language?: string
  [key: string]: any // Allow app-specific settings
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<AuthUser | null>(null)
  const session = ref<AuthSession | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const userRole = ref<string | null>(null)

  // User settings state - this is the single source of truth
  const userSettings = ref<UserProfileSettings>({})

  // Storage key for settings
  const SETTINGS_STORAGE_KEY = 'tiko-user-settings'

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!session.value)
  const currentLanguage = computed(() => userSettings.value.language || 'en-GB')
  const currentTheme = computed(() => userSettings.value.theme || 'auto')
  const isAdmin = computed(() => {
    // First check the fetched role from user_profiles table
    if (userRole.value === 'admin') {
      return true;
    }

    // Fallback checks for other places where admin role might be stored
    // 1. Check user_metadata (Supabase user metadata)
    if (user.value?.user_metadata?.role === 'admin' ||
        user.value?.user_metadata?.is_admin === true) {
      return true;
    }

    // 2. Check app_metadata (Supabase app metadata - set by backend)
    if (user.value?.app_metadata?.role === 'admin' ||
        user.value?.app_metadata?.is_admin === true) {
      return true;
    }

    // 3. Check user object directly (some systems add role directly)
    if ((user.value as any)?.role === 'admin') {
      return true;
    }

    // 4. For testing/development - check email domain
    if (user.value?.email?.endsWith('@admin.com') ||
        user.value?.email?.endsWith('@tiko.com')) {
      return true;
    }

    return false;
  })

  // Actions
  const signInWithEmail = async (email: string, password: string) => {
    isLoading.value = true
    error.value = null

    try {
      const result = await authService.signInWithEmail(email, password)

      if (!result.success) {
        throw new Error(result.error || 'Authentication failed')
      }

      if (result.user) {
        user.value = result.user

        // Load user settings from metadata if available
        try {
          if (result.user.user_metadata?.['settings']) {
            userSettings.value = {
              ...result.user.user_metadata['settings'],
              ...userSettings.value // localStorage takes precedence
            }
            saveSettingsToStorage()
          }
        } catch (err) {
          console.error('[Auth Store] Error loading user settings:', err)
          // Continue without settings - don't break auth flow
        }
      }
      if (result.session) {
        session.value = result.session
        // Sync with Supabase for RLS
        await authSyncService.syncWithSupabase(result.session)
        // Fetch user role after successful login
        await fetchUserRole()
      }

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
      const result = await authService.signUpWithEmail(email, password, fullName)

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
    console.log('[Auth Store] signInWithPasswordlessEmail called with:', { email, fullName })
    isLoading.value = true
    error.value = null

    try {
      console.log('[Auth Store] Calling authService.signInWithMagicLink...')
      const result = await authService.signInWithMagicLink(email, fullName)
      console.log('[Auth Store] Magic link result:', result)

      if (!result.success) {
        // Handle rate limiting with a user-friendly message
        if (result.error?.includes('rate_limit') || result.error?.includes('24 seconds')) {
          throw new Error('Too many attempts. Please wait a moment before trying again.')
        }
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

      if (result.user) {
        user.value = result.user

        // Load user settings from metadata if available
        try {
          if (result.user.user_metadata?.['settings']) {
            userSettings.value = {
              ...result.user.user_metadata['settings'],
              ...userSettings.value // localStorage takes precedence
            }
            saveSettingsToStorage()
          }
        } catch (err) {
          console.error('[Auth Store] Error loading user settings:', err)
          // Continue without settings - don't break auth flow
        }
      }
      if (result.session) {
        session.value = result.session
        // Sync with Supabase for RLS
        await authSyncService.syncWithSupabase(result.session)
        // Fetch user role after successful login
        await fetchUserRole()
      }

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
      // Clear Supabase session
      await authSyncService.clearSupabaseSession()
    } catch (err) {
      console.warn('Logout failed:', err)
    } finally {
      // Clear local state
      user.value = null
      session.value = null
      // Don't clear settings - keep them for next login
    }
  }

  // Load settings from localStorage
  const loadSettingsFromStorage = () => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        userSettings.value = parsed
      }
    } catch (err) {
      console.error('[Auth Store] Failed to load settings from localStorage:', err)
    }
  }

  // Save settings to localStorage
  const saveSettingsToStorage = () => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(userSettings.value))
    } catch (err) {
      console.error('[Auth Store] Failed to save settings to localStorage:', err)
    }
  }

  // Clean up old locale storage keys
  const cleanupOldLocaleStorage = () => {
    try {
      // Remove old tiko-language key if it exists
      const oldKey = localStorage.getItem('tiko-language')
      if (oldKey) {
        console.log('[Auth Store] Removing old tiko-language key')
        localStorage.removeItem('tiko-language')
      }
    } catch (err) {
      console.error('[Auth Store] Error during old locale cleanup:', err)
    }
  }

  // Sync settings to API (user metadata)
  const syncSettingsToAPI = async () => {
    if (!user.value) return

    try {
      await updateUserMetadata({ settings: userSettings.value })
    } catch (err) {
      console.error('[Auth Store] Failed to sync settings to API:', err)
    }
  }

  // Update a specific setting
  const updateSetting = async (key: keyof UserProfileSettings, value: any) => {

    // Update the reactive state
    userSettings.value = {
      ...userSettings.value,
      [key]: value
    }

    // Save to localStorage immediately for persistence
    saveSettingsToStorage()

    // Sync to API if user is authenticated
    if (user.value) {
      await syncSettingsToAPI()
    }
  }

  // Update multiple settings at once
  const updateSettings = async (settings: Partial<UserProfileSettings>) => {

    // Update the reactive state
    userSettings.value = {
      ...userSettings.value,
      ...settings
    }

    // Save to localStorage immediately
    saveSettingsToStorage()

    // If language was updated, also update the tiko:locale key for i18n
    if (settings.language) {
      try {
        localStorage.setItem('tiko:locale', settings.language)

        // Trigger custom event to notify i18n system
        window.dispatchEvent(new CustomEvent('tiko-locale-change', {
          detail: { locale: settings.language }
        }))
      } catch (err) {
        console.error('[Auth Store] Failed to update i18n locale:', err)
      }
    }

    // Sync to API if user is authenticated
    if (user.value) {
      await syncSettingsToAPI()
    }
  }

  const fetchUserRole = async () => {
    if (!user.value?.id) return

    try {
      const response = await fetch('https://kejvhvszhevfwgsztedf.supabase.co/rest/v1/rpc/get_my_role', {
        method: 'POST',
        headers: {
          'apikey': import.meta.env?.VITE_SUPABASE_SECRET || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE',
          'Authorization': `Bearer ${session.value?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: '{}'
      })

      if (response.ok) {
        const role = await response.json()
        userRole.value = role
        console.log('[Auth Store] User role:', role)
      }
    } catch (err) {
      console.error('[Auth Store] Failed to fetch user role:', err)
    }
  }

  const initializeFromStorage = async () => {
    try {
      // Clean up old locale storage keys first
      cleanupOldLocaleStorage()

      // First, load settings from localStorage for immediate use
      loadSettingsFromStorage()

      // Ensure i18n locale is synced if language exists in loaded settings
      if (userSettings.value.language) {
        try {
          localStorage.setItem('tiko:locale', userSettings.value.language)
        } catch (err) {
          console.error('[Auth Store] Failed to sync i18n locale from storage:', err)
        }
      }

      // Then check for authenticated session
      const currentSession = await authService.getSession()

      // Session loaded successfully

      if (currentSession) {
        user.value = currentSession.user
        session.value = currentSession

        // Sync with Supabase for RLS
        await authSyncService.syncWithSupabase(currentSession)

        // Fetch user role
        await fetchUserRole()

        // If user has settings in metadata, merge them with localStorage
        // localStorage takes precedence as it may have more recent changes
        if (currentSession.user?.user_metadata?.['settings']) {
          const apiSettings = currentSession.user.user_metadata['settings']

          // Merge API settings with localStorage settings
          // localStorage values take precedence
          userSettings.value = {
            ...apiSettings,
            ...userSettings.value
          }

          // Save the merged settings back to localStorage
          saveSettingsToStorage()

          // Ensure i18n locale is synced if language exists
          if (userSettings.value.language) {
            try {
              localStorage.setItem('tiko:locale', userSettings.value.language)
            } catch (err) {
              console.error('[Auth Store] Failed to sync i18n locale on init:', err)
            }
          }

          // If settings differ from API, sync back to API
          if (JSON.stringify(apiSettings) !== JSON.stringify(userSettings.value)) {
            await syncSettingsToAPI()
          }
        }
      }
    } catch (err) {
      console.error('Failed to initialize auth:', err)
    }
  }

  const setupAuthListener = () => {
    // Listen for storage events to handle external session changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'tiko_auth_session') {
        if (!e.newValue) {
          // Session was cleared externally
          user.value = null
          session.value = null
        } else {
          try {
            const newSession = JSON.parse(e.newValue)
            session.value = newSession
            user.value = newSession.user
          } catch (err) {
            console.error('[Auth Store] Failed to parse session from storage event:', err)
          }
        }
      }
    })

    // Also check for session changes periodically (for same-tab changes)
    setInterval(() => {
      const storedSession = localStorage.getItem('tiko_auth_session')
      if (!storedSession && session.value) {
        // Session was cleared
        user.value = null
        session.value = null
      }
    }, 1000)
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
    console.log('[Auth Store] updateLanguage called with:', language)

    await updateSetting('language', language)

    // Also update the i18n locale directly in localStorage
    // Use the same key that the i18n system uses: 'tiko:locale'
    try {
      console.log('[Auth Store] Setting tiko:locale to:', language)
      localStorage.setItem('tiko:locale', language)

      // Trigger custom event to notify i18n system
      window.dispatchEvent(new CustomEvent('tiko-locale-change', {
        detail: { locale: language }
      }))

      // Verify what was actually stored
      const stored = localStorage.getItem('tiko:locale')
      console.log('[Auth Store] Verification - stored value:', stored)
    } catch (err) {
      console.error('[Auth Store] Failed to update i18n locale:', err)
    }
  }

  const updateTheme = async (theme: 'light' | 'dark' | 'auto') => {
    await updateSetting('theme', theme)
  }

  // Watch for settings changes
  watch(userSettings, () => {
    // This is handled in updateSetting/updateSettings methods
  }, { deep: true })

  const handleMagicLinkCallback = async () => {
    try {
      const result = await authService.handleMagicLinkCallback()

      if (result.success && result.user && result.session) {
        user.value = result.user
        session.value = result.session

        // Load user settings if available
        try {
          if (result.user.user_metadata?.['settings']) {
            userSettings.value = {
              ...result.user.user_metadata['settings'],
              ...userSettings.value // localStorage takes precedence
            }
            saveSettingsToStorage()
          }
        } catch (err) {
          console.error('[Auth Store] Error loading user settings:', err)
        }
      }

      return result
    } catch (err) {
      console.error('[Auth Store] Error handling magic link:', err)
      return { success: false, error: 'Failed to process magic link' }
    }
  }

  const cleanupDataUrlAvatar = async () => {
    try {
      const result = await authService.cleanupDataUrlAvatar()

      if (result.success && result.user) {
        user.value = result.user

        // Update session with cleaned user data
        if (session.value) {
          session.value = {
            ...session.value,
            user: result.user
          }
        }
      }

      return result
    } catch (err) {
      console.error('[Auth Store] Error cleaning up avatar:', err)
      return { success: false, error: 'Failed to clean up avatar' }
    }
  }

  const refreshUserData = async () => {
    try {
      // Get fresh user data from the API
      const result = await authService.getCurrentUser()

      if (result.success && result.user) {
        // Update the user in the store
        user.value = result.user

        // Update session with fresh user data
        if (result.session) {
          session.value = result.session
        } else if (session.value) {
          session.value = {
            ...session.value,
            user: result.user
          }
        }

        return { success: true, user: result.user }
      }

      return { success: false, error: result.error || 'Failed to refresh user data' }
    } catch (err) {
      console.error('[Auth Store] Error refreshing user data:', err)
      return { success: false, error: 'Failed to refresh user data' }
    }
  }

  return {
    // State
    user,
    session,
    isLoading,
    error,
    userSettings,

    // Getters
    isAuthenticated,
    currentLanguage,
    currentTheme,
    isAdmin,

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
    updateLanguage,
    updateTheme,
    updateSetting,
    updateSettings,
    handleMagicLinkCallback,
    cleanupDataUrlAvatar,
    refreshUserData
  }
})
