# Tiko Config System

Each Tiko app can have a `tiko.config.ts` file in its root directory to define app-specific settings.

## Structure

```typescript
import { defineConfig } from '@tiko/ui/types/tiko-config'

export default defineConfig({
  name: 'App Name',
  icon: 'icon-name',
  description: 'App description',
  theme: {
    primary: 'purple',    // Maps to var(--color-purple)
    secondary: 'green',   // Maps to var(--color-green)
    tertiary: 'red'       // Maps to var(--color-red)
  },
  features: {
    parentMode: true
  },
  settings: {
    // App-specific settings
  }
})
```

## Usage in App.vue

```vue
<template>
  <div id="app" :style="themeStyles">
    <!-- Your app content -->
  </div>
</template>

<script setup lang="ts">
import { useTikoConfig } from '@tiko/ui';
import tikoConfig from '../tiko.config';

// Set config and get theme styles
const { themeStyles } = useTikoConfig(tikoConfig);
</script>
```

## Theme Colors

The theme colors automatically map to CSS custom properties:
- `primary` → `--color-primary` and `--color-primary-text`
- `secondary` → `--color-secondary` and `--color-secondary-text`
- `tertiary` → `--color-tertiary` and `--color-tertiary-text`

Available base colors: purple, blue, green, lime, yellow, orange, pink, red, brown, black, gray, white, turquoise, cyan, indigo, violet, magenta, rose, coral, gold, silver, bronze