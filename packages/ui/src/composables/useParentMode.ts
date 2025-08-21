/**
 * Parent Mode Composable - Wrapper around Pinia store
 * Provides the same API but uses Pinia for state management
 */

import { onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useParentModeStore } from '../stores/parentMode'
import type { ParentModeSettings } from './useParentMode.model'

/**
 * Parent Mode composable - wrapper around the Pinia store
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
 */
export function useParentMode(_appName?: string) {
  const store = useParentModeStore()

  // Get reactive refs from store
  const {
    isEnabled,
    isUnlocked,
    canManageContent,
    showVisualIndicator,
    sessionExpiresAt,
    settings
  } = storeToRefs(store)


  // Initialize on mount
  onMounted(() => {
    store.initialize()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    store.stopSessionCheck()
  })

  return {
    // State (as refs)
    isEnabled,
    isUnlocked,
    canManageContent,
    showVisualIndicator,
    sessionExpiresAt,
    settings,

    // Actions (direct from store)
    initialize: () => store.initialize(),
    enable: (pin: string) => store.enable(pin),
    disable: () => store.disable(),
    unlock: (pin: string) => store.unlock(pin),
    lock: () => store.lock(),
    hasPermission: (targetAppName: string, permission: string) => store.hasPermission(targetAppName, permission),
    getAppPermissions: (targetAppName: string) => store.getAppPermissions(targetAppName),
    updateSettings: (newSettings: Partial<ParentModeSettings>) => store.updateSettings(newSettings)
  }
}
