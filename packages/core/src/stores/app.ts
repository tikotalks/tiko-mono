import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AppSettings, SyncAction } from '../types/user'
import { supabase } from '../lib/supabase'
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
    const userId = authStore.user?.id
    if (!userId) {
      throw new Error('No user ID available for sync')
    }

    switch (action.type) {
      case 'UPDATE_APP_SETTINGS':
        const { appName, settings } = action.payload
        
        // Upsert user settings in Supabase
        const { error } = await supabase
          .from('user_settings')
          .upsert(
            {
              user_id: userId,
              app_name: appName,
              settings,
              updated_at: new Date().toISOString()
            },
            {
              onConflict: 'user_id,app_name'
            }
          )
        
        if (error) {
          throw error
        }
        break
      
      default:
        console.warn('Unknown sync action type:', action.type)
    }
  }

  const loadAppSettings = async (appName: string) => {
    const userId = authStore.user?.id
    if (!userId) {
      console.warn('No user ID available for loading settings')
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('app_name', appName)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        appSettings.value[appName] = {
          id: data.id,
          userId: data.user_id,
          appName: data.app_name,
          settings: data.settings,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        }
      }
    } catch (err) {
      console.error('Failed to load app settings:', err)
    }
  }

  const clearAppData = () => {
    appSettings.value = {}
    syncQueue.value = []
    lastSync.value = null
  }

  const loadAllAppSettings = async () => {
    const userId = authStore.user?.id
    if (!userId) {
      console.warn('No user ID available for loading all settings')
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      if (data) {
        const settingsMap: Record<string, AppSettings> = {}
        data.forEach(row => {
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
      }
    } catch (err) {
      console.error('Failed to load all app settings:', err)
    }
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