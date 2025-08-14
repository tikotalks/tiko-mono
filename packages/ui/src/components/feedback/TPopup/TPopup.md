# TPopup

A versatile modal/popup system for displaying dynamic content overlays. Supports multiple positions, background overlays, and stacking of multiple popups. The popup system uses a service pattern to programmatically show Vue components as popups.

## Basic Usage

```vue
<template>
  <div>
    <!-- TPopup component should be included once in your app -->
    <TPopup />
    
    <!-- Trigger popup programmatically -->
    <button @click="showPopup">Open Popup</button>
  </div>
</template>

<script setup>
import { TPopup, popupService } from '@tiko/ui'
import MyComponent from './MyComponent.vue'

const showPopup = () => {
  popupService.open({
    component: MyComponent,
    title: 'My Popup',
    description: 'This is a popup example'
  })
}
</script>
```

## Popup Service API

The `popupService` provides methods to manage popups programmatically:

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `showPopup(options)` | `PopupOptions` | Shows a new popup and returns its ID |
| `closePopup(id?)` | `string` (optional) | Closes specific popup or last opened |
| `closeAllPopups(excludeId?)` | `string` (optional) | Closes all popups except specified |
| `open` | - | Alias for `showPopup` |
| `close` | - | Alias for `closePopup` |
| `closeAll` | - | Alias for `closeAllPopups` |

### Popup Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `component` | `Component` | required | Vue component to display |
| `props` | `object` | `{}` | Props to pass to component |
| `title` | `string` | `''` | Popup title |
| `description` | `string` | `''` | Popup description |
| `onClose` | `() => void` | `undefined` | Callback when popup closes |
| `id` | `string` | auto-generated | Custom popup ID |
| `closePopups` | `boolean` | `false` | Close other popups first |
| `slots` | `object` | `{}` | Slots to pass to component |
| `on` | `object` | `{}` | Event handlers for component |
| `config` | `object` | see below | Popup configuration |

### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `background` | `boolean` | `true` | Show background overlay |
| `position` | `string` | `'center'` | Position: 'center', 'top', 'bottom' |
| `canClose` | `boolean` | `true` | Allow closing popup |
| `width` | `string` | `'auto'` | Popup width CSS value |

## Examples

### Simple Component Popup

```vue
<!-- ConfirmDialog.vue -->
<template>
  <div class="confirm-dialog">
    <p>{{ message }}</p>
    <div class="actions">
      <button @click="$emit('close')">Cancel</button>
      <button @click="confirm">Confirm</button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  message: String,
  onConfirm: Function
})

const confirm = () => {
  props.onConfirm?.()
  emit('close')
}

const emit = defineEmits(['close'])
</script>
```

```vue
<!-- Using the popup -->
<script setup>
import { popupService } from '@tiko/ui'
import ConfirmDialog from './ConfirmDialog.vue'

const deleteItem = () => {
  popupService.open({
    component: ConfirmDialog,
    title: 'Confirm Delete',
    props: {
      message: 'Are you sure you want to delete this item?',
      onConfirm: () => {
        console.log('Item deleted')
      }
    }
  })
}
</script>
```

### Form Popup

```vue
<script setup>
import { popupService } from '@tiko/ui'
import UserForm from './UserForm.vue'

const editUser = (user) => {
  popupService.open({
    component: UserForm,
    title: 'Edit User',
    props: {
      user,
      onSave: (updatedUser) => {
        console.log('User updated:', updatedUser)
        popupService.close()
      }
    },
    config: {
      width: '500px'
    }
  })
}
</script>
```

### Different Positions

```vue
<script setup>
import { popupService } from '@tiko/ui'
import NotificationPanel from './NotificationPanel.vue'

const showTopPopup = () => {
  popupService.open({
    component: NotificationPanel,
    config: {
      position: 'top',
      background: false
    }
  })
}

const showBottomPopup = () => {
  popupService.open({
    component: NotificationPanel,
    config: {
      position: 'bottom'
    }
  })
}

const showCenterPopup = () => {
  popupService.open({
    component: NotificationPanel,
    config: {
      position: 'center'
    }
  })
}
</script>
```

### Without Background

```vue
<script setup>
import { popupService } from '@tiko/ui'
import Tooltip from './Tooltip.vue'

const showTooltip = () => {
  popupService.open({
    component: Tooltip,
    config: {
      background: false,
      canClose: false
    }
  })
}
</script>
```

### Stacked Popups

```vue
<script setup>
import { popupService } from '@tiko/ui'
import SettingsPanel from './SettingsPanel.vue'
import SubSettings from './SubSettings.vue'

const showSettings = () => {
  const settingsId = popupService.open({
    component: SettingsPanel,
    title: 'Settings',
    props: {
      onOpenSubSettings: () => {
        // Open another popup on top
        popupService.open({
          component: SubSettings,
          title: 'Advanced Settings'
        })
      }
    }
  })
}
</script>
```

### With Event Handlers

```vue
<script setup>
import { popupService } from '@tiko/ui'
import ImagePicker from './ImagePicker.vue'

const selectImage = () => {
  popupService.open({
    component: ImagePicker,
    title: 'Select an Image',
    on: {
      select: (image) => {
        console.log('Image selected:', image)
        popupService.close()
      },
      cancel: () => {
        console.log('Selection cancelled')
        popupService.close()
      }
    }
  })
}
</script>
```

### Custom Width and Styling

```vue
<script setup>
import { popupService } from '@tiko/ui'
import VideoPlayer from './VideoPlayer.vue'

const playVideo = (videoUrl) => {
  popupService.open({
    component: VideoPlayer,
    props: { videoUrl },
    config: {
      width: '80vw',
      background: true
    }
  })
}
</script>
```

### Replace Existing Popups

```vue
<script setup>
import { popupService } from '@tiko/ui'
import LoginForm from './LoginForm.vue'

const showLogin = () => {
  popupService.open({
    component: LoginForm,
    title: 'Login',
    closePopups: true, // Close all other popups first
    config: {
      canClose: false // Prevent closing without login
    }
  })
}
</script>
```

## Popup Component Structure

The popup wrapper provides:
- Header with title, description, and close button
- Main content area for your component
- Optional footer slot
- Background overlay (optional)
- Click-outside-to-close functionality

Your component receives:
- All props passed via `props` option
- `close` event emitter to close the popup
- Access to slots if provided

## Styling

The popup uses BEM classes for styling:

```css
.popup {
  /* Popup container */
  position: fixed;
  z-index: 1000;
}

.popup__background {
  /* Background overlay */
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.popup__wrapper {
  /* Content wrapper */
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup--center {
  /* Center position */
}

.popup--top {
  /* Top position */
}

.popup--bottom {
  /* Bottom position */
}
```

### Custom Popup Styling

```vue
<style>
/* Style specific popup */
.popup--stack-custom-id {
  .popup__container {
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  }
}
</style>
```

## Accessibility

- Focus management when popup opens/closes
- Escape key closes popup (when enabled)
- Background click closes popup (when enabled)
- Proper ARIA attributes for modal behavior
- Focus trap within popup content

## Best Practices

1. **Include once** - Add `<TPopup />` component once in your app root
2. **Clean up** - Always provide close functionality in your components
3. **Handle state** - Manage component state appropriately
4. **Size appropriately** - Set width for consistent layouts
5. **Consider mobile** - Test popup behavior on small screens
6. **Avoid deep nesting** - Limit popup stacking depth
7. **Loading states** - Handle async content appropriately

## Setup

Include the `<TPopup />` component once in your app's root:

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <!-- Your app content -->
    <RouterView />
    
    <!-- Popup container -->
    <TPopup />
  </div>
</template>

<script setup>
import { TPopup } from '@tiko/ui'
</script>
```

## TypeScript Types

```typescript
interface PopupOptions {
  component: Component
  props?: Record<string, any>
  title?: string
  description?: string
  onClose?: () => void
  config?: {
    background?: boolean
    position?: 'center' | 'bottom' | 'top'
    canClose?: boolean
    width?: string
  }
  id?: string
  closePopups?: boolean
  slots?: Record<string, () => VNode>
  on?: Record<string, (...args: any[]) => void>
}

interface PopupInstance {
  id: string
  component: Component
  props: Record<string, any>
  title?: string
  description?: string
  onClose?: () => void
  openedTime: number
  config: PopupConfig
}
```

## Related Components

- `TModal` - Traditional modal with built-in structure
- `TToast` - For temporary notifications
- `TTooltip` - For contextual information
- `TContextMenu` - For context-specific actions