<template>
  <div :class="bemm()">
    <!-- Loading State -->
    <div v-if="isInitializing" :class="bemm('loading')">
      <div :class="bemm('loading-content')">
        <div :class="bemm('loading-spinner')"></div>
        <h2 :class="bemm('loading-title')">Loading Tiko...</h2>
        <p :class="bemm('loading-subtitle')">Preparing your communication apps</p>
      </div>
    </div>

    <!-- Login Form within App Layout -->
    <TAppLayout
      v-else-if="!isAuthenticated"
      title="Welcome to Tiko"
      subtitle="Sign in to access your communication apps"
      :showHeader="false"
    >
      <div :class="bemm('login')">
        <TLoginForm
          :is-loading="authLoading"
          :error="authError"
          @apple-sign-in="handleAppleSignIn"
          @email-submit="handleEmailSubmit"
          @verification-submit="handleVerificationSubmit"
          @resend-code="handleResendCode"
          @clear-error="clearAuthError"
        />
      </div>
    </TAppLayout>

    <!-- Authenticated Content -->
    <div v-else :class="bemm('app')">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { useAuthStore } from '@tiko/core'
import TLoginForm from '../TLoginForm/TLoginForm.vue'
import TAppLayout from '../TAppLayout/TAppLayout.vue'

// BEM classes
const bemm = useBemm('auth-wrapper')

// Store
const authStore = useAuthStore()

// Local state
const isInitializing = ref(true)
const authLoading = ref(false)
const authError = ref<string | null>(null)

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Methods
const handleAppleSignIn = async () => {
  authLoading.value = true
  authError.value = null

  try {
    await authStore.signInWithApple()
  } catch (error) {
    authError.value = error instanceof Error ? error.message : 'Apple Sign-In failed'
  } finally {
    authLoading.value = false
  }
}

const handleEmailSubmit = async (email: string, fullName?: string) => {
  authLoading.value = true
  authError.value = null

  try {
    await authStore.signInWithPasswordlessEmail(email, fullName)
  } catch (error) {
    authError.value = error instanceof Error ? error.message : 'Failed to send verification code'
  } finally {
    authLoading.value = false
  }
}

const handleVerificationSubmit = async (email: string, code: string) => {
  authLoading.value = true
  authError.value = null

  try {
    await authStore.verifyEmailOtp(email, code)
  } catch (error) {
    authError.value = error instanceof Error ? error.message : 'Invalid verification code'
  } finally {
    authLoading.value = false
  }
}

const handleResendCode = async (email: string) => {
  authError.value = null

  try {
    await authStore.resendEmailOtp(email)
  } catch (error) {
    authError.value = error instanceof Error ? error.message : 'Failed to resend code'
  }
}

const clearAuthError = () => {
  authError.value = null
}

// Initialize authentication
onMounted(async () => {
  try {
    // Set up auth state listener
    authStore.setupAuthListener()

    // Try to restore session
    await authStore.initializeFromStorage()
  } catch (error) {
    console.error('Failed to initialize auth:', error)
  } finally {
    isInitializing.value = false
  }
})
</script>

<style lang="scss" scoped>
.auth-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  display: flex; align-items: center; justify-content: center;

  &__loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg,var(--color-primary) 0%, var(--color-secondary) 100%);
  }

  &__loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    text-align: center;
    color: var(--color-background);;
  }

  &__loading-spinner {
    width: 3rem;
    height: 3rem;
    border: 4px solid var(--color-accent);
    border-top-color: var(--color-background);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  &__loading-title {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
  }

  &__loading-subtitle {
    margin: 0;
    font-size: 1.125rem;
    opacity: 0.9;
  }

  &__login {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__app {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .auth-wrapper {
    &__login {
      padding: 1rem;
      min-height: 50vh;
    }

    &__loading-title {
      font-size: 1.5rem;
    }

    &__loading-subtitle {
      font-size: 1rem;
    }
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .auth-wrapper__loading-spinner {
    animation: none;
  }
}</style>
