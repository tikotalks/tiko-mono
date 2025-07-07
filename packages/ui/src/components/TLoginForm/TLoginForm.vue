<template>
  <div :class="bemm()">
    <!-- Header -->
    <div :class="bemm('header')">
      <h1 :class="bemm('title')">Welcome to Tiko</h1>
      <p :class="bemm('subtitle')">
        {{ currentStep === 'email' ? 'Enter your email to continue' :
           currentStep === 'verification' ? 'Check your email for verification code' :
           'Sign in to access your communication apps' }}
      </p>
    </div>

    <!-- Login Card -->
    <div :class="bemm('card')">
      <!-- Step 1: Email Entry -->
      <div v-if="currentStep === 'email'" :class="bemm('step')">
        <!-- Apple Sign-In -->
        <TButton
          label="Continue with Apple"
          icon="apple"
          type="fancy"
          color="primary"
          size="large"
          @click="handleAppleSignIn"
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
            label="Email Address"
            placeholder="Enter your email"
            :error="emailError"
            :disabled="isLoading"
            required
            :class="bemm('email-input')"
          />

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
            @click="handleEmailSubmit"
            :disabled="!isEmailValid || isLoading"
            :class="bemm('continue-button')"
          />
        </form>
      </div>

      <!-- Step 2: Verification Code -->
      <div v-else-if="currentStep === 'verification'" :class="bemm('step')">
        <div :class="bemm('verification-info')">
          <TIcon name="mail" :class="bemm('verification-icon')" />
          <p :class="bemm('verification-text')">
            We sent a verification code to<br>
            <strong>{{ email }}</strong>
          </p>
        </div>

        <form :class="bemm('form')" @submit.prevent="handleVerificationSubmit">
          <TInput
            v-model="verificationCode"
            type="text"
            label="Verification Code"
            placeholder="Enter 6-digit code"
            :error="verificationError"
            :disabled="isLoading"
            maxlength="6"
            required
            :class="bemm('verification-input')"
          />

          <TButton
            label="Verify & Sign In"
            type="fancy"
            color="success"
            size="large"
            @click="handleVerificationSubmit"
            :disabled="!isVerificationValid || isLoading"
            :class="bemm('verify-button')"
          />

          <div :class="bemm('verification-actions')">
            <TButton
              label="Didn't receive code? Resend"
              type="ghost"
              color="secondary"
              size="medium"
              @click="handleResendCode"
              :disabled="isLoading || resendCooldown > 0"
              :class="bemm('resend-button')"
            />

            <TButton
              label="Use different email"
              type="ghost"
              color="secondary"
              size="medium"
              @click="goBackToEmail"
              :disabled="isLoading"
              :class="bemm('back-button')"
            />
          </div>
        </form>

        <!-- Resend cooldown -->
        <div v-if="resendCooldown > 0" :class="bemm('cooldown')">
          <p :class="bemm('cooldown-text')">
            Resend available in {{ resendCooldown }}s
          </p>
        </div>
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
          @click="clearError"
          :class="bemm('error-button')"
        />
      </div>

      <!-- Success Message -->
      <div v-if="successMessage" :class="bemm('success')">
        <TIcon name="check-circle" :class="bemm('success-icon')" />
        <p :class="bemm('success-message')">{{ successMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
  emailSubmit: [email: string, fullName?: string]
  verificationSubmit: [email: string, code: string]
  resendCode: [email: string]
  clearError: []
}>()

// BEM classes
const bemm = useBemm('login-form')

// Form state
const currentStep = ref<'email' | 'verification'>('email')
const email = ref('')
const fullName = ref('')
const verificationCode = ref('')
const emailError = ref('')
const verificationError = ref('')
const successMessage = ref('')
const resendCooldown = ref(0)

// Timer for resend cooldown
let cooldownTimer: NodeJS.Timeout | null = null

// Computed
const isEmailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.value)
})

const isVerificationValid = computed(() => {
  return verificationCode.value.length === 6 && /^\d{6}$/.test(verificationCode.value)
})

const loadingText = computed(() => {
  if (currentStep.value === 'email') return 'Sending verification code...'
  return 'Verifying code...'
})

// Methods
const handleAppleSignIn = () => {
  emit('appleSignIn')
}

const handleEmailSubmit = () => {
  if (!isEmailValid.value) {
    emailError.value = 'Please enter a valid email address'
    return
  }

  emailError.value = ''
  emit('emailSubmit', email.value, fullName.value || undefined)
  currentStep.value = 'verification'
  startResendCooldown()
}

const handleVerificationSubmit = () => {
  if (!isVerificationValid.value) {
    verificationError.value = 'Please enter a valid 6-digit code'
    return
  }

  verificationError.value = ''
  emit('verificationSubmit', email.value, verificationCode.value)
}

const handleResendCode = () => {
  if (resendCooldown.value > 0) return

  emit('resendCode', email.value)
  startResendCooldown()
  verificationCode.value = ''
  verificationError.value = ''
  successMessage.value = 'Verification code sent!'

  // Clear success message after 3 seconds
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

const goBackToEmail = () => {
  currentStep.value = 'email'
  verificationCode.value = ''
  verificationError.value = ''
  clearCooldown()
}

const startResendCooldown = () => {
  resendCooldown.value = 60
  cooldownTimer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) {
      clearCooldown()
    }
  }, 1000)
}

const clearCooldown = () => {
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }
  resendCooldown.value = 0
}

const clearError = () => {
  emailError.value = ''
  verificationError.value = ''
  emit('clearError')
}

// Reset form
const resetForm = () => {
  currentStep.value = 'email'
  email.value = ''
  fullName.value = ''
  verificationCode.value = ''
  emailError.value = ''
  verificationError.value = ''
  successMessage.value = ''
  clearCooldown()
}

// Set verification step (for external control)
const setVerificationStep = () => {
  currentStep.value = 'verification'
  startResendCooldown()
}

// Cleanup on unmount
onUnmounted(() => {
  clearCooldown()
})

// Expose methods
defineExpose({
  resetForm,
  setVerificationStep
})
</script>

<style lang="scss" scoped>
.login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;

  &__header {
    text-align: center;
    margin-bottom: 2rem;
  }

  &__title {
    margin: 0 0 0.5rem;
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-primary-text);
  }

  &__subtitle {
    margin: 0;
    font-size: 1rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
    min-height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__card {
    position: relative;
    background: var(--color-accent);
    border-radius: 1rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--color-border);
    overflow: hidden;
  }

  &__step {
    padding: 2rem;
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
      background: var(--color-border);
    }
  }

  &__divider-text {
    background: var(--color-accent);
    padding: 0 1rem;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__verification-info {
    text-align: center;
    margin-bottom: 1rem;
  }

  &__verification-icon {
    font-size: 3rem;
    color: var(--color-primary);
    margin-bottom: 1rem;
  }

  &__verification-text {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.5;

    strong {
      color: var(--color-primary-text);
      font-weight: 600;
    }
  }

  &__verification-input {
    text-align: center;
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: 0.5rem;
    font-family: monospace;
  }

  &__verification-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  &__cooldown {
    text-align: center;
    margin-top: 1rem;
  }

  &__cooldown-text {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
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
    z-index: 10;
  }

  &__loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  &__loading-text {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
  }

  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--color-error-light, #ffebee);
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
    background: var(--color-success-light, #e8f5e8);
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
    padding: 1rem;

    &__title {
      font-size: 1.5rem;
    }

    &__step {
      padding: 1.5rem;
    }

    &__verification-actions {
      button {
        width: 100%;
      }
    }
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .login-form__loading-spinner {
    animation: none;
  }
}

</style>
