# SSO Integration with TFramework

## Overview
The Tiko SSO system is now fully integrated into TFramework. When you use TFramework in your app, users will automatically see the "Sign in with Tiko" button on the login screen (except in the main Tiko app itself).

## How It Works

### Automatic Integration
When you wrap your app with TFramework, it automatically:
1. Shows "Sign in with Tiko" button in the login form
2. Passes your app's ID and name to the SSO system
3. Handles authentication callbacks

### Login Options
Users see three login options:
1. **Sign in with Tiko** (SSO - if not in Tiko app)
2. **Login with Apple** 
3. **Email login**

## Basic Setup

### 1. Use TFramework in Your App

```vue
<template>
  <TFramework
    :config="frameworkConfig"
    :background-image="backgroundImage"
  >
    <router-view />
  </TFramework>
</template>

<script setup lang="ts">
import { TFramework } from '@tiko/ui'
import tikoConfig from '../tiko.config'
import backgroundImage from './assets/app-icon.png'

const frameworkConfig = {
  ...tikoConfig,
  // Your app configuration
}
</script>
```

### 2. Add SSO Callback Handler

In your main App.vue:

```vue
<script setup>
import { useSSO } from '@tiko/core'

// This handles SSO callbacks automatically
useSSO({
  onSuccess: () => {
    console.log('User authenticated via SSO!')
  },
  onError: (error) => {
    console.error('SSO failed:', error)
  }
})
</script>
```

### 3. Configure Your tiko.config.ts

```typescript
export default defineConfig({
  appId: 'timer',        // Your app's unique ID
  appName: 'Timer',      // Display name
  // ... other config
})
```

## Mobile Deep Linking

For mobile apps, configure your URL scheme:

### iOS
```xml
<key>CFBundleURLSchemes</key>
<array>
  <string>tiko-yourapp</string>
</array>
```

### Android
```xml
<data android:scheme="tiko-yourapp" />
```

## How Users Experience It

### On Web:
1. User opens your app → Sees login screen with "Sign in with Tiko"
2. Clicks button → Redirects to app.tiko.mt/signin
3. Authenticates → Returns to your app logged in

### On Mobile:
1. User opens your app → Sees login screen with "Sign in with Tiko"
2. Clicks button → Opens Tiko app (if installed)
3. Authenticates → Returns to your app via deep link
4. If Tiko app not installed → Falls back to web flow

## Disabling SSO

If you want to disable SSO for any reason:

```vue
<TLoginForm
  :enable-sso="false"
  // ... other props
/>
```

## Benefits of Integration

1. **Zero Configuration**: Just use TFramework and SSO works
2. **Consistent UX**: Same login experience across all apps
3. **Smart Detection**: Automatically hides in Tiko app to prevent loops
4. **Mobile Optimized**: Deep linking for native app experience
5. **Fallback Support**: Always works, even without Tiko app

## Testing

1. Run your app locally
2. You should see "Sign in with Tiko" button on login screen
3. Click it to test the flow
4. For mobile testing, ensure both apps are installed