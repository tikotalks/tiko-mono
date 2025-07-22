/**
 * Example setup for tree-shakable icons in a Vue app
 * This demonstrates how to register only the icons you need
 */

// In your main app file (e.g., main.ts):
/*
import { createApp } from 'vue'
import { IconRegistryPlugin } from '@tiko/ui'
import App from './App.vue'

// Import only the icons you need - these will be tree-shaken
import { 
  IconHomeM,
  IconSettingsM,
  IconAddM,
  IconEditM,
  IconDeleteM,
  IconSearchM,
  IconMenuM,
  IconArrowLeftM,
  IconCheckM,
  IconMultiplyM
} from 'open-icon/icons'

const app = createApp(App)

// Register the icons with the plugin
app.use(IconRegistryPlugin, {
  icons: {
    // Register with their actual names
    'home-m': IconHomeM,
    'settings-m': IconSettingsM,
    'add-m': IconAddM,
    'edit-m': IconEditM,
    'delete-m': IconDeleteM,
    'search-m': IconSearchM,
    'menu-m': IconMenuM,
    'arrow-left-m': IconArrowLeftM,
    'check-m': IconCheckM,
    'multiply-m': IconMultiplyM
  },
  aliases: {
    // Create convenient aliases
    'home': 'home-m',
    'settings': 'settings-m',
    'plus': 'add-m',
    'add': 'add-m',
    'edit': 'edit-m',
    'delete': 'delete-m',
    'trash': 'delete-m',
    'search': 'search-m',
    'menu': 'menu-m',
    'back': 'arrow-left-m',
    'arrow-left': 'arrow-left-m',
    'check': 'check-m',
    'close': 'multiply-m',
    'x': 'multiply-m'
  }
})

app.mount('#app')
*/

// Usage in components:
/*
<template>
  <!-- These will use registered icons (fast, no dynamic loading) -->
  <TIcon name="home" />
  <TIcon name="settings" />
  <TIcon name="plus" />
  
  <!-- These will fall back to dynamic loading if not registered -->
  <TIcon name="some-other-icon" />
</template>
*/

// For dynamic icon registration in a component:
/*
<script setup>
import { useIconRegistry } from '@tiko/ui'
import { IconShareM } from 'open-icon/icons'

const iconRegistry = useIconRegistry()

// Register an icon dynamically
if (iconRegistry) {
  iconRegistry.register('share-m', IconShareM)
  iconRegistry.registerAlias('share', 'share-m')
}
</script>
*/

export {}