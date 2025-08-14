# TToast

A notification system that displays temporary messages to users. Toasts appear at configurable positions on the screen and automatically disappear after a set duration. They support different types, icons, and can be dismissible.

## Basic Usage

```vue
<template>
  <div>
    <!-- TToast component should be included once in your app -->
    <TToast />
    
    <!-- Trigger toasts programmatically -->
    <button @click="showToast">Show Toast</button>
  </div>
</template>

<script setup>
import { TToast, toastService } from '@tiko/ui'

const showToast = () => {
  toastService.show({
    message: 'Operation completed successfully!'
  })
}
</script>
```

## Toast Service API

The `toastService` provides methods to show and hide toasts programmatically:

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `show(options)` | `ToastOptions` | Shows a new toast and returns its ID |
| `hide(id)` | `string` | Hides a specific toast by ID |
| `hideAll()` | - | Hides all visible toasts |

### Toast Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `message` | `string` | required | The toast message |
| `title` | `string` | `''` | Optional title |
| `icon` | `Icons` | `null` | Icon to display |
| `duration` | `number` | `2000` | Duration in milliseconds (0 for persistent) |
| `position` | `ToastPosition` | `'top'` | Position on screen |
| `type` | `ToastType` | `'default'` | Toast type for styling |
| `dismissible` | `boolean` | `false` | Whether toast can be manually dismissed |
| `onClose` | `() => void` | `undefined` | Callback when toast closes |
| `id` | `string` | auto-generated | Custom toast ID |

## Toast Types

```vue
<template>
  <div class="toast-types">
    <button @click="showDefault">Default</button>
    <button @click="showSuccess">Success</button>
    <button @click="showError">Error</button>
    <button @click="showWarning">Warning</button>
    <button @click="showInfo">Info</button>
  </div>
</template>

<script setup>
import { toastService } from '@tiko/ui'

const showDefault = () => {
  toastService.show({
    message: 'Default toast message',
    type: 'default'
  })
}

const showSuccess = () => {
  toastService.show({
    message: 'Operation completed successfully!',
    type: 'success',
    icon: 'check'
  })
}

const showError = () => {
  toastService.show({
    message: 'An error occurred',
    type: 'error',
    icon: 'x',
    duration: 5000
  })
}

const showWarning = () => {
  toastService.show({
    message: 'Please review your input',
    type: 'warning',
    icon: 'exclamation-mark'
  })
}

const showInfo = () => {
  toastService.show({
    message: 'New update available',
    type: 'info',
    icon: 'info'
  })
}
</script>
```

## Toast Positions

```vue
<template>
  <div class="toast-positions">
    <button @click="show('top')">Top</button>
    <button @click="show('bottom')">Bottom</button>
    <button @click="show('top-left')">Top Left</button>
    <button @click="show('top-right')">Top Right</button>
    <button @click="show('bottom-left')">Bottom Left</button>
    <button @click="show('bottom-right')">Bottom Right</button>
  </div>
</template>

<script setup>
import { toastService } from '@tiko/ui'

const show = (position) => {
  toastService.show({
    message: `Toast at ${position}`,
    position,
    duration: 3000
  })
}
</script>
```

## Advanced Examples

### Toast with Title and Icon

```vue
<script setup>
import { toastService } from '@tiko/ui'

const showAdvanced = () => {
  toastService.show({
    title: 'File Uploaded',
    message: 'document.pdf has been uploaded successfully',
    type: 'success',
    icon: 'check-circled',
    duration: 4000,
    position: 'top-right'
  })
}
</script>
```

### Dismissible Toast

```vue
<script setup>
import { toastService } from '@tiko/ui'

const showDismissible = () => {
  toastService.show({
    message: 'This toast can be dismissed',
    dismissible: true,
    duration: 0 // Persistent until dismissed
  })
}
</script>
```

### Toast with Callback

```vue
<script setup>
import { toastService } from '@tiko/ui'

const showWithCallback = () => {
  toastService.show({
    message: 'Processing...',
    type: 'info',
    duration: 3000,
    onClose: () => {
      console.log('Toast closed')
      // Perform action after toast closes
    }
  })
}
</script>
```

### Form Submission Example

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <!-- Form fields -->
    <button type="submit">Save</button>
  </form>
</template>

<script setup>
import { toastService } from '@tiko/ui'

const handleSubmit = async () => {
  try {
    await saveData()
    toastService.show({
      message: 'Changes saved successfully',
      type: 'success',
      icon: 'check',
      position: 'bottom-right'
    })
  } catch (error) {
    toastService.show({
      title: 'Save Failed',
      message: error.message,
      type: 'error',
      icon: 'x',
      duration: 5000,
      dismissible: true
    })
  }
}
</script>
```

### Sequential Toasts

```vue
<script setup>
import { toastService } from '@tiko/ui'

const showSequence = async () => {
  toastService.show({
    message: 'Step 1: Initializing...',
    type: 'info',
    duration: 2000
  })
  
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  toastService.show({
    message: 'Step 2: Processing...',
    type: 'info',
    duration: 2000
  })
  
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  toastService.show({
    message: 'Complete!',
    type: 'success',
    icon: 'check',
    duration: 3000
  })
}
</script>
```

### Managing Multiple Toasts

```vue
<script setup>
import { ref } from 'vue'
import { toastService } from '@tiko/ui'

const toastIds = ref([])

const showMultiple = () => {
  for (let i = 1; i <= 3; i++) {
    const id = toastService.show({
      message: `Toast ${i}`,
      duration: 0,
      dismissible: true,
      position: 'top-right'
    })
    toastIds.value.push(id)
  }
}

const hideAll = () => {
  toastService.hideAll()
  toastIds.value = []
}

const hideLast = () => {
  const id = toastIds.value.pop()
  if (id) {
    toastService.hide(id)
  }
}
</script>
```

## Styling

The toast component uses CSS custom properties based on the toast type:

```css
.toast {
  /* Dynamic color based on type */
  --toast-color: var(--primary);
  --toast-border-color: color-mix(in srgb, var(--toast-color), var(--color-background) 50%);
  --toast-background-color: color-mix(in srgb, var(--toast-color), var(--color-background) 90%);
  --toast-text-color: color-mix(in srgb, var(--toast-color), var(--color-foreground) 50%);
}
```

### Custom Toast Styling

```vue
<style>
/* Custom toast appearance */
.toast--custom {
  --toast-color: #8b5cf6;
  border-width: 2px;
  font-weight: bold;
}
</style>
```

## Animation

Toasts use CSS animations for smooth entrance:
- Fade in from initial position
- Slide to final position
- Fade out when closing

## Accessibility

- Uses appropriate ARIA roles (`alert` for errors, `status` for others)
- `aria-live` regions announce toast content to screen readers
- Dismissible toasts include accessible close buttons
- Semantic HTML structure

## Best Practices

1. **Keep messages concise** - Toast messages should be brief and actionable
2. **Use appropriate types** - Match toast type to the message importance
3. **Consider duration** - Longer messages need more time to read
4. **Position consistently** - Use the same position for similar notifications
5. **Avoid overuse** - Too many toasts can overwhelm users
6. **Provide context** - Include enough information to be helpful
7. **Make errors dismissible** - Let users dismiss error messages
8. **Test accessibility** - Ensure screen readers announce toasts properly

## Setup

Include the `<TToast />` component once in your app's root component:

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <!-- Your app content -->
    <RouterView />
    
    <!-- Toast container -->
    <TToast />
  </div>
</template>

<script setup>
import { TToast } from '@tiko/ui'
</script>
```

## TypeScript Types

```typescript
// Available positions
type ToastPosition = 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

// Toast types
type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info'

// Toast options interface
interface ToastOptions {
  message: string
  title?: string
  icon?: string
  duration?: number
  position?: ToastPosition
  type?: ToastType
  dismissible?: boolean
  onClose?: () => void
  id?: string
}
```

## Related Components

- `TAlert` - For persistent, in-page notifications
- `TModal` - For notifications requiring user action
- `TBanner` - For page-wide announcements