<template>
  <div :class="bemm()">
    <!-- Header -->
    <div :class="bemm('header')">
      <h1 :class="bemm('title')">Welcome to Tiko</h1>
      <p :class="bemm('subtitle')">Sign in to access your communication apps</p>
    </div>

    <!-- Login Methods -->
    <div :class="bemm('methods')">
      <!-- Apple Sign-In -->
      <TButton
        :label="'Continue with Apple'"
        :icon="'apple'"
        type="fancy"
        color="primary"
        size="large"
        :action="handleAppleSignIn"
        :disabled="isLoading"
        :class="bemm('apple-button')"
      />

      <!-- Divider -->
      <div :class="bemm('divider')">
        <span :class="bemm('divider-text')">or</span>
      </div>

      <!-- Email Form -->
      <form :class="bemm('form')" @submit.prevent="handleEmailSubmit">
        <TInput
          v-model="email"
          type="email"
          label="Email"
          placeholder="Enter your email"
          :error="emailError"
          :disabled="isLoading"
          required
          :class="bemm('email-input')"
        />

        <TInput
          v-if="showPassword"
          v-model="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          :error="passwordError"
          :disabled="isLoading"
          :required="isSignIn"
          :class="bemm('password-input')"
        />

        <div v-if="showPassword" :class="bemm('form-actions')">
          <TButton
            :label="isSignIn ? 'Sign In' : 'Create Account'"
            type="fancy"
            color="success"
            size="large"
            :action="handleEmailSubmit"
            :disabled="!isFormValid || isLoading"
            :class="bemm('submit-button')"
          />

          <TButton
            :label="isSignIn ? 'Need an account?' : 'Already have an account?'"
            type="ghost"
            color="secondary"
            size="medium"
            :action="toggleSignMode"
            :disabled="isLoading"
            :class="bemm('toggle-button')"
          />
        </div>

        <div v-else :class="bemm('form-actions')">
          <TInput
            v-model="fullName"
            type="text"
            label="Full Name (Optional)"
            placeholder="Enter your full name"
            :disabled="isLoading"
            :class="bemm('name-input')"
          />

          <TButton
            label="Continue with Email"
            type="fancy"
            color="success"
            size="large"
            :action="initiateEmailFlow"
            :disabled="!email || isLoading"
            :class="bemm('continue-button')"
          />
        </div>
      </form>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" :class="bemm('loading')">
      <div :class="bemm('loading-spinner')"></div>
      <p :class="bemm('loading-text')">{{ loadingText }}</p>
    </div>

    <!-- Error Message -->
    <div v-if="error" :class="bemm('error')">
      <TIcon name="alert-circle" :class="bemm('error-icon')" />
      <p :class="bemm('error-message')">{{ error }}</p>
      <TButton
        label="Try Again"
        type="ghost"
        color="error"
        size="small"
        :action="clearError"
        :class="bemm('error-button')"
      />
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" :class="bemm('success')">
      <TIcon name="check-circle" :class="bemm('success-icon')" />
      <p :class="bemm('success-message')">{{ successMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBemm } from 'bemm'
import TButton from '../TButton/TButton.vue'
import TInput from '../TInput/TInput.vue'
import TIcon from '../TIcon/TIcon.vue'

interface Props {
  isLoading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: null
})

const emit = defineEmits<{
  appleSignIn: []
  emailSignIn: [email: string, password: string]
  emailSignUp: [email: string, password: string, fullName?: string]
  clearError: []
}>()

// BEM classes
const bemm = useBemm('login-form')

// Form state
const email = ref('')
const password = ref('')
const fullName = ref('')
const showPassword = ref(false)
const isSignIn = ref(true)
const emailError = ref('')
const passwordError = ref('')
const successMessage = ref('')

// Computed
const isFormValid = computed(() => {
  if (!showPassword.value) {
    return !!email.value
  }
  
  if (isSignIn.value) {
    return !!email.value && !!password.value
  }
  
  return !!email.value && !!password.value
})

const loadingText = computed(() => {
  if (!showPassword.value) return 'Checking account...'
  if (isSignIn.value) return 'Signing in...'
  return 'Creating account...'
})

// Methods
const handleAppleSignIn = () => {
  emit('appleSignIn')
}

const initiateEmailFlow = () => {
  if (!email.value) return
  
  emailError.value = ''
  // For now, always show password form
  // In a real app, you might check if the email exists first
  showPassword.value = true
}

const handleEmailSubmit = () => {
  if (!isFormValid.value) return
  
  emailError.value = ''
  passwordError.value = ''
  
  if (isSignIn.value) {
    emit('emailSignIn', email.value, password.value)
  } else {
    emit('emailSignUp', email.value, password.value, fullName.value || undefined)
  }
}

const toggleSignMode = () => {
  isSignIn.value = !isSignIn.value
  passwordError.value = ''
  successMessage.value = ''
}

const clearError = () => {
  emit('clearError')
}

// Reset form when switching modes
const resetForm = () => {
  email.value = ''
  password.value = ''
  fullName.value = ''
  showPassword.value = false
  isSignIn.value = true
  emailError.value = ''
  passwordError.value = ''
  successMessage.value = ''
}

// Expose reset method
defineExpose({
  resetForm
})
</script>

<style lang="scss" scoped>
.login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  
  &__header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  &__title {
    margin: 0 0 0.5rem;
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  
  &__subtitle {
    margin: 0;
    font-size: 1rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }
  
  &__methods {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  &__apple-button {
    background: #000;
    color: white;
    
    &:hover {
      background: #333;
    }
  }
  
  &__divider {
    position: relative;
    text-align: center;
    margin: 0.5rem 0;
    
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: var(--border-primary);
    }
  }
  
  &__divider-text {
    background: white;
    padding: 0 1rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
  
  &__form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  &__form-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }
  
  &__loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 1rem;
    gap: 1rem;
  }
  
  &__loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid var(--border-primary);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  &__loading-text {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
  
  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border: 1px solid var(--color-error);
    border-radius: 0.5rem;
    margin-top: 1rem;
  }
  
  &__error-icon {
    color: var(--color-error);
  }
  
  &__error-message {
    margin: 0;
    color: var(--color-error);
    font-size: 0.875rem;
    text-align: center;
    line-height: 1.4;
  }
  
  &__success {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border: 1px solid var(--color-success);
    border-radius: 0.5rem;
    margin-top: 1rem;
  }
  
  &__success-icon {
    color: var(--color-success);
  }
  
  &__success-message {
    margin: 0;
    color: var(--color-success);
    font-size: 0.875rem;
    text-align: center;
    line-height: 1.4;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .login-form {
    margin: 1rem;
    padding: 1.5rem;
    
    &__title {
      font-size: 1.5rem;
    }
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .login-form__loading-spinner {
    animation: none;
  }
}</style>