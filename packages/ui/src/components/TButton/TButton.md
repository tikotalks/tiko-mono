# TButton

A versatile button component that supports multiple variants, sizes, colors, and states. It can render as a button or anchor element and includes support for icons, loading states, and tooltips.

## Basic Usage

```vue
<template>
  <TButton @click="handleClick">Click me</TButton>
</template>

<script setup>
import { TButton } from '@tiko/ui'

const handleClick = () => {
  console.log('Button clicked!')
}
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `string` | `''` | Icon name to display |
| `hoverIcon` | `string` | `''` | Icon to show on hover |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size variant |
| `type` | `'default' \| 'ghost' \| 'outline' \| 'icon-only' \| 'fancy'` | `'default'` | Button style variant |
| `color` | `ButtonColor` | `'primary'` | Button color using semantic colors |
| `count` | `number` | `undefined` | Badge count to display |
| `disabled` | `boolean` | `false` | Whether button is disabled |
| `to` | `string` | `undefined` | Internal link URL (renders as anchor) |
| `href` | `string` | `undefined` | External link URL |
| `element` | `string` | `'button'` | HTML element to render |
| `tooltip` | `string` | `undefined` | Tooltip text |
| `shadow` | `boolean` | `false` | Whether to show shadow |
| `htmlButtonType` | `'auto' \| 'submit' \| 'reset' \| 'button'` | `'auto'` | HTML button type |
| `hideLabel` | `'mobile' \| 'desktop' \| 'all' \| 'none'` | `'none'` | Label visibility on different screen sizes |
| `status` | `'idle' \| 'loading' \| 'success' \| 'error'` | `'idle'` | Button status state |
| `reverse` | `boolean` | `false` | Reverse icon and text order |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `click` | `MouseEvent` | Emitted when button is clicked |

## Slots

| Slot | Description |
|------|-------------|
| `default` | Button label content |

## Examples

### Button Types

```vue
<template>
  <div class="button-types">
    <TButton type="default">Default</TButton>
    <TButton type="ghost">Ghost</TButton>
    <TButton type="outline">Outline</TButton>
    <TButton type="fancy">Fancy</TButton>
    <TButton type="icon-only" icon="settings" />
  </div>
</template>

<script setup>
import { TButton } from '@tiko/ui'
</script>
```

### Button Sizes

```vue
<template>
  <div class="button-sizes">
    <TButton size="small">Small</TButton>
    <TButton size="medium">Medium</TButton>
    <TButton size="large">Large</TButton>
  </div>
</template>

<script setup>
import { TButton } from '@tiko/ui'
</script>
```

### Button Colors

```vue
<template>
  <div class="button-colors">
    <TButton color="primary">Primary</TButton>
    <TButton color="secondary">Secondary</TButton>
    <TButton color="success">Success</TButton>
    <TButton color="warning">Warning</TButton>
    <TButton color="error">Error</TButton>
  </div>
</template>

<script setup>
import { TButton } from '@tiko/ui'
</script>
```

### With Icons

```vue
<template>
  <div class="button-icons">
    <TButton icon="arrow-left">Back</TButton>
    <TButton icon="arrow-right" reverse>Next</TButton>
    <TButton icon="download" hover-icon="check">Download</TButton>
    <TButton type="icon-only" icon="heart" />
  </div>
</template>

<script setup>
import { TButton } from '@tiko/ui'
</script>
```

### Loading States

```vue
<template>
  <div class="button-states">
    <TButton 
      :status="buttonStatus"
      @click="handleAsync"
    >
      Save Changes
    </TButton>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TButton } from '@tiko/ui'

const buttonStatus = ref('idle')

const handleAsync = async () => {
  buttonStatus.value = 'loading'
  
  try {
    await someAsyncOperation()
    buttonStatus.value = 'success'
    setTimeout(() => {
      buttonStatus.value = 'idle'
    }, 2000)
  } catch (error) {
    buttonStatus.value = 'error'
    setTimeout(() => {
      buttonStatus.value = 'idle'
    }, 2000)
  }
}
</script>
```

### As Links

```vue
<template>
  <div class="button-links">
    <!-- Internal link (Vue Router) -->
    <TButton to="/about">About Page</TButton>
    
    <!-- External link -->
    <TButton href="https://example.com" target="_blank">
      External Link
    </TButton>
  </div>
</template>

<script setup>
import { TButton } from '@tiko/ui'
</script>
```

### With Badge Count

```vue
<template>
  <div class="button-badges">
    <TButton icon="bell" :count="5">Notifications</TButton>
    <TButton icon="email" :count="12" type="outline">Messages</TButton>
    <TButton icon="cart" :count="3" type="icon-only" />
  </div>
</template>

<script setup>
import { TButton } from '@tiko/ui'
</script>
```

### Disabled State

```vue
<template>
  <div class="button-disabled">
    <TButton disabled>Disabled Default</TButton>
    <TButton disabled type="outline">Disabled Outline</TButton>
    <TButton disabled icon="lock">Disabled with Icon</TButton>
  </div>
</template>

<script setup>
import { TButton } from '@tiko/ui'
</script>
```

### Responsive Label Hiding

```vue
<template>
  <div class="button-responsive">
    <TButton icon="menu" hide-label="mobile">
      Menu
    </TButton>
    <TButton icon="search" hide-label="desktop">
      Search
    </TButton>
  </div>
</template>

<script setup>
import { TButton } from '@tiko/ui'
</script>
```

### Form Buttons

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <TButton html-button-type="submit" color="primary">
      Submit Form
    </TButton>
    <TButton html-button-type="reset" type="ghost">
      Reset
    </TButton>
  </form>
</template>

<script setup>
import { TButton } from '@tiko/ui'

const handleSubmit = () => {
  console.log('Form submitted')
}
</script>
```

## Styling

The button component uses CSS custom properties for theming:

```css
.button {
  /* Size variants affect these */
  --button-padding: var(--space-s) var(--space);
  --button-font-size: 1rem;
  --button-icon-size: 1.25em;
  
  /* Color variants use semantic colors */
  --button-background: var(--color-primary);
  --button-color: var(--color-primary-text);
  --button-border: var(--color-primary);
}
```

### Custom Styling

```vue
<template>
  <TButton class="custom-button">Custom Styled</TButton>
</template>

<style>
.custom-button {
  --button-background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  --button-color: white;
  border-radius: 2rem;
}
</style>
```

## Accessibility

- Proper `button` or `a` element usage based on functionality
- Disabled state prevents interaction
- Focus indicators for keyboard navigation
- ARIA attributes preserved through `v-bind="$attrs"`
- Tooltip support for additional context
- Proper button type for form submission

## Best Practices

1. **Use semantic colors** - Use `primary`, `secondary`, etc. instead of specific colors
2. **Choose appropriate type** - Use `ghost` for less prominent actions, `outline` for secondary actions
3. **Include icons meaningfully** - Icons should enhance, not replace, text labels
4. **Handle loading states** - Show loading status for async operations
5. **Use correct element** - Use `to` prop for internal navigation, `href` for external links
6. **Consider mobile** - Use `hideLabel` prop for responsive designs
7. **Group related buttons** - Use `TButtonGroup` for related actions

## Related Components

- `TButtonGroup` - Container for grouping related buttons
- `TIcon` - Icon component used within buttons
- `TTooltip` - For more complex tooltip needs