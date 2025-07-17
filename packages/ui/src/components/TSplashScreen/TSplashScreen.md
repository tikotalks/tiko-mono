# TSplashScreen

A sophisticated splash screen component that displays the animated Tiko logo during app initialization. It provides smooth transitions, customizable theming, and automatic timing control for a polished app launch experience.

## Basic Usage

```vue
<template>
  <TSplashScreen 
    app-name="Tiko Timer"
    :duration="3000"
    @complete="onSplashComplete"
  />
</template>

<script setup>
import { TSplashScreen } from '@tiko/ui'

const onSplashComplete = () => {
  console.log('Splash screen finished')
  // Initialize app
}
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `appName` | `string` | `undefined` | Application name displayed below logo |
| `appIcon` | `string` | `undefined` | Custom app icon (uses Tiko logo by default) |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Color theme for splash screen |
| `duration` | `number` | `3000` | Display duration in ms (0 = manual) |
| `showLoading` | `boolean` | `true` | Show loading indicator |
| `loadingText` | `string` | `'Loading...'` | Loading indicator text |
| `version` | `string` | `undefined` | App version to display |
| `enableTransitions` | `boolean` | `true` | Enable fade in/out transitions |
| `backgroundColor` | `string` | `undefined` | Custom background color |
| `textColor` | `string` | `undefined` | Custom text color |

## Events

| Event | Description |
|-------|-------------|
| `complete` | Emitted when splash duration completes |
| `hide` | Emitted when splash is hidden |
| `show` | Emitted when splash is shown |

## Features

### Animated Tiko Logo
The component displays the official Tiko logo with a sophisticated animation sequence:
- Letters drop in sequentially (T-I-K-O)
- Dot bounces in with elastic effect
- App name slides up from below
- Subtle pulsing glow effect

### Automatic Timing
- Configurable display duration
- Auto-hides after specified time
- Manual control option (duration=0)
- Smooth fade transitions

### Theme Support
- Automatically uses app's primary color
- Respects system color scheme
- Custom color overrides available

## Examples

### Simple Splash

```vue
<template>
  <TSplashScreen 
    app-name="My App"
  />
</template>
```

### Manual Control

```vue
<template>
  <TSplashScreen 
    ref="splashRef"
    app-name="Tiko Radio"
    :duration="0"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { TSplashScreen } from '@tiko/ui'

const splashRef = ref()

onMounted(async () => {
  // Initialize app
  await initializeApp()
  
  // Manually hide splash
  splashRef.value?.hide()
})
</script>
```

### With Loading State

```vue
<template>
  <TSplashScreen 
    app-name="Tiko Cards"
    :show-loading="true"
    loading-text="Preparing your cards..."
    :duration="0"
    @complete="onComplete"
  />
</template>

<script setup>
import { TSplashScreen } from '@tiko/ui'

const onComplete = () => {
  // Splash hidden, show app
}
</script>
```

### Custom Theme

```vue
<template>
  <TSplashScreen 
    app-name="Kids Timer"
    theme="light"
    background-color="#FFE5B4"
    text-color="#8B4513"
  />
</template>
```

### With Version Display

```vue
<template>
  <TSplashScreen 
    app-name="Tiko Todo"
    :version="appVersion"
    :duration="4000"
  />
</template>

<script setup>
import { TSplashScreen } from '@tiko/ui'

const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0'
</script>
```

### In App Initialization Flow

```vue
<template>
  <div id="app">
    <TSplashScreen 
      v-if="showSplash"
      :app-name="appConfig.name"
      :duration="minSplashDuration"
      @complete="hideSplash"
    />
    
    <TAuthWrapper v-else>
      <RouterView />
    </TAuthWrapper>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { TSplashScreen, TAuthWrapper } from '@tiko/ui'
import { useAppConfig } from '@/composables'

const showSplash = ref(true)
const { appConfig } = useAppConfig()
const minSplashDuration = 2500

const hideSplash = () => {
  showSplash.value = false
}

onMounted(async () => {
  // Perform app initialization while splash is showing
  await Promise.all([
    loadUserPreferences(),
    initializeServices(),
    preloadAssets()
  ])
})
</script>
```

### Progressive Enhancement

```vue
<template>
  <TSplashScreen 
    v-if="!appReady"
    app-name="Tiko"
    :enable-transitions="prefersReducedMotion ? false : true"
    @complete="markAppReady"
  />
  
  <div v-else class="app">
    <!-- App content -->
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { TSplashScreen } from '@tiko/ui'

const appReady = ref(false)

const prefersReducedMotion = computed(() => 
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
)

const markAppReady = () => {
  appReady.value = true
}
</script>
```

## Animation Details

The Tiko logo animation consists of:

1. **Letter animations** (0.6s each, staggered):
   - Drop from above with scale effect
   - Elastic bounce on landing
   - Sequential timing (T → I → K → O)

2. **Dot animation** (0.8s):
   - Bounces in from above
   - Elastic scaling effect
   - Settles after letters

3. **App name** (0.8s):
   - Slides up with fade in
   - Appears after logo completes

4. **Background effect**:
   - Subtle radial gradient pulse
   - Creates depth and movement

## Styling

The component uses CSS custom properties:

```css
.splash-screen {
  /* Always uses primary theme colors */
  background-color: var(--color-primary);
  color: var(--color-primary-text);
  
  /* Full viewport coverage */
  position: fixed;
  inset: 0;
  z-index: 9999;
}

/* Logo sizing */
.splash-screen__logo-wrapper {
  width: 8em; /* Scales with font-size */
  height: 8em;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .splash-screen__logo {
    width: 6em;
    height: 6em;
  }
}
```

### Custom Styling

```vue
<style>
/* Customize splash screen appearance */
.splash-screen {
  /* Custom gradient background */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.splash-screen__title {
  /* Custom font for app name */
  font-family: 'Custom Font', sans-serif;
  letter-spacing: 0.1em;
}
</style>
```

## Native App Support

The component includes support for native app environments:

- Safe area insets for notched devices
- Status bar color coordination
- Native splash screen handoff
- PWA splash screen configuration

## Accessibility

- Proper ARIA attributes for loading state
- Respects reduced motion preferences
- Screen reader announcements
- Keyboard focus management

## Best Practices

1. **Minimum duration** - Use at least 2 seconds for branding
2. **Preload assets** - Load critical resources during splash
3. **Smooth handoff** - Ensure seamless transition to app
4. **Match theme** - Use consistent colors with your app
5. **Version info** - Display version in development builds
6. **Error handling** - Have fallback if initialization fails
7. **Performance** - Keep splash lightweight and fast

## Performance Considerations

- SVG logo is inline for instant display
- CSS animations use GPU acceleration
- No external dependencies
- Minimal JavaScript execution
- Automatic cleanup on unmount

## Integration Examples

### With Router

```vue
<template>
  <TSplashScreen 
    v-if="!routerReady"
    app-name="Tiko App"
    @complete="onSplashComplete"
  />
  <RouterView v-else />
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { TSplashScreen } from '@tiko/ui'

const router = useRouter()
const routerReady = ref(false)

router.isReady().then(() => {
  routerReady.value = true
})
</script>
```

### With Vuex/Pinia

```vue
<template>
  <TSplashScreen 
    v-if="isInitializing"
    :app-name="appName"
    @complete="onInitComplete"
  />
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from '@/store'
import { TSplashScreen } from '@tiko/ui'

const store = useStore()

const isInitializing = computed(() => store.state.app.initializing)
const appName = computed(() => store.state.app.name)

const onInitComplete = () => {
  store.dispatch('app/setInitialized')
}
</script>
```

## Related Components

- `TAuthWrapper` - Often used after splash screen
- `TAppLayout` - Main app structure after splash
- `TSpinner` - For loading states within app
- `TSplashScreen` - This component