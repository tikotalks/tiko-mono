import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AppSettings, SyncAction } from '../types/user'
import { userSettingsService } from '../services'
import { useAuthStore } from './auth'

export const useAppStore = defineStore('app', () => {
  const authStore = useAuthStore()

  // State
  const appSettings = ref<Record<string, AppSettings>>({})
  const isOffline = ref(!navigator.onLine)
  const syncQueue = ref<SyncAction[]>([])
  const lastSync = ref<Date | null>(null)

  // Getters
  const hasPendingSync = computed(() => syncQueue.value.length > 0)
  const isOnline = computed(() => !isOffline.value)

  // Actions
  const getAppSettings = (appName: string) => {
    return appSettings.value[appName]?.settings || {}
  }

  const updateAppSettings = async (appName: string, settings: Record<string, any>) => {
    const settingsId = `${appName}_settings`
    const userId = authStore.user?.id
    
    if (!userId) {
      console.warn('No user ID available for settings update')
      return
    }
    
    // Optimistically update local state
    appSettings.value[appName] = {
      id: settingsId,
      userId,
      appName,
      settings,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add to sync queue
    const syncAction: SyncAction = {
      id: crypto.randomUUID(),
      type: 'UPDATE_APP_SETTINGS',
      payload: { appName, settings },
      timestamp: new Date(),
      synced: false
    }
    
    syncQueue.value.push(syncAction)

    // Try to sync immediately if online
    if (isOnline.value) {
      await syncPendingActions()
    }
  }

  const syncPendingActions = async () => {
    if (!isOnline.value || syncQueue.value.length === 0) return

    const actionsToSync = syncQueue.value.filter(action => !action.synced)
    
    for (const action of actionsToSync) {
      try {
        await syncAction(action)
        action.synced = true
      } catch (err) {
        console.error('Failed to sync action:', action, err)
        // Keep in queue for retry
        break
      }
    }

    // Remove synced actions
    syncQueue.value = syncQueue.value.filter(action => !action.synced)
    lastSync.value = new Date()
  }

  const syncAction = async (action: SyncAction) => {
    console.log('[AppStore] Syncing action:', action.type)
    
    const userId = authStore.user?.id
    if (!userId) {
      console.error('[AppStore] ❌ No user ID available for sync')
      throw new Error('No user ID available for sync')
    }

    switch (action.type) {
      case 'UPDATE_APP_SETTINGS':
        const { appName, settings } = action.payload
        console.log(`[AppStore] Upserting settings for app: ${appName}`)
        console.log('[AppStore] Settings to save:', settings)
        
        // Save user settings using the service
        const result = await userSettingsService.saveSettings(userId, appName, settings)
        
        if (!result.success) {
          console.error('[AppStore] ❌ Failed to save settings:', result.error)
          throw new Error(result.error || 'Failed to save settings')
        } else {
          console.log('[AppStore] ✅ Settings saved successfully')
        }
        break
      
      default:
        console.warn('[AppStore] Unknown sync action type:', action.type)
    }
  }

  const loadAppSettings = async (appName: string) => {
    console.log('[AppStore] ========== LOADING APP SETTINGS ==========')
    console.log('[AppStore] App name:', appName)
    console.log('[AppStore] Auth store state:', {
      user: authStore.user,
      session: authStore.session,
      isAuthenticated: authStore.isAuthenticated
    })
    
    const userId = authStore.user?.id
    if (!userId) {
      console.error('[AppStore] ❌ Cannot load settings - No user ID available')
      console.error('[AppStore] User object:', authStore.user)
      console.error('[AppStore] Session object:', authStore.session)
      console.error('[AppStore] Is authenticated:', authStore.isAuthenticated)
      return
    }
    
    console.log(`[AppStore] ✅ User ID found: ${userId}`)
    console.log(`[AppStore] Starting database query...`)

    try {
      console.log(`[AppStore] Getting settings for app: ${appName}, user: ${userId}`)
      
      const data = await userSettingsService.getSettings(userId, appName)
      
      console.log('[AppStore] Service response:', data)
      
      if (data) {
        console.log('[AppStore] ✅ Settings found, storing in local state')
        appSettings.value[appName] = {
          id: data.id,
          userId: data.user_id,
          appName: data.app_name,
          settings: data.settings,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        }
        console.log('[AppStore] Stored settings:', appSettings.value[appName])
      } else {
        console.log('[AppStore] ℹ️ No existing settings found for this app/user combination (this is normal for first-time users)')
      }
    } catch (err: any) {
      console.error('[AppStore] ❌ EXCEPTION caught while loading app settings')
      console.error('[AppStore] Error type:', err?.constructor?.name)
      console.error('[AppStore] Error message:', err?.message)
      console.error('[AppStore] Error stack:', err?.stack)
      console.error('[AppStore] Full error object:', err)
      console.error('[AppStore] Context:', {
        appName,
        userId,
        timestamp: new Date().toISOString()
      })
      
      // Check for specific error patterns
      if (err?.message?.includes('relation') && err?.message?.includes('does not exist')) {
        console.error('[AppStore] ⚠️ The user_settings table does not exist in the database!')
      } else if (err?.message?.includes('permission denied')) {
        console.error('[AppStore] ⚠️ Permission denied - check Row Level Security policies!')
      } else if (err?.message?.includes('JWT')) {
        console.error('[AppStore] ⚠️ Authentication issue - JWT token may be invalid or expired!')
      }
    }
    
    console.log('[AppStore] ========== END LOADING APP SETTINGS ==========')
  }

  const clearAppData = () => {
    appSettings.value = {}
    syncQueue.value = []
    lastSync.value = null
  }

  const loadAllAppSettings = async () => {
    console.log('[AppStore] ========== LOADING ALL APP SETTINGS ==========')
    
    const userId = authStore.user?.id
    if (!userId) {
      console.warn('[AppStore] ❌ No user ID available for loading all settings')
      console.warn('[AppStore] Auth state:', {
        user: authStore.user,
        isAuthenticated: authStore.isAuthenticated
      })
      return
    }

    console.log(`[AppStore] Loading all settings for user: ${userId}`)

    try {
      console.log('[AppStore] Getting all settings for user:', userId)
      
      const data = await userSettingsService.getAllUserSettings(userId)

      console.log('[AppStore] Service response:', {
        hasData: !!data,
        dataLength: data?.length || 0
      })

      if (data && data.length > 0) {
        console.log(`[AppStore] ✅ Found ${data.length} app settings`)
        const settingsMap: Record<string, AppSettings> = {}
        
        data.forEach(row => {
          console.log(`[AppStore] Processing settings for app: ${row.app_name}`)
          settingsMap[row.app_name] = {
            id: row.id,
            userId: row.user_id,
            appName: row.app_name,
            settings: row.settings,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
          }
        })
        
        appSettings.value = settingsMap
        console.log('[AppStore] All settings stored in state:', Object.keys(settingsMap))
      } else {
        console.log('[AppStore] ℹ️ No settings found for this user')
      }
    } catch (err: any) {
      console.error('[AppStore] ❌ EXCEPTION in loadAllAppSettings:', err)
      console.error('[AppStore] Error type:', err?.constructor?.name)
      console.error('[AppStore] Error message:', err?.message)
      console.error('[AppStore] Full error:', err)
    }
    
    console.log('[AppStore] ========== END LOADING ALL APP SETTINGS ==========')
  }

  // Network status monitoring
  const initializeNetworkMonitoring = () => {
    const updateOnlineStatus = () => {
      isOffline.value = !navigator.onLine
      
      if (navigator.onLine && syncQueue.value.length > 0) {
        // Retry sync when coming back online
        syncPendingActions()
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Cleanup function
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }

  return {
    // State
    appSettings,
    isOffline,
    syncQueue,
    lastSync,
    
    // Getters
    hasPendingSync,
    isOnline,
    
    // Actions
    getAppSettings,
    updateAppSettings,
    syncPendingActions,
    loadAppSettings,
    loadAllAppSettings,
    clearAppData,
    initializeNetworkMonitoring
  }
})