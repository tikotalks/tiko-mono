# TAuthWrapper

A comprehensive authentication wrapper component that handles the complete authentication flow for Tiko apps. It provides a splash screen during initialization, login interface for unauthenticated users, and renders the app content for authenticated users.

## Basic Usage

```vue
<template>
  <TAuthWrapper app-name="timer">
    <!-- Your authenticated app content -->
    <RouterView />
  </TAuthWrapper>
</template>

<script setup>
import { TAuthWrapper } from '@tiko/ui'
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `backgroundVideo` | `string` | `''` | Video URL for login screen background |
| `backgroundImage` | `string` | `''` | Image URL for login screen background |
| `title` | `string` | `'Welcome to Tiko'` | Title displayed on login screen |
| `appName` | `string` | `'todo'` | App identifier for splash and auth context |

## Slots

| Slot | Description |
|------|-------------|
| `default` | Content displayed when user is authenticated |

## Features

### Authentication Flow

1. **Initialization Phase**
   - Shows app-specific splash screen
   - Attempts to restore previous session
   - Minimum 2-second display time for branding

2. **Unauthenticated State**
   - Displays login form with background media
   - Supports email/passwordless authentication
   - Apple Sign-In integration
   - Email verification flow

3. **Authenticated State**
   - Renders provided app content
   - Maintains auth state across sessions
   - Handles session expiration

## Examples

### Simple Authentication

```vue
<template>
  <TAuthWrapper>
    <MyApp />
  </TAuthWrapper>
</template>

<script setup>
import { TAuthWrapper } from '@tiko/ui'
import MyApp from './MyApp.vue'
</script>
```

### With Custom Background

```vue
<template>
  <TAuthWrapper
    app-name="radio"
    title="Welcome to Tiko Radio"
    background-video="/videos/radio-background.mp4"
  >
    <RadioApp />
  </TAuthWrapper>
</template>
```

### With Background Image

```vue
<template>
  <TAuthWrapper
    app-name="cards"
    background-image="/images/cards-background.jpg"
  >
    <CardsApp />
  </TAuthWrapper>
</template>
```

### Full App Integration

```vue
<template>
  <TAuthWrapper 
    :app-name="appConfig.name"
    :title="appConfig.title"
    :background-video="appConfig.backgroundVideo"
  >
    <TAppLayout
      :title="currentRoute.meta.title"
      @logout="handleLogout"
    >
      <RouterView />
    </TAppLayout>
  </TAuthWrapper>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { TAuthWrapper, TAppLayout } from '@tiko/ui'
import { useAuthStore } from '@tiko/core'

const route = useRoute()
const authStore = useAuthStore()

const appConfig = {
  name: 'timer',
  title: 'Tiko Timer',
  backgroundVideo: '/videos/timer-bg.mp4'
}

const currentRoute = computed(() => route)

const handleLogout = async () => {
  await authStore.signOut()
}
</script>
```

### With Error Handling

```vue
<template>
  <TAuthWrapper app-name="todo">
    <ErrorBoundary>
      <TodoApp />
    </ErrorBoundary>
  </TAuthWrapper>
</template>

<script setup>
import { TAuthWrapper } from '@tiko/ui'
import { ErrorBoundary } from '@/components'
import TodoApp from './TodoApp.vue'
</script>
```

## Authentication Methods

The component handles various authentication methods internally:

### Email Authentication
- Passwordless email flow with OTP
- Email verification
- Resend code functionality
- Full name capture for new users

### Apple Sign-In
- Native Apple authentication
- Automatic user profile creation
- Seamless integration with iOS/macOS

### Session Management
- Automatic session restoration
- Secure token storage
- Session expiration handling
- Auth state persistence

## Splash Screen Integration

The component automatically shows an app-specific splash screen during initialization:

- Uses app-specific configurations from `defaultTikoSplashConfigs`
- Adapts theme colors from Tiko configuration
- Shows loading progress
- Smooth transition to login or app

## Background Media

### Video Background
- Supports MP4, WebM formats
- Auto-plays muted and looped
- Reduced playback speed (0.75x)
- Blur and opacity effects
- Mix-blend-mode for visual appeal

### Image Background
- Fallback for video
- Same visual effects as video
- Responsive scaling
- Performance optimized

## Styling

The component uses BEM methodology with these key classes:

```css
.auth-wrapper {
  /* Full viewport container */
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.auth-wrapper__background {
  /* Fixed background container */
  position: fixed;
  inset: 0;
  overflow: hidden;
  background-color: var(--color-primary);
}

.auth-wrapper__video,
.auth-wrapper__image {
  /* Background media styling */
  object-fit: cover;
  mix-blend-mode: multiply;
  transform: scale(1.25);
  filter: blur(5px);
  opacity: 0.5;
}

.auth-wrapper__login {
  /* Login form container */
  animation: comeUpLogin 0.5s ease-out;
}
```

## State Management

The component integrates with `useAuthStore` from `@tiko/core`:

```javascript
// Available auth store methods used
authStore.isAuthenticated // Computed property
authStore.setupAuthListener() // Initialize auth listener
authStore.initializeFromStorage() // Restore session
authStore.signInWithApple() // Apple Sign-In
authStore.signInWithPasswordlessEmail() // Email auth
authStore.verifyEmailOtp() // Verify code
authStore.resendEmailOtp() // Resend code
authStore.signOut() // Logout
```

## Error Handling

The component provides comprehensive error handling:

- Network errors during authentication
- Invalid verification codes
- Session restoration failures
- Apple Sign-In failures
- User-friendly error messages

## Accessibility

- Proper focus management during auth flow
- Screen reader announcements for state changes
- Keyboard navigation support
- Reduced motion support
- High contrast mode compatibility

## Best Practices

1. **App Name** - Always specify the correct app name for proper splash screen
2. **Background Media** - Optimize video/image files for web delivery
3. **Error States** - Handle auth errors gracefully in your app
4. **Loading States** - Show appropriate feedback during operations
5. **Session Management** - Let the wrapper handle auth state
6. **Deep Linking** - Consider auth state when implementing routing

## Security Considerations

- No credentials stored in component
- Secure token management via auth store
- HTTPS required for production
- Apple Sign-In security standards
- OTP expiration handling

## Related Components

- `TLoginForm` - The login form component
- `TSplashScreen` - Splash screen component
- `TAppLayout` - Layout wrapper for authenticated apps
- `useAuthStore` - Authentication state management