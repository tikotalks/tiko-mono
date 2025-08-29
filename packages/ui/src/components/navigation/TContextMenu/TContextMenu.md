# TContextMenu

A versatile dropdown menu component that provides contextual actions and navigation. It supports multiple positioning options, nested menus, different item types, and various interaction modes.

## Basic Usage

```vue
<template>
  <TContextMenu :config="menuConfig">
    <TButton>Open Menu</TButton>
  </TContextMenu>
</template>

<script setup>
import { TContextMenu, TButton } from '@tiko/ui'

const menuConfig = {
  menu: [
    { id: 'edit', label: 'Edit', icon: 'edit' },
    { id: 'delete', label: 'Delete', icon: 'trash' },
  ]
}
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `ContextMenuConfig` | `{}` | Menu configuration object |

## Configuration

The `config` prop accepts a configuration object with these options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `menu` | `ContextMenuItem[]` | `[]` | Array of menu items |
| `position` | `ContextMenuPosition` | `'bottom-left'` | Menu position relative to trigger |
| `size` | `Size` | `'default'` | Menu size |
| `clickMode` | `'short' \| 'long'` | `'short'` | Click behavior |
| `closeOnItemClick` | `boolean` | `true` | Close menu when item clicked |
| `closeOnOutsideClick` | `boolean` | `true` | Close when clicking outside |

## Menu Item Structure

Each menu item can have these properties:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier |
| `label` | `string` | No | Display text |
| `icon` | `string` | No | Icon name |
| `type` | `string` | No | Item type: 'default', 'separator', 'header', 'icon-tile', 'row' |
| `action` | `Function` | No | Click handler |
| `link` | `string` | No | Navigation URL |
| `disabled` | `boolean` | No | Disable the item |
| `active` | `boolean` | No | Active state |
| `items` | `ContextMenuItem[]` | No | Nested submenu items |
| `size` | `Size` | No | Item size override |

## Examples

### Simple Menu

```vue
<template>
  <TContextMenu :config="simpleMenu">
    <TButton icon="more-vertical">Actions</TButton>
  </TContextMenu>
</template>

<script setup>
import { TContextMenu, TButton } from '@tiko/ui'

const simpleMenu = {
  menu: [
    {
      id: 'view',
      label: 'View',
      icon: 'eye',
      action: () => console.log('View clicked')
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: 'edit',
      action: () => console.log('Edit clicked')
    },
    {
      id: 'separator1',
      type: 'separator'
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'trash',
      action: () => console.log('Delete clicked')
    }
  ]
}
</script>
```

### With Nested Menus

```vue
<template>
  <TContextMenu :config="nestedMenu">
    <TButton>File Menu</TButton>
  </TContextMenu>
</template>

<script setup>
import { TContextMenu, TButton } from '@tiko/ui'

const nestedMenu = {
  menu: [
    {
      id: 'file',
      label: 'File',
      icon: 'file',
      items: [
        { id: 'new', label: 'New', icon: 'plus' },
        { id: 'open', label: 'Open', icon: 'folder-open' },
        { id: 'save', label: 'Save', icon: 'save' },
      ]
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: 'edit',
      items: [
        { id: 'cut', label: 'Cut', icon: 'scissors' },
        { id: 'copy', label: 'Copy', icon: 'copy' },
        { id: 'paste', label: 'Paste', icon: 'clipboard' },
      ]
    }
  ]
}
</script>
```

### Different Positions

```vue
<template>
  <div class="position-examples">
    <TContextMenu :config="{ ...baseMenu, position: 'top-left' }">
      <TButton>Top Left</TButton>
    </TContextMenu>

    <TContextMenu :config="{ ...baseMenu, position: 'top-right' }">
      <TButton>Top Right</TButton>
    </TContextMenu>

    <TContextMenu :config="{ ...baseMenu, position: 'bottom-left' }">
      <TButton>Bottom Left</TButton>
    </TContextMenu>

    <TContextMenu :config="{ ...baseMenu, position: 'bottom-right' }">
      <TButton>Bottom Right</TButton>
    </TContextMenu>
  </div>
</template>

<script setup>
import { TContextMenu, TButton } from '@tiko/ui'

const baseMenu = {
  menu: [
    { id: 'item1', label: 'Option 1' },
    { id: 'item2', label: 'Option 2' },
    { id: 'item3', label: 'Option 3' }
  ]
}
</script>
```

### Item Types

```vue
<template>
  <TContextMenu :config="typesMenu">
    <TButton>Menu Types</TButton>
  </TContextMenu>
</template>

<script setup>
import { TContextMenu, TButton } from '@tiko/ui'

const typesMenu = {
  menu: [
    {
      id: 'header1',
      type: 'header',
      label: 'Actions'
    },
    {
      id: 'default1',
      type: 'default',
      label: 'Default Item',
      icon: 'star'
    },
    {
      id: 'row1',
      type: 'row',
      label: 'Row Layout',
      icon: 'grid'
    },
    {
      id: 'separator1',
      type: 'separator'
    },
    {
      id: 'header2',
      type: 'header',
      label: 'Icon Tiles'
    },
    {
      id: 'tile1',
      type: 'icon-tile',
      label: 'Home',
      icon: 'home'
    },
    {
      id: 'tile2',
      type: 'icon-tile',
      label: 'Settings',
      icon: 'settings'
    }
  ]
}
</script>
```

### With Router Links

```vue
<template>
  <TContextMenu :config="navigationMenu">
    <TButton icon="menu">Navigation</TButton>
  </TContextMenu>
</template>

<script setup>
import { TContextMenu, TButton } from '@tiko/ui'
import { useRouter } from 'vue-router'

const router = useRouter()

const navigationMenu = {
  menu: [
    {
      id: 'home',
      label: 'Home',
      icon: 'home',
      action: () => router.push('/')
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: 'user',
      action: () => router.push('/profile')
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      action: () => router.push('/settings')
    },
    {
      id: 'separator',
      type: 'separator'
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: 'log-out',
      action: () => handleLogout()
    }
  ]
}
</script>
```

### Dynamic Menu Items

```vue
<template>
  <TContextMenu :config="dynamicMenu" ref="menuRef">
    <TButton>{{ selectedOption || 'Select Option' }}</TButton>
  </TContextMenu>
</template>

<script setup>
import { ref, computed } from 'vue'
import { TContextMenu, TButton } from '@tiko/ui'

const selectedOption = ref('')
const menuRef = ref()

const options = ref([
  { id: '1', name: 'Option A', available: true },
  { id: '2', name: 'Option B', available: false },
  { id: '3', name: 'Option C', available: true }
])

const dynamicMenu = computed(() => ({
  menu: options.value.map(opt => ({
    id: opt.id,
    label: opt.name,
    disabled: !opt.available,
    active: selectedOption.value === opt.name,
    action: () => {
      selectedOption.value = opt.name
      menuRef.value?.close()
    }
  }))
}))
</script>
```

### Right-Click Context Menu

```vue
<template>
  <div
    class="context-area"
    @contextmenu.prevent="showContextMenu"
  >
    Right-click anywhere in this area

    <TContextMenu
      ref="contextMenuRef"
      :config="rightClickMenu"
    >
      <div ref="triggerRef" style="display: none"></div>
    </TContextMenu>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TContextMenu } from '@tiko/ui'

const contextMenuRef = ref()
const triggerRef = ref()

const rightClickMenu = {
  menu: [
    { id: 'cut', label: 'Cut', icon: 'scissors' },
    { id: 'copy', label: 'Copy', icon: 'copy' },
    { id: 'paste', label: 'Paste', icon: 'clipboard' },
    { type: 'separator' },
    { id: 'delete', label: 'Delete', icon: 'trash' }
  ]
}

const showContextMenu = (event) => {
  // Position the hidden trigger at mouse location
  if (triggerRef.value) {
    triggerRef.value.style.position = 'fixed'
    triggerRef.value.style.left = `${event.clientX}px`
    triggerRef.value.style.top = `${event.clientY}px`
  }

  contextMenuRef.value?.open()
}
</script>

<style>
.context-area {
  padding: var(--space-xl);
  background: var(--color-accent);
  border: 2px dashed var(--color-accent);
  border-radius: var(--border-radius);
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}
</style>
```

### User Menu Example

```vue
<template>
  <TContextMenu :config="userMenu">
    <div class="user-avatar">
      <img :src="user.avatar" :alt="user.name" />
      <span>{{ user.name }}</span>
    </div>
  </TContextMenu>
</template>

<script setup>
import { TContextMenu } from '@tiko/ui'
import { useAuth } from '@/composables'

const { user, logout } = useAuth()

const userMenu = {
  position: 'bottom-right',
  menu: [
    {
      id: 'profile',
      label: 'View Profile',
      icon: 'user',
      action: () => router.push('/profile')
    },
    {
      id: 'settings',
      label: 'Account Settings',
      icon: 'settings',
      action: () => router.push('/settings')
    },
    {
      type: 'separator'
    },
    {
      id: 'theme',
      label: 'Theme',
      icon: 'palette',
      items: [
        { id: 'light', label: 'Light' },
        { id: 'dark', label: 'Dark' },
        { id: 'auto', label: 'System' }
      ]
    },
    {
      type: 'separator'
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: 'log-out',
      action: logout
    }
  ]
}
</script>
```

## Exposed Methods

The component exposes these methods via template ref:

```javascript
// Get reference to the menu
const menuRef = ref()

// Open the menu
menuRef.value.open()

// Close the menu
menuRef.value.close()

// Toggle the menu
menuRef.value.toggle()
```

## Styling

The component uses BEM classes for styling:

```css
.context-menu {
  /* Menu container styles */
}

.context-panel__content {
  /* Dropdown content */
  background: var(--color-background);
  border: 1px solid var(--color-accent);
  border-radius: var(--border-radius);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.context-menu-item {
  /* Individual menu items */
  padding: var(--space-s) var(--space);
  cursor: pointer;
}

.context-menu-item:hover {
  background: var(--color-accent);
}
```

## Accessibility

- Keyboard navigation with arrow keys
- Enter/Space to select items
- Escape to close menu
- ARIA attributes for screen readers
- Focus management
- Proper role attributes

## Best Practices

1. **Keep menus concise** - Limit items to avoid overwhelming users
2. **Use clear labels** - Make actions obvious
3. **Group related items** - Use separators and headers
4. **Provide icons** - Visual cues help recognition
5. **Handle errors** - Gracefully handle action failures
6. **Consider mobile** - Ensure touch-friendly on small screens
7. **Keyboard support** - Always test keyboard navigation

## Related Components

- `ContextPanel` - Base panel component
- `ContextMenuItems` - Menu items renderer
- `TButton` - Common trigger element
- `TDropdown` - Alternative dropdown component
