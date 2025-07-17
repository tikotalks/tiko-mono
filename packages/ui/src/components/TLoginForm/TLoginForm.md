# TLoginForm

A comprehensive authentication form component that handles email-based passwordless login, registration, and Apple Sign-In. It provides a multi-step flow with email verification and supports SSO integration.

## Basic Usage

```vue
<template>
  <TLoginForm
    @email-submit="handleEmailSubmit"
    @verification-submit="handleVerificationSubmit"
    @apple-sign-in="handleAppleSignIn"
  />
</template>

<script setup>
import { TLoginForm } from '@tiko/ui'

const handleEmailSubmit = async (email, fullName) => {
  console.log('Email submitted:', email, fullName)
  // Send verification code
}

const handleVerificationSubmit = async (email, code) => {
  console.log('Code submitted:', email, code)
  // Verify code and authenticate
}

const handleAppleSignIn = async () => {
  console.log('Apple Sign-In clicked')
  // Handle Apple authentication
}
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isLoading` | `boolean` | `false` | Loading state for form actions |
| `error` | `string \| null` | `null` | Error message to display |
| `appId` | `string` | `undefined` | App ID for SSO purposes |
| `appName` | `string` | `undefined` | App name for display |
| `enableSSO` | `boolean` | `true` | Whether to show SSO button |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `apple-sign-in` | - | Apple Sign-In button clicked |
| `email-submit` | `[email: string, fullName?: string]` | Email form submitted |
| `verification-submit` | `[email: string, code: string]` | Verification code submitted |
| `resend-code` | `[email: string]` | Resend code requested |
| `clear-error` | - | Clear error requested |

## Form Steps

The login form has three distinct steps:

### 1. Email Step (Login)
- Email input field
- "Send Code" button
- Apple Sign-In option
- SSO button (if enabled)
- Link to switch to registration

### 2. Register Step
- Email input field
- Full name input (optional)
- "Send Code" button
- Link to switch back to login

### 3. Verification Step
- Shows email sent confirmation
- 6-digit code input
- "Verify Code" button
- Resend code option (with 60s cooldown)
- Change email option

## Examples

### Basic Login Flow

```vue
<template>
  <TLoginForm
    :is-loading="loading"
    :error="authError"
    @email-submit="sendVerificationCode"
    @verification-submit="verifyCode"
    @clear-error="authError = null"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TLoginForm } from '@tiko/ui'
import { authService } from '@/services/auth'

const loading = ref(false)
const authError = ref(null)

const sendVerificationCode = async (email) => {
  loading.value = true
  authError.value = null
  
  try {
    await authService.sendCode(email)
  } catch (error) {
    authError.value = error.message
  } finally {
    loading.value = false
  }
}

const verifyCode = async (email, code) => {
  loading.value = true
  authError.value = null
  
  try {
    await authService.verifyCode(email, code)
    // Redirect to app
  } catch (error) {
    authError.value = 'Invalid verification code'
  } finally {
    loading.value = false
  }
}
</script>
```

### With Apple Sign-In

```vue
<template>
  <TLoginForm
    app-id="timer"
    app-name="Tiko Timer"
    @apple-sign-in="handleAppleAuth"
    @email-submit="handleEmailAuth"
    @verification-submit="handleVerification"
  />
</template>

<script setup>
import { TLoginForm } from '@tiko/ui'
import { useAuthStore } from '@tiko/core'

const authStore = useAuthStore()

const handleAppleAuth = async () => {
  try {
    await authStore.signInWithApple()
  } catch (error) {
    console.error('Apple Sign-In failed:', error)
  }
}

const handleEmailAuth = async (email, fullName) => {
  try {
    await authStore.signInWithPasswordlessEmail(email, fullName)
  } catch (error) {
    console.error('Email auth failed:', error)
  }
}

const handleVerification = async (email, code) => {
  try {
    await authStore.verifyEmailOtp(email, code)
  } catch (error) {
    console.error('Verification failed:', error)
  }
}
</script>
```

### With SSO Integration

```vue
<template>
  <TLoginForm
    :app-id="appConfig.id"
    :app-name="appConfig.name"
    :enable-sso="appConfig.ssoEnabled"
    @email-submit="handleEmail"
    @verification-submit="handleVerification"
  />
</template>

<script setup>
import { TLoginForm } from '@tiko/ui'

const appConfig = {
  id: 'cards',
  name: 'Tiko Cards',
  ssoEnabled: true
}

// SSO button is automatically shown for non-tiko apps when enabled
</script>
```

### With Registration Flow

```vue
<template>
  <TLoginForm
    @email-submit="handleRegistration"
    @verification-submit="completeRegistration"
  />
</template>

<script setup>
import { TLoginForm } from '@tiko/ui'
import { userService } from '@/services/user'

const handleRegistration = async (email, fullName) => {
  // fullName is provided when user registers
  if (fullName) {
    console.log('New user registration:', email, fullName)
    await userService.createAccount(email, fullName)
  } else {
    console.log('Existing user login:', email)
  }
  
  // Send verification code
  await authService.sendCode(email)
}

const completeRegistration = async (email, code) => {
  await authService.verifyCode(email, code)
  // User is now authenticated
}
</script>
```

### Error Handling

```vue
<template>
  <TLoginForm
    :is-loading="state.loading"
    :error="state.error"
    @email-submit="handleEmail"
    @verification-submit="handleVerification"
    @resend-code="handleResend"
    @clear-error="clearError"
  />
</template>

<script setup>
import { reactive } from 'vue'
import { TLoginForm } from '@tiko/ui'

const state = reactive({
  loading: false,
  error: null,
  attempts: 0
})

const handleEmail = async (email) => {
  state.loading = true
  state.error = null
  
  try {
    await sendCode(email)
  } catch (error) {
    state.error = getErrorMessage(error)
  } finally {
    state.loading = false
  }
}

const handleVerification = async (email, code) => {
  state.loading = true
  state.error = null
  state.attempts++
  
  try {
    await verifyCode(email, code)
  } catch (error) {
    if (state.attempts >= 3) {
      state.error = 'Too many attempts. Please request a new code.'
    } else {
      state.error = 'Invalid code. Please try again.'
    }
  } finally {
    state.loading = false
  }
}

const handleResend = async (email) => {
  state.attempts = 0
  await handleEmail(email)
}

const clearError = () => {
  state.error = null
}

const getErrorMessage = (error) => {
  if (error.code === 'USER_NOT_FOUND') {
    return 'No account found with this email'
  }
  if (error.code === 'RATE_LIMITED') {
    return 'Too many requests. Please try again later.'
  }
  return 'An error occurred. Please try again.'
}
</script>
```

## Styling

The component uses BEM classes for styling:

```css
.login-form {
  /* Container */
  display: flex;
  justify-content: center;
}

.login-form__card {
  /* Card styling */
  background: var(--color-background);
  border-radius: var(--border-radius);
  box-shadow: 0 var(--space-s) var(--space-s) rgba(0, 0, 0, 0.1);
}

.login-form__header {
  /* Header with primary color */
  background-color: var(--color-primary);
  color: var(--color-primary-text);
  padding: var(--space) var(--card-padding);
}

.login-form__divider {
  /* "or" divider between options */
  position: relative;
  text-align: center;
}

.login-form__verification-options {
  /* Options display for verification */
  background: color-mix(in srgb, var(--color-primary), transparent 95%);
  border-left: 3px solid var(--color-primary);
}
```

## Features

### Email Validation
- Real-time email format validation
- Clear error messages for invalid emails
- Prevents submission with invalid email

### Verification Code
- 6-digit numeric code input
- Format validation (numbers only)
- Clear instructions for magic link option
- Automatic length validation

### Resend Cooldown
- 60-second cooldown after sending code
- Visual countdown timer
- Prevents spam/abuse
- Auto-clears on unmount

### Form States
- Loading states on all buttons
- Disabled states during operations
- Error display with retry options
- Smooth transitions between steps

## Accessibility

- Proper form labels and ARIA attributes
- Keyboard navigation support
- Focus management between steps
- Screen reader friendly error messages
- High contrast mode support

## Best Practices

1. **Handle all events** - Implement handlers for all authentication flows
2. **Show loading states** - Keep users informed during async operations
3. **Clear error messages** - Provide helpful, actionable error messages
4. **Implement rate limiting** - Prevent abuse of verification codes
5. **Secure the backend** - Validate all inputs server-side
6. **Remember user choice** - Store email for convenience (with consent)
7. **Test edge cases** - Network failures, invalid codes, etc.

## Security Considerations

- No passwords stored or transmitted
- OTP codes expire after set time
- Rate limiting on code requests
- Secure email verification flow
- Apple Sign-In follows platform standards

## Related Components

- `TAuthWrapper` - Full authentication wrapper
- `TSSOButton` - Single Sign-On button
- `TInput` - Form input components
- `TButton` - Button components
- `TForm` - Form wrapper component