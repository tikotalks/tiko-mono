# Tiko SSO Integration Guide

## Overview
The Tiko SSO (Single Sign-On) system allows all Tiko apps to share authentication through the main Tiko app. When a user signs in once, they're authenticated across all Tiko applications.

## How It Works

### Web Flow
1. User clicks "Sign in with Tiko" button in any app
2. Redirects to `https://app.tiko.mt/signin`
3. User authenticates with Apple or Email
4. Redirects back to original app with session tokens
5. App establishes session using the tokens

### Mobile App-to-App Flow
1. User clicks "Sign in with Tiko" in a mobile app
2. If Tiko app is installed: Opens Tiko app directly via deep link
3. If not installed: Falls back to web-based authentication
4. After auth, returns to calling app via deep link with tokens

## Integration Steps

### 1. Add TSSOButton to Your App

```vue
<template>
  <div class="login-view">
    <TSSOButton 
      :app-id="appId"
      :app-name="appName"
      size="large"
    >
      Sign in with Tiko
    </TSSOButton>
  </div>
</template>

<script setup>
import { TSSOButton } from '@tiko/ui'

const appId = 'timer' // Your app's ID
const appName = 'Timer' // Display name
</script>
```

### 2. Handle SSO Callbacks

In your main App.vue or router setup:

```vue
<script setup>
import { useSSO } from '@tiko/core'
import { useRouter } from 'vue-router'

const router = useRouter()

// Handle SSO authentication callbacks
useSSO({
  onSuccess: () => {
    console.log('Successfully authenticated via SSO')
    router.push('/') // Navigate to main view
  },
  onError: (error) => {
    console.error('SSO authentication failed:', error)
    // Handle error (show message, etc.)
  }
})
</script>
```

### 3. Add Auth Callback Route

Ensure your router includes the callback route:

```typescript
const routes = [
  {
    path: '/auth/callback',
    name: 'authCallback',
    component: () => import('@/components/AuthCallback.vue')
  },
  // ... other routes
]
```

### 4. Configure Deep Links (Mobile Apps)

For Capacitor-based mobile apps, configure your URL scheme:

#### iOS (Info.plist)
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.tiko.yourapp</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>tiko-yourapp</string>
    </array>
  </dict>
</array>
```

#### Android (AndroidManifest.xml)
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="tiko-yourapp" />
</intent-filter>
```

## App Registry

All apps must be registered in the Tiko main app. Current registered apps:

| App ID | Name | Web URL | Mobile Scheme |
|--------|------|---------|---------------|
| tiko | Tiko | https://app.tiko.mt | tiko:// |
| timer | Timer | https://timer.tiko.mt | tiko-timer:// |
| radio | Radio | https://radio.tiko.mt | tiko-radio:// |
| todo | Todo | https://todo.tiko.mt | tiko-todo:// |
| cards | Cards | https://cards.tiko.mt | tiko-cards:// |
| yesno | Yes/No | https://yesno.tiko.mt | tiko-yesno:// |
| type | Type | https://type.tiko.mt | tiko-type:// |

## Benefits

1. **Single Sign-On**: Users only need to authenticate once
2. **Consistent Experience**: Same login flow across all apps
3. **App Store Friendly**: No need for separate signin app
4. **Fallback Support**: Works even if Tiko app isn't installed
5. **Cross-Platform**: Works on web and mobile seamlessly

## Security Considerations

- All authentication happens through Supabase's secure OAuth flow
- Tokens are passed via URL parameters (consider using state parameter for additional security)
- Sessions are managed by Supabase with automatic refresh
- Each app validates tokens independently

## Testing

1. **Web Testing**: Open any Tiko app and click "Sign in with Tiko"
2. **Mobile Testing**: Install both Tiko app and another app, test deep linking
3. **Fallback Testing**: Uninstall Tiko app and verify web fallback works