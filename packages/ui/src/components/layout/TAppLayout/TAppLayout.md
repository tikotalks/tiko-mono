# TAppLayout

A comprehensive application layout component that provides a consistent structure for Tiko apps. It includes a configurable top bar with navigation, user info, and actions, plus flexible content and footer areas.

## Basic Usage

```vue
<template>
  <TAppLayout
    title="My App"
    subtitle="Welcome back!"
    @back="handleBack"
  >
    <!-- Main content -->
    <div class="my-content">
      <h1>Page Content</h1>
      <p>Your app content goes here</p>
    </div>
  </TAppLayout>
</template>

<script setup>
import { TAppLayout } from '@tiko/ui'

const handleBack = () => {
  console.log('Back button clicked')
}
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `undefined` | Main title displayed in the top bar |
| `subtitle` | `string` | `undefined` | Subtitle text below the title |
| `showBackButton` | `boolean` | `false` | Show/hide the back button |
| `backButtonLabel` | `string` | `'Back'` | Custom label for back button |
| `showUserInfo` | `boolean` | `true` | Show/hide user information |
| `showOnlineStatus` | `boolean` | `true` | Show/hide online status indicator |
| `showHeader` | `boolean` | `true` | Show/hide the entire header |
| `isUserOnline` | `boolean` | `true` | Current online status |
| `isLoading` | `boolean` | `false` | Loading state for the app |
| `customMenuItems` | `ContextMenuItem[]` | `undefined` | Additional menu items |
| `appName` | `string` | `undefined` | Name of the current app |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `back` | - | Emitted when back button is clicked |
| `profile` | - | Emitted when profile is accessed |
| `settings` | - | Emitted when settings is clicked |
| `logout` | - | Emitted when logout is clicked |
| `menu-item-click` | `ContextMenuItem` | Emitted when custom menu item is clicked |

## Slots

| Slot | Description |
|------|-------------|
| `default` | Main content area |
| `top-bar-center` | Center content in the top bar |
| `top-bar-actions` | Action buttons in the top bar |
| `footer` | Optional footer content |

## Examples

### With Back Navigation

```vue
<template>
  <TAppLayout
    title="User Details"
    show-back-button
    @back="router.back()"
  >
    <UserProfile :id="userId" />
  </TAppLayout>
</template>

<script setup>
import { TAppLayout } from '@tiko/ui'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>
```

### With Custom Actions

```vue
<template>
  <TAppLayout title="Dashboard">
    <template #top-bar-actions>
      <TButton icon="search" @click="openSearch" />
      <TButton icon="bell" @click="showNotifications" />
    </template>

    <DashboardContent />
  </TAppLayout>
</template>
```

### With Footer

```vue
<template>
  <TAppLayout title="My App">
    <template #default>
      <MainContent />
    </template>

    <template #footer>
      <nav class="footer-nav">
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
        <span>© 2024 Tiko</span>
      </nav>
    </template>
  </TAppLayout>
</template>
```

### With Loading State

```vue
<template>
  <TAppLayout
    title="Loading Data"
    :is-loading="isLoading"
  >
    <div v-if="!isLoading">
      <DataList :items="data" />
    </div>
    <TSpinner v-else />
  </TAppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { TAppLayout, TSpinner } from '@tiko/ui'

const isLoading = ref(true)
const data = ref([])

onMounted(async () => {
  data.value = await fetchData()
  isLoading.value = false
})
</script>
```

### With Online Status

```vue
<template>
  <TAppLayout
    title="Chat App"
    show-online-status
    :is-user-online="isOnline"
  >
    <ChatInterface :online="isOnline" />
  </TAppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { TAppLayout } from '@tiko/ui'

const isOnline = ref(navigator.onLine)

onMounted(() => {
  window.addEventListener('online', () => isOnline.value = true)
  window.addEventListener('offline', () => isOnline.value = false)
})
</script>
```

### With Custom Menu

```vue
<template>
  <TAppLayout
    title="Admin Panel"
    :custom-menu-items="customItems"
    @menu-item-click="handleMenuItem"
  >
    <AdminDashboard />
  </TAppLayout>
</template>

<script setup>
import { TAppLayout } from '@tiko/ui'

const customItems = [
  {
    id: 'export',
    label: 'Export Data',
    icon: 'download'
  },
  {
    id: 'import',
    label: 'Import Data',
    icon: 'upload'
  },
  {
    id: 'divider',
    divider: true
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: 'help'
  }
]

const handleMenuItem = (item) => {
  switch(item.id) {
    case 'export':
      exportData()
      break
    case 'import':
      importData()
      break
    case 'help':
      openHelp()
      break
  }
}
</script>
```

### Full Featured Example

```vue
<template>
  <TAppLayout
    :title="currentPage.title"
    :subtitle="currentPage.subtitle"
    :show-back-button="canGoBack"
    show-online-status
    :is-user-online="isOnline"
    :is-loading="isLoading"
    app-name="timer"
    @back="navigateBack"
    @profile="openProfile"
    @settings="openSettings"
    @logout="handleLogout"
  >
    <template #top-bar-center>
      <TChip v-if="isPremium" type="success">
        Premium
      </TChip>
    </template>

    <template #top-bar-actions>
      <TButton
        icon="search"
        type="ghost"
        @click="toggleSearch"
      />
    </template>

    <template #default>
      <router-view v-slot="{ Component }">
        <transition name="page">
          <component :is="Component" />
        </transition>
      </router-view>
    </template>

    <template #footer>
      <TBanner v-if="hasUpdate" type="info">
        New version available!
        <TButton size="small" @click="updateApp">Update Now</TButton>
      </TBanner>
    </template>
  </TAppLayout>
</template>

<script setup>
import { computed } from 'vue'
import { TAppLayout, TButton, TChip, TBanner } from '@tiko/ui'
import { useRouter, useRoute } from 'vue-router'
import { useAuth, useApp } from '@/composables'

const router = useRouter()
const route = useRoute()
const { user, logout } = useAuth()
const { isOnline, isLoading, hasUpdate, updateApp } = useApp()

const currentPage = computed(() => ({
  title: route.meta.title || 'Tiko App',
  subtitle: route.meta.subtitle
}))

const canGoBack = computed(() => window.history.length > 1)
const isPremium = computed(() => user.value?.premium)

const navigateBack = () => router.back()
const openProfile = () => router.push('/profile')
const openSettings = () => router.push('/settings')
const toggleSearch = () => eventBus.emit('search:toggle')

const handleLogout = async () => {
  await logout()
  router.push('/login')
}
</script>
```

## Styling

The component uses BEM classes for styling:

```css
.app-layout {
  /* Full viewport container */
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
}

.app-layout__header {
  /* Fixed header with spacing */
  position: fixed;
  top: 0;
  z-index: 10;
  width: calc(100% - (var(--space) * 2));
  left: var(--space);
  border-radius: 0 0 var(--border-radius-s) var(--border-radius-s);
}

.app-layout__content {
  /* Main content area */
  width: 100%;
  height: fit-content;
  position: relative;
}

.app-layout__footer {
  /* Optional footer */
  flex-shrink: 0;
  border-top: 1px solid var(--color-accent);
  background: var(--color-accent);
}
```

## Accessibility

- Semantic HTML structure with `<header>`, `<main>`, and `<footer>` elements
- Proper heading hierarchy maintained
- Keyboard navigation support through TTopBar
- Screen reader announcements for navigation events
- Focus management on route changes

## Best Practices

1. **Always provide a title** - Helps users understand their location
2. **Use app-name prop** - Enables proper tracking and context
3. **Handle navigation events** - Implement all emitted events appropriately
4. **Consider mobile layout** - Test on various screen sizes
5. **Use slots wisely** - Don't overload the top bar with too many actions
6. **Maintain consistency** - Use the same layout structure across your app
7. **Loading states** - Show appropriate feedback during data fetching
8. **Error boundaries** - Wrap content in error handling components

## Related Components

- `TTopBar` - The header component used internally
- `TSplashScreen` - For initial app loading
- `TAuthWrapper` - For authentication-required layouts
- `TBanner` - For important announcements
- `TSpinner` - For loading states
