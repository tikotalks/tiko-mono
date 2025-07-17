# TIcon

A dynamic icon component that loads SVG icons from the open-icon library. It provides consistent icon rendering with support for animations and custom styling.

## Basic Usage

```vue
<template>
  <TIcon name="home" />
</template>

<script setup>
import { TIcon } from '@tiko/ui'
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `Icons` | `''` | Icon name from the open-icon library |
| `animation` | `boolean` | `false` | Whether to apply animation class |

## Icon Name Mappings

The component includes built-in mappings for commonly used icons:

| Used Name | Actual Icon |
|-----------|-------------|
| `edit` | `edit-m` |
| `plus` | `add-m` |
| `check` | `check-m` |
| `x` | `multiply-m` |
| `play` | `playback-play` |
| `pause` | `playback-pause` |

## Examples

### Basic Icons

```vue
<template>
  <div class="icons">
    <TIcon name="home" />
    <TIcon name="user" />
    <TIcon name="settings" />
    <TIcon name="search" />
  </div>
</template>

<script setup>
import { TIcon } from '@tiko/ui'
</script>
```

### With Animation

```vue
<template>
  <div class="animated-icons">
    <TIcon name="spinner" :animation="true" />
    <TIcon name="refresh" :animation="isLoading" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TIcon } from '@tiko/ui'

const isLoading = ref(true)
</script>
```

### Different Sizes

```vue
<template>
  <div class="icon-sizes">
    <TIcon name="star" class="small-icon" />
    <TIcon name="star" class="medium-icon" />
    <TIcon name="star" class="large-icon" />
  </div>
</template>

<script setup>
import { TIcon } from '@tiko/ui'
</script>

<style>
.small-icon {
  font-size: 0.75rem;
}

.medium-icon {
  font-size: 1.5rem;
}

.large-icon {
  font-size: 3rem;
}
</style>
```

### Different Colors

```vue
<template>
  <div class="icon-colors">
    <TIcon name="heart" class="primary" />
    <TIcon name="heart" class="success" />
    <TIcon name="heart" class="error" />
    <TIcon name="heart" class="warning" />
  </div>
</template>

<script setup>
import { TIcon } from '@tiko/ui'
</script>

<style>
.primary {
  color: var(--color-primary);
}

.success {
  color: var(--color-success);
}

.error {
  color: var(--color-error);
}

.warning {
  color: var(--color-warning);
}
</style>
```

### In Buttons

```vue
<template>
  <div class="icon-buttons">
    <button class="icon-button">
      <TIcon name="edit" />
      Edit
    </button>
    
    <button class="icon-button">
      <TIcon name="trash" />
      Delete
    </button>
  </div>
</template>

<script setup>
import { TIcon } from '@tiko/ui'
</script>

<style>
.icon-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
```

### Loading States

```vue
<template>
  <div class="loading-example">
    <button @click="save" :disabled="saving">
      <TIcon :name="saving ? 'spinner' : 'save'" :animation="saving" />
      {{ saving ? 'Saving...' : 'Save' }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TIcon } from '@tiko/ui'

const saving = ref(false)

const save = async () => {
  saving.value = true
  await new Promise(resolve => setTimeout(resolve, 2000))
  saving.value = false
}
</script>
```

## Styling

The icon component uses the following CSS approach:

```css
.icon {
  width: 1em;
  height: 1em;
  display: block;
  
  /* Icons inherit color from parent */
  color: inherit;
}
```

### CSS Custom Properties

```css
.icon {
  /* For icons with infill/knockout areas */
  --icon-infill: var(--color-background);
}
```

### Custom Icon Styling

```vue
<template>
  <TIcon name="star" class="custom-icon" />
</template>

<style>
.custom-icon {
  font-size: 2rem;
  color: gold;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  transition: transform 0.2s;
}

.custom-icon:hover {
  transform: scale(1.2);
}
</style>
```

### Animation Classes

When `animation` prop is true, the component adds an `icon--animated` class:

```css
.icon--animated {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

## How It Works

1. The component accepts an icon name prop
2. It maps common names to their open-icon equivalents
3. Asynchronously loads the SVG icon data using `getIcon()`
4. Renders the SVG inline using `v-html`
5. The SVG inherits color from the parent element

## Performance Considerations

- Icons are loaded asynchronously on demand
- Icons are cached by the open-icon library
- Using many different icons may increase bundle size
- Consider using a subset of icons in production

## Accessibility

- Icons are decorative by default and don't include ARIA labels
- When used for actions, wrap in a button with proper labels
- For meaningful icons, add screen reader text:

```vue
<template>
  <button aria-label="Delete item">
    <TIcon name="trash" />
    <span class="sr-only">Delete</span>
  </button>
</template>
```

## Available Icons

The component uses the open-icon library. Some commonly used icons include:

- Navigation: `home`, `arrow-left`, `arrow-right`, `menu`, `chevron-down`
- Actions: `edit`, `trash`, `save`, `download`, `upload`, `share`
- Status: `check`, `x`, `info`, `warning`, `error`
- Media: `play`, `pause`, `stop`, `skip-forward`, `skip-backward`
- Social: `twitter`, `facebook`, `instagram`, `github`
- UI: `search`, `filter`, `settings`, `user`, `bell`, `heart`

## Best Practices

1. **Use semantic icon names** - Choose icons that clearly represent their function
2. **Provide text labels** - Don't rely on icons alone for important actions
3. **Maintain consistent sizing** - Use relative units (em) for scalable icons
4. **Add hover states** - Provide visual feedback for interactive icons
5. **Consider loading states** - Use animated spinner for loading indicators
6. **Test icon visibility** - Ensure sufficient contrast with backgrounds

## Related Components

- `TButton` - Often includes icons
- `TAlert` - Uses icons for status indicators
- `TToast` - Includes status icons