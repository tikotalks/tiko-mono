import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { authService } from '../services'
import type { AuthUser, AuthSession } from '../services/auth.service'

// User settings interface
export interface UserSettings {
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
  
  // User settings state - this is the single source of truth
  const userSettings = ref<UserSettings>({})
  
  // Storage key for settings
  const SETTINGS_STORAGE_KEY = 'tiko-user-settings'

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!session.value)
  const currentLanguage = computed(() => userSettings.value.language || 'en-GB')
  const currentTheme = computed(() => userSettings.value.theme || 'auto')

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
          if (result.user.user_metadata?.settings) {
            userSettings.value = {
              ...result.user.user_metadata.settings,
              ...userSettings.value // localStorage takes precedence
            }
            saveSettingsToStorage()
          }
        } catch (err) {
          console.error('[Auth Store] Error loading user settings:', err)
          // Continue without settings - don't break auth flow
        }
      }
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

      if (result.user) {
        user.value = result.user
        
        // Load user settings from metadata if available
        try {
          if (result.user.user_metadata?.settings) {
            userSettings.value = {
              ...result.user.user_metadata.settings,
              ...userSettings.value // localStorage takes precedence
            }
            saveSettingsToStorage()
          }
        } catch (err) {
          console.error('[Auth Store] Error loading user settings:', err)
          // Continue without settings - don't break auth flow
        }
      }
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
  const updateSetting = async (key: keyof UserSettings, value: any) => {
    
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
  const updateSettings = async (settings: Partial<UserSettings>) => {
    
    // Update the reactive state
    userSettings.value = {
      ...userSettings.value,
      ...settings
    }
    
    // Save to localStorage immediately
    saveSettingsToStorage()
    
    // Sync to API if user is authenticated
    if (user.value) {
      await syncSettingsToAPI()
    }
  }
  
  const initializeFromStorage = async () => {
    try {
      
      // First, load settings from localStorage for immediate use
      loadSettingsFromStorage()
      
      // Then check for authenticated session
      const currentSession = await authService.getSession()
      
      // Session loaded successfully

      if (currentSession) {
        user.value = currentSession.user
        session.value = currentSession
        
        // If user has settings in metadata, merge them with localStorage
        // localStorage takes precedence as it may have more recent changes
        if (currentSession.user?.user_metadata?.settings) {
          const apiSettings = currentSession.user.user_metadata.settings
          
          // Merge API settings with localStorage settings
          // localStorage values take precedence
          userSettings.value = {
            ...apiSettings,
            ...userSettings.value
          }
          
          // Save the merged settings back to localStorage
          saveSettingsToStorage()
          
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
    await updateSetting('language', language)
    
    // Also update the i18n locale directly in localStorage
    // This ensures immediate UI update
    try {
      localStorage.setItem('tiko-language', JSON.stringify(language))
    } catch (err) {
      console.error('[Auth Store] Failed to update i18n locale:', err)
    }
  }
  
  const updateTheme = async (theme: 'light' | 'dark' | 'auto') => {
    await updateSetting('theme', theme)
  }
  
  // Watch for settings changes to auto-save
  watch(userSettings, () => {
    // This is handled in updateSetting/updateSettings methods
    // This watcher is just for debugging
    console.log('[Auth Store] Settings changed:', userSettings.value)
  }, { deep: true })

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
    updateSettings
  }
})