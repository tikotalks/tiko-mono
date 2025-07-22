# Tree-Shakable Icon System

This directory contains the tree-shakable icon system for Tiko UI, based on the open-icon library.

## Overview

The new icon system allows you to import only the icons you need, reducing bundle size through tree-shaking. Icons can be registered at the app level or dynamically within components.

## Setup in Your App

```typescript
import { createApp } from 'vue'
import { IconRegistryPlugin } from '@tiko/ui'
import { 
  IconHomeM,
  IconSettingsM,
  IconAddM,
  // ... import only the icons you need
} from 'open-icon/icons'

const app = createApp(App)

app.use(IconRegistryPlugin, {
  icons: {
    'home-m': IconHomeM,
    'settings-m': IconSettingsM,
    'add-m': IconAddM,
  },
  aliases: {
    'home': 'home-m',
    'settings': 'settings-m',
    'plus': 'add-m',
  }
})
```

## Usage in Components

```vue
<template>
  <!-- Use registered icons (fast, no dynamic loading) -->
  <TIcon name="home" />
  <TIcon name="settings" />
  <TIcon name="plus" />
</template>
```

## Dynamic Registration

You can also register icons dynamically within components:

```vue
<script setup>
import { useIconRegistry } from '@tiko/ui'
import { IconShareM } from 'open-icon/icons'

const iconRegistry = useIconRegistry()

if (iconRegistry) {
  iconRegistry.register('share-m', IconShareM)
  iconRegistry.registerAlias('share', 'share-m')
}
</script>
```

## Benefits

1. **Smaller Bundle Size**: Only include icons you actually use
2. **Type Safety**: Full TypeScript support with icon types
3. **Performance**: No dynamic imports for registered icons
4. **Flexibility**: Mix registered and dynamically loaded icons
5. **Backward Compatibility**: Legacy icon names still work through aliases

## Migration Guide

1. Identify all icons used in your app
2. Import them from `open-icon/icons`
3. Register them with the IconRegistryPlugin
4. Set up aliases for convenience
5. The TIcon component will automatically use registered icons

## Fallback Behavior

If an icon is not found in the registry, TIcon will:
1. Check for legacy name mappings
2. Attempt to load it dynamically using `getIcon()`
3. Show a placeholder if the icon cannot be loaded