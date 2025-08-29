# TSSOButton

A specialized button component for Single Sign-On (SSO) authentication with the main Tiko app. It enables users to sign in to Tiko ecosystem apps using their existing Tiko account, supporting both web and native mobile flows.

## Basic Usage

```vue
<template>
  <TSSOButton
    app-id="timer"
    app-name="Tiko Timer"
  />
</template>

<script setup>
import { TSSOButton } from '@tiko/ui'
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `appId` | `string` | required | Unique identifier for your app |
| `appName` | `string` | `undefined` | Display name for your app |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `type` | `'default' \| 'ghost' \| 'outline'` | `'default'` | Button style variant |
| `disabled` | `boolean` | `false` | Disable the button |

## Features

### Intelligent Platform Detection
- Detects web vs native mobile environment
- Uses deep linking for native apps
- Falls back to web flow when needed

### Deep Link Support
- Native app-to-app communication
- Custom URL schemes for each app
- Automatic return URL handling

### Secure Authentication Flow
- Redirects to official Tiko signin
- Passes app context securely
- Handles return authentication

## Examples

### Simple Integration

```vue
<template>
  <div class="login-options">
    <h2>Sign in to continue</h2>

    <TSSOButton
      app-id="cards"
      app-name="Tiko Cards"
    />

    <p>or</p>

    <button @click="useEmailLogin">
      Sign in with email
    </button>
  </div>
</template>

<script setup>
import { TSSOButton } from '@tiko/ui'

const useEmailLogin = () => {
  // Alternative login method
}
</script>
```

### Different Sizes

```vue
<template>
  <div class="sso-examples">
    <TSSOButton
      app-id="timer"
      size="small"
    />

    <TSSOButton
      app-id="timer"
      size="medium"
    />

    <TSSOButton
      app-id="timer"
      size="large"
    />
  </div>
</template>
```

### Button Variants

```vue
<template>
  <div class="sso-variants">
    <TSSOButton
      app-id="radio"
      type="default"
    >
      Sign in with Tiko
    </TSSOButton>

    <TSSOButton
      app-id="radio"
      type="outline"
    >
      Use Tiko Account
    </TSSOButton>

    <TSSOButton
      app-id="radio"
      type="ghost"
    >
      Tiko SSO
    </TSSOButton>
  </div>
</template>
```

### Custom Button Text

```vue
<template>
  <TSSOButton
    app-id="todo"
    app-name="Tiko Todo"
  >
    Continue with Tiko Account
  </TSSOButton>
</template>
```

### With Loading State

```vue
<template>
  <TSSOButton
    app-id="timer"
    :disabled="isAuthenticating"
  >
    {{ isAuthenticating ? 'Connecting...' : 'Sign in with Tiko' }}
  </TSSOButton>
</template>

<script setup>
import { ref } from 'vue'
import { TSSOButton } from '@tiko/ui'

const isAuthenticating = ref(false)

// Set loading state when auth starts
window.addEventListener('beforeunload', () => {
  isAuthenticating.value = true
})
</script>
```

### In Login Form

```vue
<template>
  <form class="login-form" @submit.prevent>
    <h1>Welcome to {{ appName }}</h1>

    <!-- Primary SSO option -->
    <TSSOButton
      :app-id="appId"
      :app-name="appName"
      size="large"
      class="login-form__sso"
    />

    <div class="divider">
      <span>or</span>
    </div>

    <!-- Alternative login methods -->
    <input
      type="email"
      placeholder="Email address"
      v-model="email"
    />

    <button type="submit">
      Continue with email
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { TSSOButton } from '@tiko/ui'

const appId = 'cards'
const appName = 'Tiko Cards'
const email = ref('')
</script>

<style>
.login-form__sso {
  width: 100%;
  margin-bottom: var(--space);
}

.divider {
  text-align: center;
  margin: var(--space) 0;
  color: var(--color-text-secondary);
}
</style>
```

### Mobile App Integration

```vue
<template>
  <div class="mobile-login">
    <TSSOButton
      :app-id="config.appId"
      :app-name="config.appName"
      @click="trackSSOAttempt"
    />

    <p class="help-text">
      This will open the Tiko app if installed,
      or sign in through your browser.
    </p>
  </div>
</template>

<script setup>
import { TSSOButton } from '@tiko/ui'
import { analytics } from '@/services'

const config = {
  appId: 'timer-mobile',
  appName: 'Tiko Timer'
}

const trackSSOAttempt = () => {
  analytics.track('sso_button_clicked', {
    app_id: config.appId,
    platform: window.Capacitor ? 'mobile' : 'web'
  })
}
</script>
```

## How It Works

### Web Flow
1. User clicks SSO button
2. Redirects to `https://app.tiko.mt/signin`
3. Passes app ID and return URL
4. User signs in to Tiko
5. Redirects back with auth token

### Mobile Flow
1. User clicks SSO button
2. Attempts to open Tiko app via deep link
3. If Tiko app installed:
   - Opens with `tiko://signin` URL
   - Includes return scheme for your app
4. If not installed:
   - Falls back to web flow
   - Opens in browser/webview

## Deep Link Configuration

For mobile apps, configure your deep link scheme:

```javascript
// Capacitor config
{
  appId: 'com.tiko.timer',
  appName: 'Tiko Timer',
  plugins: {
    App: {
      // URL scheme for deep linking
      iosScheme: 'tiko-timer',
      androidScheme: 'tiko-timer'
    }
  }
}
```

## Authentication Handling

After SSO completion, handle the return:

```javascript
// In your app initialization
import { App } from '@capacitor/app'
import { authStore } from '@/stores/auth'

// Handle deep link returns
App.addListener('appUrlOpen', async (data) => {
  const url = new URL(data.url)

  if (url.pathname === '/auth/callback') {
    const token = url.searchParams.get('token')
    const userId = url.searchParams.get('user_id')

    if (token && userId) {
      await authStore.handleSSOCallback(token, userId)
    }
  }
})

// Web handling
const urlParams = new URLSearchParams(window.location.search)
const token = urlParams.get('token')

if (token) {
  await authStore.handleSSOCallback(token)
}
```

## Styling

The component uses TButton internally, inheriting its styles:

```css
/* Component wraps TButton, so all TButton styles apply */
.t-sso-button {
  /* Custom SSO button styles if needed */
}

/* The button includes the Tiko icon by default */
.t-sso-button .t-icon {
  margin-right: var(--space-xs);
}
```

## Security Considerations

1. **App ID Validation** - Register your app ID with Tiko
2. **Return URL Whitelist** - Only approved URLs accepted
3. **Token Expiration** - Auth tokens have limited lifetime
4. **HTTPS Required** - All auth flows use secure connections
5. **CSRF Protection** - State parameter prevents attacks

## Best Practices

1. **Register Your App** - Contact Tiko to register your app ID
2. **Provide App Name** - Improves user recognition
3. **Handle Errors** - Gracefully handle auth failures
4. **Loading States** - Show feedback during redirect
5. **Alternative Auth** - Provide fallback login methods
6. **Test Both Flows** - Verify web and mobile paths
7. **Clear Messaging** - Explain what happens when clicked

## Configuration

Register your app with Tiko:

```javascript
// Application registration
{
  appId: 'your-app-id',
  appName: 'Your App Name',
  allowedReturnUrls: [
    'https://your-app.com/auth/callback',
    'your-app://auth/callback'
  ],
  permissions: ['basic', 'profile']
}
```

## Error Handling

```vue
<template>
  <div>
    <TSSOButton
      app-id="timer"
      @click="attemptSSO"
    />

    <div v-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TSSOButton } from '@tiko/ui'

const error = ref('')

const attemptSSO = () => {
  try {
    // SSO will redirect, but capture any immediate errors
    error.value = ''
  } catch (e) {
    error.value = 'Unable to connect to Tiko. Please try again.'
  }
}

// Handle return errors
const urlParams = new URLSearchParams(window.location.search)
if (urlParams.get('error')) {
  error.value = urlParams.get('error_description') || 'Authentication failed'
}
</script>
```

## Related Components

- `TLoginForm` - Full login form with SSO option
- `TButton` - Base button component
- `TAuthWrapper` - Authentication wrapper
- `useAuth` - Authentication composable
