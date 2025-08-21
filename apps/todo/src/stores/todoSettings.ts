import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useAppStore } from '@tiko/core'

export interface TodoSettings {
  showCompleted: boolean
  sortOrder: 'manual' | 'alphabetical' | 'date'
  itemDensity: 'compact' | 'normal' | 'spacious'
  showAnimations: boolean
  confirmDeletions: boolean
  autoArchiveDays: number // 0 = disabled
}

export const useTodoSettingsStore = defineStore('todoSettings', () => {
  // Get app store lazily to avoid initialization issues
  let appStore: ReturnType<typeof useAppStore> | null = null
  
  const getAppStore = () => {
    if (!appStore) {
      appStore = useAppStore()
    }
    return appStore
  }
  
  // Default settings
  const defaultSettings: TodoSettings = {
    showCompleted: true,
    sortOrder: 'manual',
    itemDensity: 'normal',
    showAnimations: true,
    confirmDeletions: true,
    autoArchiveDays: 0
  }

  // Computed settings - merge defaults with stored settings
  const settings = computed<TodoSettings>(() => {
    const store = getAppStore()
    const storedSettings = store.getAppSettings('todo')
    return { ...defaultSettings, ...storedSettings }
  })

  /**
   * Update settings
   */
  const updateSettings = async (updates: Partial<TodoSettings>): Promise<boolean> => {
    try {
      const store = getAppStore()
      const newSettings = { ...settings.value, ...updates }
      await store.updateAppSettings('todo', newSettings)
      return true
    } catch (err) {
      console.error('Failed to update todo settings:', err)
      return false
    }
  }

  /**
   * Load state from storage
   */
  const loadState = async (): Promise<void> => {
    try {
      const store = getAppStore()
      await store.loadAppSettings('todo')
    } catch (err) {
      console.error('Failed to load todo settings:', err)
    }
  }

  /**
   * Reset settings to defaults
   */
  const resetSettings = async (): Promise<boolean> => {
    return await updateSettings(defaultSettings)
  }

  return {
    // State
    settings,

    // Actions
    updateSettings,
    loadState,
    resetSettings
  }
})