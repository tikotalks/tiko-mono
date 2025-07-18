/**
 * Global Parent Mode Composable
 * Provides secure parent controls across all Tiko applications
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore, parentModeService } from '@tiko/core'
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

      // Load parent mode settings using the service
      const data = await parentModeService.getData(user.id)
      
      if (data) {
        globalParentState.value.isEnabled = data.parent_mode_enabled
        globalParentState.value.pinHash = data.parent_pin_hash
        globalParentState.value.settings = {
          ...globalParentState.value.settings,
          ...data.parent_mode_settings
        }
        
        console.log('[Parent Mode] Loaded parent mode data via service:', data)
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
      const user = authStore.user
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Use the service to enable parent mode
      const result = await parentModeService.enable(user.id, pin, globalParentState.value.settings)
      
      if (!result.success) {
        return result
      }

      // Update local state
      globalParentState.value.isEnabled = true
      globalParentState.value.pinHash = result.data!.parent_pin_hash

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

      // Clear using service
      const result = await parentModeService.disable(user.id)

      if (!result.success) {
        console.error('Failed to disable parent mode:', result.error)
        return { success: false, error: result.error || 'Failed to disable parent mode' }
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
      const user = authStore.user
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Use the service to verify PIN
      const result = await parentModeService.verifyPin(user.id, pin)
      
      if (!result.success) {
        return result
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

      // Update settings using service
      const result = await parentModeService.updateSettings(user.id, updatedSettings)

      if (!result.success) {
        console.error('Failed to update parent mode settings:', result.error)
        return { success: false, error: result.error || 'Failed to save settings' }
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