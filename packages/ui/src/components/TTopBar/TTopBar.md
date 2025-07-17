# TTopBar

A comprehensive header component that provides navigation, user information, and actions for Tiko applications. It features parent mode integration, user avatar with dropdown menu, customizable actions, and responsive design.

## Basic Usage

```vue
<template>
  <TTopBar 
    title="My App"
    subtitle="Welcome back!"
    @profile="navigateToProfile"
    @logout="handleLogout"
  />
</template>

<script setup>
import { TTopBar } from '@tiko/ui'

const navigateToProfile = () => {
  router.push('/profile')
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `undefined` | Main title displayed in the top bar |
| `subtitle` | `string` | `undefined` | Subtitle text below the title |
| `showBackButton` | `boolean` | `false` | Show/hide the back button |
| `backButtonLabel` | `string` | `'Go back'` | ARIA label for back button |
| `showUserInfo` | `boolean` | `true` | Show user name and role in dropdown |
| `showOnlineStatus` | `boolean` | `false` | Show online/offline indicator |
| `isUserOnline` | `boolean` | `true` | Current online status |
| `isLoading` | `boolean` | `false` | Show loading overlay |
| `customMenuItems` | `ContextMenuItem[]` | `undefined` | Additional user menu items |
| `appName` | `string` | `undefined` | App name for parent mode context |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `back` | - | Back button clicked |
| `profile` | - | Profile menu item clicked |
| `logout` | - | Logout menu item clicked |
| `settings` | - | Settings menu item clicked |
| `menu-item-click` | `ContextMenuItem` | Custom menu item clicked |

## Slots

| Slot | Description |
|------|-------------|
| `center` | Content for the center section |
| `actions` | Action buttons (right side) |

## Features

### User Avatar System
- Displays user profile image or colored initials
- Consistent color generation based on email
- Fallback to initials when image fails
- Online/offline status indicator
- Dropdown menu on click

### Parent Mode Integration
- Visual indicator when parent mode is active
- Click avatar to enable/unlock parent mode
- PIN protection for parental controls
- App-specific permissions

### Responsive Design
- Mobile-optimized layout
- Hides user info on small screens
- Adaptive spacing and sizing
- Touch-friendly interactions

## Examples

### With Navigation

```vue
<template>
  <TTopBar
    title="User Details"
    show-back-button
    @back="router.back()"
  />
</template>

<script setup>
import { TTopBar } from '@tiko/ui'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>
```

### With Custom Actions

```vue
<template>
  <TTopBar title="Dashboard">
    <template #actions>
      <TButton 
        icon="search" 
        type="ghost"
        @click="openSearch" 
      />
      <TButton 
        icon="bell" 
        :badge="notificationCount"
        type="ghost"
        @click="showNotifications" 
      />
    </template>
  </TTopBar>
</template>

<script setup>
import { TTopBar, TButton } from '@tiko/ui'
import { ref } from 'vue'

const notificationCount = ref(3)

const openSearch = () => {
  // Open search modal
}

const showNotifications = () => {
  // Show notifications panel
}
</script>
```

### With Center Content

```vue
<template>
  <TTopBar title="Timer">
    <template #center>
      <TChip type="success">
        Active: 2:34
      </TChip>
    </template>
  </TTopBar>
</template>
```

### With Online Status

```vue
<template>
  <TTopBar
    title="Chat"
    show-online-status
    :is-user-online="isOnline"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { TTopBar } from '@tiko/ui'

const isOnline = ref(navigator.onLine)

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>
```

### With Custom Menu Items

```vue
<template>
  <TTopBar
    title="Admin Panel"
    :custom-menu-items="customItems"
    @menu-item-click="handleMenuItem"
  />
</template>

<script setup>
import { TTopBar } from '@tiko/ui'

const customItems = [
  {
    id: 'admin',
    label: 'Admin Dashboard',
    icon: 'shield',
    action: () => router.push('/admin')
  },
  {
    id: 'separator',
    type: 'separator'
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: 'help',
    action: () => window.open('/help', '_blank')
  }
]

const handleMenuItem = (item) => {
  console.log('Custom menu item clicked:', item)
}
</script>
```

### With Loading State

```vue
<template>
  <TTopBar
    :title="pageTitle"
    :is-loading="isLoading"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { TTopBar } from '@tiko/ui'

const pageTitle = ref('Loading...')
const isLoading = ref(true)

onMounted(async () => {
  const data = await fetchPageData()
  pageTitle.value = data.title
  isLoading.value = false
})
</script>
```

### Full Featured Example

```vue
<template>
  <TTopBar
    :title="currentPage.title"
    :subtitle="currentPage.subtitle"
    :show-back-button="canGoBack"
    show-online-status
    :is-user-online="isOnline"
    :is-loading="isLoading"
    :custom-menu-items="adminMenuItems"
    app-name="timer"
    @back="handleBack"
    @profile="openProfile"
    @settings="openSettings"
    @logout="confirmLogout"
    @menu-item-click="handleMenuItem"
  >
    <template #center>
      <TBadge 
        v-if="hasUpdates"
        type="info"
      >
        Updates Available
      </TBadge>
    </template>

    <template #actions>
      <TButton
        v-if="isDarkMode"
        icon="moon"
        type="ghost"
        @click="toggleTheme"
      />
      <TButton
        v-else
        icon="sun"
        type="ghost"
        @click="toggleTheme"
      />
      
      <TButton
        icon="bell"
        type="ghost"
        :badge="unreadCount"
        @click="openNotifications"
      />
    </template>
  </TTopBar>
</template>

<script setup>
import { computed } from 'vue'
import { TTopBar, TButton, TBadge } from '@tiko/ui'
import { useRouter, useRoute } from 'vue-router'
import { useAuth, useTheme, useNotifications } from '@/composables'

const router = useRouter()
const route = useRoute()
const { user, logout, isAdmin } = useAuth()
const { isDarkMode, toggleTheme } = useTheme()
const { unreadCount, openNotifications, hasUpdates } = useNotifications()

const currentPage = computed(() => ({
  title: route.meta.title || 'Tiko App',
  subtitle: route.meta.subtitle
}))

const canGoBack = computed(() => window.history.length > 1)
const isOnline = computed(() => navigator.onLine)
const isLoading = computed(() => route.meta.loading)

const adminMenuItems = computed(() => {
  if (!isAdmin.value) return []
  
  return [
    {
      id: 'admin-dashboard',
      label: 'Admin Dashboard',
      icon: 'shield',
      action: () => router.push('/admin')
    },
    {
      id: 'user-management',
      label: 'Manage Users',
      icon: 'users',
      action: () => router.push('/admin/users')
    }
  ]
})

const handleBack = () => router.back()
const openProfile = () => router.push('/profile')
const openSettings = () => router.push('/settings')

const confirmLogout = async () => {
  if (confirm('Are you sure you want to logout?')) {
    await logout()
    router.push('/login')
  }
}

const handleMenuItem = (item) => {
  console.log('Menu item clicked:', item)
}
</script>
```

## Parent Mode Integration

The TTopBar component fully integrates with the parent mode system:

```vue
<template>
  <TTopBar
    title="Kids App"
    app-name="kids-timer"
  />
</template>
```

When parent mode is:
- **Not enabled**: Clicking avatar shows setup dialog
- **Enabled but locked**: Clicking avatar shows PIN entry
- **Unlocked**: Shows "Parent Mode" indicator and full menu

## Styling

The component uses BEM methodology:

```css
.top-bar {
  /* Main container */
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  min-height: 4rem;
}

.top-bar__avatar {
  /* User avatar */
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.top-bar__online-indicator {
  /* Online status dot */
  position: absolute;
  bottom: 0;
  right: 0;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
}

.top-bar__parent-mode-indicator {
  /* Parent mode badge */
  color: var(--color-success);
  border-color: var(--color-success);
}
```

## User Menu

Default menu items:
- **Profile** - Navigate to user profile
- **Settings** - Open app settings
- **Sign Out** - Logout user

Custom items can be added via `customMenuItems` prop.

## Accessibility

- Semantic HTML structure with `<header>` element
- ARIA labels for all interactive elements
- Keyboard navigation support (Enter/Space to open menu)
- Focus management for dropdown menu
- Screen reader announcements
- High contrast mode support

## Best Practices

1. **Always provide a title** - Helps users understand their location
2. **Use subtitle sparingly** - Only for additional context
3. **Limit action buttons** - 2-3 maximum for mobile
4. **Handle all events** - Implement navigation handlers
5. **Test responsive behavior** - Check on various screen sizes
6. **Consider loading states** - Show feedback during operations
7. **Use parent mode** - For apps with parental controls

## Related Components

- `TAppLayout` - Uses TTopBar internally
- `TContextMenu` - Powers the user dropdown
- `TButton` - For actions and navigation
- `TParentMode` - Parent mode system
- `TBadge` - For notifications and status