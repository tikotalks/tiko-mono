/**
 * Vue DevTools integration for i18n debugging
 * 
 * This plugin exposes i18n data to Vue DevTools for easier debugging
 * and inspection of loaded translations.
 */

import { App, computed, ref } from 'vue'
import { useI18n } from './useI18n'

// Global i18n state for devtools
const globalI18nState = ref<any>(null)

// Define the devtools state ID
const DEVTOOLS_STATE_ID = 'tiko-i18n'
const DEVTOOLS_INSPECTOR_ID = 'tiko-i18n-inspector'

/**
 * Vue plugin to expose i18n data to devtools
 */
export const i18nDevtoolsPlugin = {
  install(app: App) {
    // Make i18n data available globally for debugging
    const i18n = useI18n()
    
    // Store reference to i18n instance
    globalI18nState.value = i18n
    
    // Setup Vue DevTools integration
    if (typeof window !== 'undefined' && (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__) {
      const devtools = (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__
      
      // Wait for devtools to be ready
      devtools.on('app:init', (appInstance: any) => {
        // Add custom inspector for i18n
        if (devtools.addInspector) {
          devtools.addInspector({
            id: DEVTOOLS_INSPECTOR_ID,
            label: '🌍 Tiko i18n',
            icon: 'language',
            treeFilterPlaceholder: 'Search translations...'
          })
          
          // Add inspector state
          devtools.on('getInspectorTree', (payload: any) => {
            if (payload.inspectorId === DEVTOOLS_INSPECTOR_ID && payload.app === app) {
              const translations = i18n.__devtools.currentTranslations.value
              const rootNodes: any[] = []
              
              // Group translations by prefix
              const groups: Record<string, string[]> = {}
              for (const key of Object.keys(translations)) {
                const prefix = key.split('.')[0]
                if (!groups[prefix]) groups[prefix] = []
                groups[prefix].push(key)
              }
              
              // Create tree nodes
              for (const [prefix, keys] of Object.entries(groups)) {
                rootNodes.push({
                  id: prefix,
                  label: `${prefix} (${keys.length})`,
                  children: keys.slice(0, 100).map(key => ({
                    id: key,
                    label: key.replace(`${prefix}.`, ''),
                    tags: [{
                      label: translations[key].substring(0, 50) + (translations[key].length > 50 ? '...' : ''),
                      textColor: 0x000000,
                      backgroundColor: 0xffe4b5
                    }]
                  }))
                })
              }
              
              payload.rootNodes = rootNodes
            }
          })
          
          // Add inspector state details
          devtools.on('getInspectorState', (payload: any) => {
            if (payload.inspectorId === DEVTOOLS_INSPECTOR_ID && payload.app === app) {
              const translations = i18n.__devtools.currentTranslations.value
              
              if (payload.nodeId) {
                // Show specific translation details
                const value = translations[payload.nodeId]
                if (value !== undefined) {
                  payload.state = {
                    'Translation Details': [
                      { key: 'Key', value: payload.nodeId },
                      { key: 'Value', value: value },
                      { key: 'Length', value: value.length },
                      { key: 'Has Parameters', value: value.includes('{') }
                    ]
                  }
                }
              }
            }
          })
        }
        
        // Add timeline events
        if (devtools.addTimelineLayer) {
          devtools.addTimelineLayer({
            id: 'tiko-i18n-timeline',
            label: 'i18n Events',
            color: 0x3490dc
          })
        }
      })
      
      // Add custom component state
      devtools.on('inspectComponent', (payload: any) => {
        if (payload.componentInstance) {
          payload.instanceData.state.push({
            type: '🌍 i18n',
            key: 'i18n',
            value: {
              currentLocale: i18n.currentLocale.value,
              availableLocales: i18n.availableLocales.value,
              totalKeys: Object.keys(i18n.__devtools.currentTranslations.value).length,
              isReady: i18n.isReady.value
            },
            editable: false
          })
        }
      })
    }
    
    // Expose to window for console debugging (development only)
    if (import.meta.env.DEV) {
      (window as any).__TIKO_I18N__ = {
        // Current state
        get currentLocale() { return i18n.currentLocale.value },
        get availableLocales() { return i18n.availableLocales.value },
        get isReady() { return i18n.isReady.value },
        get totalKeys() { return Object.keys(i18n.__devtools.currentTranslations.value).length },
        
        // Methods
        t: i18n.t,
        setLocale: i18n.setLocale,
        hasKey: i18n.hasKey,
        
        // Debug data
        get debugInfo() { return i18n.__devtools.debugInfo.value },
        get stats() { return i18n.__devtools.translationStats.value },
        get allTranslations() { return i18n.__devtools.staticTranslations.value },
        get currentTranslations() { return i18n.__devtools.currentTranslations.value },
        get keys() { return i18n.keys.value },
        
        // Utility methods for console debugging
        searchKeys: (pattern: string) => {
          const translations = i18n.__devtools.currentTranslations.value
          const regex = new RegExp(pattern, 'i')
          return Object.keys(translations).filter(key => regex.test(key))
        },
        
        searchValues: (pattern: string) => {
          const translations = i18n.__devtools.currentTranslations.value
          const regex = new RegExp(pattern, 'i')
          const results: Record<string, string> = {}
          for (const [key, value] of Object.entries(translations)) {
            if (typeof value === 'string' && regex.test(value)) {
              results[key] = value
            }
          }
          return results
        },
        
        getTranslation: (key: string) => {
          return i18n.t(key)
        },
        
        getMissingKeys: () => {
          const currentTranslations = i18n.__devtools.currentTranslations.value
          const enTranslations = i18n.__devtools.staticTranslations.value.en || {}
          const missing: string[] = []
          
          for (const key of Object.keys(enTranslations)) {
            if (!currentTranslations[key]) {
              missing.push(key)
            }
          }
          
          return missing
        }
      }
      
      console.info(
        '%c🌍 Tiko i18n DevTools Loaded',
        'background: #3490dc; color: white; padding: 2px 6px; border-radius: 3px',
        '\n\nAccess i18n data via window.__TIKO_I18N__',
        '\n\nAvailable methods:',
        '\n- __TIKO_I18N__.currentLocale',
        '\n- __TIKO_I18N__.setLocale("nl")',
        '\n- __TIKO_I18N__.searchKeys("admin")',
        '\n- __TIKO_I18N__.searchValues("save")',
        '\n- __TIKO_I18N__.getTranslation("common.save")',
        '\n- __TIKO_I18N__.getMissingKeys()',
        '\n- __TIKO_I18N__.stats',
        '\n- __TIKO_I18N__.debugInfo'
      )
    }
    
    // Provide i18n state for child components
    app.provide('i18nDevtools', globalI18nState)
    
    // Add global properties for template access (optional)
    app.config.globalProperties.$i18nDebug = computed(() => ({
      locale: i18n.currentLocale.value,
      totalKeys: Object.keys(i18n.__devtools.currentTranslations.value).length,
      isReady: i18n.isReady.value
    }))
  }
}

/**
 * Composable to access i18n devtools data
 */
export function useI18nDevtools() {
  return {
    state: globalI18nState,
    isAvailable: computed(() => globalI18nState.value !== null),
    getDebugInfo: () => globalI18nState.value?.__devtools?.debugInfo.value,
    getStats: () => globalI18nState.value?.__devtools?.translationStats.value,
    searchKeys: (pattern: string) => {
      if (!globalI18nState.value) return []
      const translations = globalI18nState.value.__devtools.currentTranslations.value
      const regex = new RegExp(pattern, 'i')
      return Object.keys(translations).filter(key => regex.test(key))
    }
  }
}