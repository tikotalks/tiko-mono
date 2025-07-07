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

    <!-- Login Form -->
    <div v-else-if="!isAuthenticated" :class="bemm('login')">
      <div :class="bemm('login-background')">
        <div :class="bemm('login-content')">
          <TLoginForm
            :is-loading="authLoading"
            :error="authError"
            @apple-sign-in="handleAppleSignIn"
            @email-sign-in="handleEmailSignIn"
            @email-sign-up="handleEmailSignUp"
            @clear-error="clearAuthError"
          />
        </div>
      </div>
    </div>

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

const handleEmailSignIn = async (email: string, password: string) => {
  authLoading.value = true
  authError.value = null

  try {
    await authStore.signInWithEmail(email, password)
  } catch (error) {
    authError.value = error instanceof Error ? error.message : 'Sign-in failed'
  } finally {
    authLoading.value = false
  }
}

const handleEmailSignUp = async (email: string, password: string, fullName?: string) => {
  authLoading.value = true
  authError.value = null

  try {
    await authStore.signUpWithEmail(email, password, fullName)
    authError.value = null
    // Show success message instead of error
    authError.value = 'Check your email to confirm your account'
  } catch (error) {
    authError.value = error instanceof Error ? error.message : 'Sign-up failed'
  } finally {
    authLoading.value = false
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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  
  &__loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  &__loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    text-align: center;
    color: white;
  }
  
  &__loading-spinner {
    width: 3rem;
    height: 3rem;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
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
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
  
  &__login-background {
    width: 100%;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
      opacity: 0.5;
    }
  }
  
  &__login-content {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 400px;
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