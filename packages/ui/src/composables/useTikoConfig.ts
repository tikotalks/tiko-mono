import { computed, ref, type Ref, type ComputedRef, type CSSProperties } from 'vue'
import type { TikoConfig } from '../types/tiko-config'

const globalConfig = ref<TikoConfig | null>(null)

export function useTikoConfig(config?: TikoConfig) {
  // If config is provided, set it as the global config
  if (config) {
    globalConfig.value = config
  }
  
  const currentConfig = computed(() => globalConfig.value)
  
  const themeStyles = computed<CSSProperties>(() => {
    const styles: CSSProperties = {}
    
    if (currentConfig.value?.theme) {
      Object.entries(currentConfig.value.theme).forEach(([key, value]) => {
        if (value) {
          styles[`--color-${key}`] = `var(--color-${value})`
          styles[`--color-${key}-text`] = `var(--color-${value}-text)`
        }
      })
    }
    
    return styles
  })
  
  return {
    config: currentConfig,
    themeStyles
  }
}