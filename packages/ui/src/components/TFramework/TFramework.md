# TFramework

A comprehensive application framework component that provides the complete structure for Tiko apps. It integrates authentication, layout, theming, routing, and global services in a single component.

## Basic Usage

```vue
<template>
  <TFramework :config="appConfig">
    <RouterView />
  </TFramework>
</template>

<script setup>
import { TFramework } from '@tiko/ui'

const appConfig = {
  id: 'timer',
  name: 'Tiko Timer',
  theme: {
    primary: 'blue',
    secondary: 'purple'
  }
}
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `TFrameworkConfig` | required | Framework configuration object |
| `loading` | `boolean` | `false` | Global loading state |

## Configuration

The `config` prop accepts a comprehensive configuration object:

```typescript
interface TFrameworkConfig {
  id: string                    // App identifier
  name: string                  // App display name
  theme?: ThemeConfig           // Theme configuration
  topBar?: TopBarConfig         // Top bar settings
  settings?: SettingsConfig     // Settings configuration
  auth?: AuthConfig             // Authentication settings
  i18n?: I18nConfig            // Internationalization
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `ready` | - | Framework initialization complete |
| `route-change` | `Route` | Route navigation occurred |
| `settings-change` | `[section: string, value: any]` | Settings updated |

## Slots

| Slot | Description |
|------|-------------|
| `default` | Main app content |
| `topbar-actions` | Additional top bar actions |

## Examples

### Complete App Setup

```vue
<template>
  <TFramework 
    :config="frameworkConfig"
    :loading="appLoading"
    @ready="onAppReady"
    @route-change="handleRouteChange"
    @settings-change="handleSettingsChange"
  >
    <template #topbar-actions>
      <TButton 
        icon="bell"
        type="ghost"
        @click="showNotifications"
      />
      <TButton 
        icon="search"
        type="ghost"
        @click="openSearch"
      />
    </template>

    <RouterView />
  </TFramework>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { TFramework, TButton } from '@tiko/ui'

const appLoading = ref(true)

const frameworkConfig = {
  id: 'my-app',
  name: 'My Tiko App',
  theme: {
    primary: 'indigo',
    secondary: 'purple',
    accent: 'pink'
  },
  topBar: {
    showTitle: true,
    showSubtitle: true,
    showCurrentRoute: true,
    routeDisplay: 'subtitle'
  },
  settings: {
    enabled: true,
    sections: [
      {
        id: 'general',
        title: 'General',
        items: [
          { id: 'notifications', type: 'toggle', label: 'Notifications' }
        ]
      }
    ]
  }
}

const onAppReady = () => {
  appLoading.value = false
  console.log('App is ready!')
}

const handleRouteChange = (route) => {
  console.log('Route changed:', route.path)
}

const handleSettingsChange = (section, value) => {
  console.log('Settings changed:', section, value)
}

const showNotifications = () => {
  // Show notifications panel
}

const openSearch = () => {
  // Open search interface
}
</script>
```

### With Custom Theme

```vue
<template>
  <TFramework :config="customThemeConfig">
    <RouterView />
  </TFramework>
</template>

<script setup>
import { TFramework } from '@tiko/ui'

const customThemeConfig = {
  id: 'custom-app',
  name: 'Custom App',
  theme: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#ffffff',
    foreground: '#1f2937'
  }
}
</script>
```

### Timer App Example

```vue
<template>
  <TFramework :config="timerConfig">
    <div class="timer-app">
      <TimerDisplay />
      <TimerControls />
    </div>
  </TFramework>
</template>

<script setup>
import { TFramework } from '@tiko/ui'
import TimerDisplay from './TimerDisplay.vue'
import TimerControls from './TimerControls.vue'

const timerConfig = {
  id: 'timer',
  name: 'Tiko Timer',
  theme: {
    primary: 'blue',
    secondary: 'cyan'
  },
  topBar: {
    showTitle: true,
    showSubtitle: false,
    showCurrentRoute: true,
    routeDisplay: 'middle'
  },
  settings: {
    enabled: true,
    sections: [
      {
        id: 'timer',
        title: 'Timer Settings',
        items: [
          { id: 'sound', type: 'toggle', label: 'Sound Effects' },
          { id: 'vibration', type: 'toggle', label: 'Vibration' },
          { id: 'theme', type: 'select', label: 'Theme', options: ['Light', 'Dark'] }
        ]
      }
    ]
  }
}
</script>
```

### Radio App Example

```vue
<template>
  <TFramework :config="radioConfig">
    <StationList />
  </TFramework>
</template>

<script setup>
import { TFramework } from '@tiko/ui'
import StationList from './StationList.vue'

const radioConfig = {
  id: 'radio',
  name: 'Tiko Radio',
  theme: {
    primary: 'red',
    secondary: 'orange'
  },
  topBar: {
    showTitle: true,
    showSubtitle: true,
    showCurrentRoute: false
  },
  settings: {
    enabled: true,
    sections: [
      {
        id: 'audio',
        title: 'Audio Settings',
        items: [
          { id: 'volume', type: 'range', label: 'Volume', min: 0, max: 100 },
          { id: 'equalizer', type: 'toggle', label: 'Equalizer' }
        ]
      },
      {
        id: 'parental',
        title: 'Parental Controls',
        items: [
          { id: 'explicit', type: 'toggle', label: 'Block Explicit Content' },
          { id: 'time_limit', type: 'range', label: 'Daily Time Limit (hours)', min: 1, max: 8 }
        ]
      }
    ]
  }
}
</script>
```

## Framework Features

### Authentication Integration
- Complete auth flow with `TAuthWrapper`
- Splash screen during initialization
- Login/logout handling
- Session management

### Layout Management
- Responsive app layout with `TAppLayout`
- Configurable top bar
- Back navigation handling
- Route-based title display

### Global Services
- Popup service for modals
- Toast service for notifications
- Event bus for component communication
- Theme management

### Settings System
- Built-in settings interface
- Configurable sections and items
- User preference persistence
- Settings change events

### Theming
- CSS custom properties
- Color system integration
- Responsive design
- Dark/light mode support

## TopBar Configuration

```typescript
interface TopBarConfig {
  showTitle?: boolean          // Show app title
  showSubtitle?: boolean       // Show subtitle
  showCurrentRoute?: boolean   // Show current route
  routeDisplay?: 'subtitle' | 'middle'  // Where to show route
  showBack?: boolean          // Show back button
  showUser?: boolean          // Show user menu
  showParentMode?: boolean    // Show parent mode toggle
}
```

## Settings Configuration

```typescript
interface SettingsConfig {
  enabled?: boolean
  sections?: SettingsSection[]
}

interface SettingsSection {
  id: string
  title: string
  items: SettingsItem[]
}

interface SettingsItem {
  id: string
  type: 'toggle' | 'select' | 'range' | 'text'
  label: string
  options?: string[]  // For select type
  min?: number        // For range type
  max?: number        // For range type
}
```

## Service Injection

The framework provides services to child components:

```vue
<script setup>
import { inject } from 'vue'

// Access framework services
const popupService = inject('popupService')
const toastService = inject('toastService')
const frameworkConfig = inject('frameworkConfig')

// Use services in components
const showModal = () => {
  popupService.open({
    component: MyModal,
    title: 'Modal Title'
  })
}
</script>
```

## Best Practices

1. **Single Framework Instance** - Use one TFramework per app
2. **Configuration First** - Define all settings in config object
3. **Service Injection** - Use provided services in child components
4. **Route Management** - Configure routes with proper meta titles
5. **Theme Consistency** - Use consistent color schemes
6. **Settings Organization** - Group related settings logically
7. **Performance** - Load framework early in app lifecycle

## Integration with Router

```vue
<!-- App.vue -->
<template>
  <TFramework :config="appConfig">
    <RouterView />
  </TFramework>
</template>

<!-- Configure routes with meta -->
const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { title: 'Home' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: Settings,
    meta: { title: 'Settings' }
  }
]
```

## Related Components

- `TAuthWrapper` - Authentication wrapper
- `TAppLayout` - Application layout
- `TPopup` - Modal system
- `TToast` - Notification system
- `TProfile` - User profile editor
- `TSettings` - Settings interface