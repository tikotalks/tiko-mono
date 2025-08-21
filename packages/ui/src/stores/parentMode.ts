import { defineStore } from 'pinia'
import { useAuthStore, parentModeService } from '@tiko/core'
import type { ParentModeSettings } from '../composables/useParentMode.model'

// Lazy initialization for auth store to avoid Pinia initialization issues
let authStore: ReturnType<typeof useAuthStore> | null = null
const getAuthStore = () => {
  if (!authStore) {
    authStore = useAuthStore()
  }
  return authStore
}

export const useParentModeStore = defineStore('parentMode', {
  state: () => ({
    isEnabled: false,
    isUnlocked: false,
    sessionExpiresAt: null as Date | null,
    pinHash: null as string | null,
    settings: {
      sessionTimeoutMinutes: 30,
      showVisualIndicator: true,
      autoLockOnAppSwitch: true,
      requirePinForSettings: true
    } as ParentModeSettings,
    appPermissions: {
      radio: { canManageItems: true, canChangeSettings: true },
      cards: { canEditCards: true, canAddCards: true, canDeleteCards: true },
      timer: { canChangeSettings: true },
      'yes-no': { canChangeSettings: true },
      type: { canChangeSettings: true }
    },
    hasInitialized: false,
    sessionCheckInterval: null as NodeJS.Timeout | null
  }),

  getters: {
    isSessionActive(): boolean {
      if (!this.sessionExpiresAt) return false
      return new Date() < this.sessionExpiresAt
    },
    
    canManageContent(): boolean {
      return this.isEnabled && this.isUnlocked && this.isSessionActive
    },
    
    showVisualIndicator(): boolean {
      return this.canManageContent && this.settings.showVisualIndicator
    }
  },

  actions: {
    async initialize() {
      // Skip if already initialized
      if (this.hasInitialized) {
          return
      }

      try {
        const authStore = getAuthStore()
        const user = authStore.user
        if (!user) return

        // Load parent mode settings
        const data = await parentModeService.getData(user.id)
        
        if (data) {
          // Only update if we're not already in an active session
          const currentlyUnlocked = this.isUnlocked
          
          // Only consider parent mode enabled if there's actually a PIN hash
          this.isEnabled = data.parent_mode_enabled && !!data.parent_pin_hash
          this.pinHash = data.parent_pin_hash
          this.settings = {
            ...this.settings,
            ...data.parent_mode_settings
          }
          
          // Preserve the unlocked state if we're in an active session
          if (currentlyUnlocked && this.sessionExpiresAt && new Date() < this.sessionExpiresAt) {
            this.isUnlocked = true
            }
          
        }

        // Start session check
        this.startSessionCheck()
        
        // Mark as initialized
        this.hasInitialized = true
      } catch (error) {
        console.error('[ParentModeStore] Error initializing:', error)
      }
    },

    async enable(pin: string): Promise<{ success: boolean; error?: string }> {
      try {
        const authStore = getAuthStore()
        const user = authStore.user
        if (!user) {
          return { success: false, error: 'User not authenticated' }
        }

        const result = await parentModeService.enable(user.id, pin, this.settings)
        
        if (!result.success) {
          return result
        }

        // Update state
        this.isEnabled = true
        this.pinHash = result.data!.parent_pin_hash

        // Automatically unlock after enabling
        const sessionDuration = this.settings.sessionTimeoutMinutes * 60 * 1000
        this.sessionExpiresAt = new Date(Date.now() + sessionDuration)
        this.isUnlocked = true
        
        
        this.startSessionCheck()

        return { success: true }
      } catch (error) {
        console.error('[ParentModeStore] Error enabling:', error)
        return { success: false, error: 'An unexpected error occurred' }
      }
    },

    async disable(): Promise<{ success: boolean; error?: string }> {
      try {
        const authStore = getAuthStore()
        const user = authStore.user
        if (!user) {
          return { success: false, error: 'User not authenticated' }
        }

        const result = await parentModeService.disable(user.id)

        if (!result.success) {
          return { success: false, error: result.error || 'Failed to disable parent mode' }
        }

        // Clear state
        this.isEnabled = false
        this.isUnlocked = false
        this.sessionExpiresAt = null
        this.pinHash = null

        this.stopSessionCheck()

        return { success: true }
      } catch (error) {
        console.error('[ParentModeStore] Error disabling:', error)
        return { success: false, error: 'An unexpected error occurred' }
      }
    },

    async unlock(pin: string): Promise<{ success: boolean; error?: string }> {
      try {
        const authStore = getAuthStore()
        const user = authStore.user
        if (!user) {
          return { success: false, error: 'User not authenticated' }
        }

        const result = await parentModeService.verifyPin(user.id, pin)
        
        if (!result.success) {
          return result
        }

        // Set session
        const sessionDuration = this.settings.sessionTimeoutMinutes * 60 * 1000
        this.sessionExpiresAt = new Date(Date.now() + sessionDuration)
        this.isUnlocked = true
        

        this.startSessionCheck()

        return { success: true }
      } catch (error) {
        console.error('[ParentModeStore] Error unlocking:', error)
        return { success: false, error: 'An unexpected error occurred' }
      }
    },

    lock() {
      this.isUnlocked = false
      this.sessionExpiresAt = null
      this.stopSessionCheck()
    },

    async updateSettings(newSettings: Partial<ParentModeSettings>): Promise<{ success: boolean; error?: string }> {
      try {
        if (!this.canManageContent) {
          return { success: false, error: 'Parent mode must be unlocked to change settings' }
        }

        const authStore = getAuthStore()
        const user = authStore.user
        if (!user) {
          return { success: false, error: 'User not authenticated' }
        }

        const updatedSettings = {
          ...this.settings,
          ...newSettings
        }

        const result = await parentModeService.updateSettings(user.id, updatedSettings)

        if (!result.success) {
          return { success: false, error: result.error || 'Failed to save settings' }
        }

        this.settings = updatedSettings

        return { success: true }
      } catch (error) {
        console.error('[ParentModeStore] Error updating settings:', error)
        return { success: false, error: 'An unexpected error occurred' }
      }
    },

    startSessionCheck() {
      this.stopSessionCheck() // Clear any existing interval
      
      this.sessionCheckInterval = setInterval(() => {
        if (this.isUnlocked && !this.isSessionActive) {
          this.lock()
        }
      }, 30000) // Check every 30 seconds
    },

    stopSessionCheck() {
      if (this.sessionCheckInterval) {
        clearInterval(this.sessionCheckInterval)
        this.sessionCheckInterval = null
      }
    },

    hasPermission(targetAppName: string, permission: string): boolean {
      if (!this.canManageContent) return false
      
      const appPermissions = this.appPermissions[targetAppName]
      if (!appPermissions) return false
      
      return (appPermissions as any)[permission] === true
    },

    getAppPermissions(targetAppName: string) {
      return this.appPermissions[targetAppName] || null
    }
  }
})