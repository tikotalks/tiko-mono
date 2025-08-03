/**
 * Icon Registry for managing tree-shakable icons
 * Based on open-icon Vue integration pattern
 */
import { inject, provide, reactive, type App, type InjectionKey, type Component } from 'vue'

export interface IconRegistry {
  icons: Record<string, Component | string>
  aliases: Record<string, string>
  register(name: string, icon: Component | string): void
  registerAlias(alias: string, target: string): void
  get(name: string): Component | string | undefined
  has(name: string): boolean
}

export const iconRegistryKey: InjectionKey<IconRegistry> = Symbol('iconRegistry')

export function createIconRegistry(): IconRegistry {
  const icons = reactive<Record<string, Component | string>>({})
  const aliases = reactive<Record<string, string>>({})

  return {
    icons,
    aliases,
    register(name: string, icon: Component | string) {
      icons[name] = icon
    },
    registerAlias(alias: string, target: string) {
      aliases[alias] = target
    },
    get(name: string): Component | string | undefined {
      // Check if it's a direct icon
      if (icons[name]) {
        return icons[name]
      }
      
      // Check if it's an alias
      const aliasTarget = aliases[name]
      if (aliasTarget && icons[aliasTarget]) {
        return icons[aliasTarget]
      }
      
      return undefined
    },
    has(name: string): boolean {
      return !!icons[name] || !!(aliases[name] && icons[aliases[name]])
    }
  }
}

export interface IconRegistryPluginOptions {
  icons?: Record<string, Component | string>
  aliases?: Record<string, string>
}

export const IconRegistryPlugin = {
  install(app: App, options: IconRegistryPluginOptions = {}) {
    const registry = createIconRegistry()
    
    // Register initial icons
    if (options.icons) {
      Object.entries(options.icons).forEach(([name, icon]) => {
        registry.register(name, icon)
      })
    }
    
    // Register initial aliases
    if (options.aliases) {
      Object.entries(options.aliases).forEach(([alias, target]) => {
        registry.registerAlias(alias, target)
      })
    }
    
    // Provide registry to all components
    app.provide(iconRegistryKey, registry)
  }
}

// Composable for accessing the icon registry
export function useIconRegistry(): IconRegistry | undefined {
  return inject(iconRegistryKey)
}