/**
 * Global Parent Mode Composable
 * Provides secure parent controls across all Tiko applications
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore, supabase } from '@tiko/core'
import type { ParentModeState, ParentModeSettings, ParentModeAppPermissions } from './useParentMode.model'

// Global parent mode state
const globalParentState = ref<ParentModeState>({
  isEnabled: false,
  isUnlocked: false,
  sessionExpiresAt: null,
  pinHash: null,
  settings: {
    sessionTimeoutMinutes: 30,
    showVisualIndicator: true,
    autoLockOnAppSwitch: true,
    requirePinForSettings: true
  },
  appPermissions: {
    radio: { canManageItems: true, canChangeSettings: true },
    cards: { canEditCards: true, canAddCards: true, canDeleteCards: true },
    timer: { canChangeSettings: true },
    'yes-no': { canChangeSettings: true },
    type: { canChangeSettings: true }
  }
})

let sessionCheckInterval: NodeJS.Timeout | null = null

/**
 * Global Parent Mode composable for secure parental controls
 * 
 * Provides PIN-protected access to administrative features across all Tiko apps.
 * Includes session management, automatic timeouts, and app-specific permissions.
 * 
 * @returns Parent mode interface with authentication and permission methods
 * 
 * @example
 * // In any Tiko app
 * const parentMode = useParentMode()
 * 
 * // Check if parent mode is available and unlocked
 * if (parentMode.canManageContent.value) {
 *   // Show admin controls
 * }
 * 
 * // Unlock parent mode
 * await parentMode.unlock('1234')
 * 
 * // Check specific app permissions
 * if (parentMode.hasPermission('radio', 'canManageItems')) {
 *   // Allow item management
 * }
 */
export function useParentMode(appName?: string) {
  const authStore = useAuthStore()

  // Computed properties
  const isEnabled = computed(() => globalParentState.value.isEnabled)
  const isUnlocked = computed(() => globalParentState.value.isUnlocked)
  const isSessionActive = computed(() => {
    if (!globalParentState.value.sessionExpiresAt) return false
    return new Date() < globalParentState.value.sessionExpiresAt
  })

  /**
   * Check if parent mode is available and unlocked for content management
   */
  const canManageContent = computed(() => {
    return isEnabled.value && isUnlocked.value && isSessionActive.value
  })

  /**
   * Get visual indicator status
   */
  const showVisualIndicator = computed(() => {
    return canManageContent.value && globalParentState.value.settings.showVisualIndicator
  })

  /**
   * Initialize parent mode from user data
   */
  const initialize = async (): Promise<void> => {
    try {
      const user = authStore.user
      if (!user) return

      // Fetch parent mode settings from Supabase user metadata
      const { data, error } = await supabase
        .from('user_profiles')
        .select('parent_pin_hash, parent_mode_enabled, parent_mode_settings')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Failed to fetch parent mode settings:', error)
        return
      }

      if (data) {
        globalParentState.value.isEnabled = data.parent_mode_enabled || false
        globalParentState.value.pinHash = data.parent_pin_hash
        
        if (data.parent_mode_settings) {
          globalParentState.value.settings = {
            ...globalParentState.value.settings,
            ...data.parent_mode_settings
          }
        }
      }

      // Start session check interval
      startSessionCheck()
    } catch (error) {
      console.error('Error initializing parent mode:', error)
    }
  }

  /**
   * Enable parent mode with a new PIN
   */
  const enable = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return { success: false, error: 'PIN must be exactly 4 digits' }
      }

      const user = authStore.user
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Hash the PIN using a simple but secure method
      const pinHash = await hashPin(pin)

      // Save to Supabase
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          parent_pin_hash: pinHash,
          parent_mode_enabled: true,
          parent_mode_settings: globalParentState.value.settings
        })

      if (error) {
        console.error('Failed to enable parent mode:', error)
        return { success: false, error: 'Failed to save parent mode settings' }
      }

      globalParentState.value.isEnabled = true
      globalParentState.value.pinHash = pinHash

      // Automatically unlock after enabling (since we have the PIN)
      const sessionDuration = globalParentState.value.settings.sessionTimeoutMinutes * 60 * 1000
      globalParentState.value.sessionExpiresAt = new Date(Date.now() + sessionDuration)
      globalParentState.value.isUnlocked = true
      startSessionCheck()

      return { success: true }
    } catch (error) {
      console.error('Error enabling parent mode:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Disable parent mode
   */
  const disable = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const user = authStore.user
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Clear from Supabase
      const { error } = await supabase
        .from('user_profiles')
        .update({
          parent_pin_hash: null,
          parent_mode_enabled: false
        })
        .eq('user_id', user.id)

      if (error) {
        console.error('Failed to disable parent mode:', error)
        return { success: false, error: 'Failed to disable parent mode' }
      }

      // Clear local state
      globalParentState.value.isEnabled = false
      globalParentState.value.isUnlocked = false
      globalParentState.value.sessionExpiresAt = null
      globalParentState.value.pinHash = null

      stopSessionCheck()

      return { success: true }
    } catch (error) {
      console.error('Error disabling parent mode:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Unlock parent mode with PIN
   */
  const unlock = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!globalParentState.value.isEnabled || !globalParentState.value.pinHash) {
        return { success: false, error: 'Parent mode is not enabled' }
      }

      const isValid = await verifyPin(pin, globalParentState.value.pinHash)
      if (!isValid) {
        return { success: false, error: 'Incorrect PIN' }
      }

      // Set session
      const sessionDuration = globalParentState.value.settings.sessionTimeoutMinutes * 60 * 1000
      globalParentState.value.sessionExpiresAt = new Date(Date.now() + sessionDuration)
      globalParentState.value.isUnlocked = true

      startSessionCheck()

      return { success: true }
    } catch (error) {
      console.error('Error unlocking parent mode:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Lock parent mode (clear session)
   */
  const lock = (): void => {
    globalParentState.value.isUnlocked = false
    globalParentState.value.sessionExpiresAt = null
    stopSessionCheck()
  }

  /**
   * Check if user has specific permission for an app
   */
  const hasPermission = (targetAppName: string, permission: string): boolean => {
    if (!canManageContent.value) return false
    
    const appPermissions = globalParentState.value.appPermissions[targetAppName]
    if (!appPermissions) return false
    
    return (appPermissions as any)[permission] === true
  }

  /**
   * Get all permissions for a specific app
   */
  const getAppPermissions = (targetAppName: string): ParentModeAppPermissions[string] | null => {
    return globalParentState.value.appPermissions[targetAppName] || null
  }

  /**
   * Update parent mode settings
   */
  const updateSettings = async (newSettings: Partial<ParentModeSettings>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!canManageContent.value) {
        return { success: false, error: 'Parent mode must be unlocked to change settings' }
      }

      const user = authStore.user
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const updatedSettings = {
        ...globalParentState.value.settings,
        ...newSettings
      }

      // Save to Supabase
      const { error } = await supabase
        .from('user_profiles')
        .update({
          parent_mode_settings: updatedSettings
        })
        .eq('user_id', user.id)

      if (error) {
        console.error('Failed to update parent mode settings:', error)
        return { success: false, error: 'Failed to save settings' }
      }

      globalParentState.value.settings = updatedSettings

      return { success: true }
    } catch (error) {
      console.error('Error updating parent mode settings:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Start session expiry check interval
   */
  const startSessionCheck = (): void => {
    stopSessionCheck() // Clear any existing interval
    
    sessionCheckInterval = setInterval(() => {
      if (globalParentState.value.isUnlocked && !isSessionActive.value) {
        lock()
      }
    }, 30000) // Check every 30 seconds
  }

  /**
   * Stop session check interval
   */
  const stopSessionCheck = (): void => {
    if (sessionCheckInterval) {
      clearInterval(sessionCheckInterval)
      sessionCheckInterval = null
    }
  }

  /**
   * Hash PIN using Web Crypto API
   */
  const hashPin = async (pin: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(pin + 'tiko_parent_salt')
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Verify PIN against stored hash
   */
  const verifyPin = async (pin: string, storedHash: string): Promise<boolean> => {
    const pinHash = await hashPin(pin)
    return pinHash === storedHash
  }

  // Initialize on mount
  onMounted(() => {
    initialize()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    stopSessionCheck()
  })

  return {
    // State
    isEnabled,
    isUnlocked,
    canManageContent,
    showVisualIndicator,
    sessionExpiresAt: computed(() => globalParentState.value.sessionExpiresAt),
    settings: computed(() => globalParentState.value.settings),
    
    // Actions
    initialize,
    enable,
    disable,
    unlock,
    lock,
    hasPermission,
    getAppPermissions,
    updateSettings
  }
}