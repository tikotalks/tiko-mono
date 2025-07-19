<template>
  <div :class="bemm()">
    <!-- Login Card -->
    <div :class="bemm('card')">
      <template v-if="currentStep === 'email'">
        <!-- Header -->
        <div :class="bemm('header')">
          <h4 :class="bemm('title')">Login to your account</h4>
        </div>
        <!-- Email Step -->
        <div :class="bemm('content')">
          <!-- Email Input -->
          <TForm @submit.prevent="handleEmailSubmit">
            <TInputEmail
              v-model="email"
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              :disabled="isLoading"
              required
              :class="bemm('input')"
            />

            <TButton
              label="Send Code"
              color="primary"
              size="large"
              @click="handleEmailSubmit"
              :disabled="!isEmailValid || isLoading"
              :loading="isLoading"
              :class="bemm('submit-button')"
              >Send Code</TButton
            >
          </TForm>

          <!-- Divider -->
          <div :class="bemm('divider')">
            <span :class="bemm('divider-text')">or</span>
          </div>

          <!-- SSO Button (only show if not in Tiko app and SSO is enabled) -->
          <TSSOButton
            v-if="enableSSO && appId && appId !== 'tiko'"
            :app-id="appId"
            :app-name="appName"
            size="large"
            :disabled="isLoading"
            :class="bemm('sso-button')"
          />

          <!-- Apple Sign-In -->
          <TButton
            icon="arrow-right"
            color="black"
            size="large"
            @click="handleAppleSignIn"
            :disabled="isLoading"
            :class="bemm('apple-button')"
            >Login with Apple</TButton
          >

          <!-- Register Link -->
          <div :class="bemm('register')">
            <span :class="bemm('register-text')">Don't have an account?</span>
            <button
              type="button"
              :class="bemm('register-link')"
              @click="toggleMode"
            >
              Register
            </button>
          </div>
        </div>
      </template>

      <template v-else-if="currentStep === 'verification'">
        <!-- Verification Code Step -->
        <div :class="bemm('content')">
          <div :class="bemm('verification-info')">
            <TIcon name="mail" :class="bemm('verification-icon')" />
            <p :class="bemm('verification-text')">
              We've sent you an email with two options:<br />
              <strong>{{ email }}</strong>
            </p>
            <div :class="bemm('verification-options')">
              <p :class="bemm('option')">
                <strong>Option 1:</strong> Click the magic link in your email
              </p>
              <p :class="bemm('option')">
                <strong>Option 2:</strong> Enter the {{ codeLength }}-digit code
                below
              </p>
            </div>
          </div>

          <TForm @submit.prevent="handleVerificationSubmit">
            <TInputText
              v-model="verificationCode"
              type="text"
              label="Verification Code"
              :placeholder="`Enter ${codeLength}-digit code`"
              :error="verificationError ? [verificationError] : undefined"
              :disabled="isLoading"
              :maxlength="codeLength"
              required
              :class="bemm('code-input')"
            />

            <TButton
              label="Verify Code"
              color="primary"
              size="large"
              @click="handleVerificationSubmit"
              :disabled="!isVerificationValid || isLoading"
              :loading="isLoading"
              :class="bemm('submit-button')"
              >Verify Code</TButton
            >
          </TForm>

          <!-- Actions -->
          <TButtonGroup :class="bemm('actions')">
            <TButton
              :class="bemm('action-link')"
              @click="handleResendCode"
              :disabled="isLoading || resendCooldown > 0"
            >
              {{
                resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Didn't receive code? Resend"
              }}
            </TButton>

            <TButton
              :class="bemm('action-link')"
              @click="goBackToEmail"
              :disabled="isLoading"
            >
              Use different email
            </TButton>
          </TButtonGroup>
        </div>
      </template>

      <!-- Register Step -->
      <template v-else-if="currentStep === 'register'">
        <div :class="bemm('header')">
          <h2 :class="bemm('title')">Create your account</h2>
        </div>
        <div :class="bemm('content')">
          <TForm @submit.prevent="handleRegisterSubmit">
            <TInputEmail
              v-model="email"
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              :disabled="isLoading"
              required
              :class="bemm('input')"
            />

            <TInputText
              v-model="fullName"
              type="text"
              label="Full Name (Optional)"
              placeholder="Enter your full name"
              :disabled="isLoading"
              :class="bemm('input')"
            />

            <TButton
              label="Send Code"
              type="fancy"
              color="primary"
              size="large"
              @click="handleRegisterSubmit"
              :disabled="!isEmailValid || isLoading"
              :loading="isLoading"
              :class="bemm('submit-button')"
              >Send Code</TButton
            >
          </TForm>

          <!-- Back to Login -->
          <div :class="bemm('register')">
            <span :class="bemm('register-text')">Already have an account?</span>
            <button
              type="button"
              :class="bemm('register-link')"
              @click="toggleMode"
            >
              Login
            </button>
          </div>
        </div>
      </template>

      <!-- Error Message (shown for all steps) -->
      <div v-if="error" :class="bemm('error')">
        <TIcon name="alert-circle" :class="bemm('error-icon')" />
        <p :class="bemm('error-message')">{{ error }}</p>
        <TButton
          label="Try Again"
          type="ghost"
          color="secondary"
          size="small"
          @click="clearError"
          :class="bemm('error-button')"
          >Try Again</TButton
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useBemm } from 'bemm';
import TButton from '../TButton/TButton.vue';
import TButtonGroup from '../TButton/TButtonGroup.vue';
import TIcon from '../TIcon/TIcon.vue';
import TForm from '../TForm/TForm.vue';
import TInputText from '../TForm/inputs/TInputText/TInputText.vue';
import TInputEmail from '../TForm/InputEmail/InputEmail.vue';
import TSSOButton from '../TSSOButton/TSSOButton.vue';
import type {
  TLoginFormProps,
  TLoginFormEmits,
  LoginFormStep,
} from './TLoginForm.model';

const props = withDefaults(defineProps<TLoginFormProps>(), {
  isLoading: false,
  error: null,
  enableSSO: true,
});

const emit = defineEmits<TLoginFormEmits>();

// BEM classes
const bemm = useBemm('login-form');

// Form state
const currentStep = ref<LoginFormStep>('email');
const email = ref('');
const fullName = ref('');
const verificationCode = ref('');
const emailError = ref('');
const verificationError = ref('');
const resendCooldown = ref(0);
const codeLength = 6; // 6-digit code

// Timer for resend cooldown
let cooldownTimer: NodeJS.Timeout | null = null;

// Computed
const isEmailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.value);
});

const isVerificationValid = computed(() => {
  return (
    verificationCode.value.length === codeLength &&
    /^\d+$/.test(verificationCode.value)
  );
});

// Methods
const handleAppleSignIn = () => {
  emit('appleSignIn');
};

const handleEmailSubmit = () => {
  if (!isEmailValid.value) {
    emailError.value = 'Please enter a valid email address';
    return;
  }

  emailError.value = '';
  // Store email for auth callback
  localStorage.setItem('tiko_pending_auth_email', email.value);
  emit('emailSubmit', email.value);
  currentStep.value = 'verification';
  startResendCooldown();
};

const handleRegisterSubmit = () => {
  if (!isEmailValid.value) {
    emailError.value = 'Please enter a valid email address';
    return;
  }

  emailError.value = '';
  // Store email for auth callback
  localStorage.setItem('tiko_pending_auth_email', email.value);
  emit('emailSubmit', email.value, fullName.value || undefined);
  currentStep.value = 'verification';
  startResendCooldown();
};

const handleVerificationSubmit = () => {
  if (!isVerificationValid.value) {
    verificationError.value = `Please enter a valid ${codeLength}-digit code`;
    return;
  }

  verificationError.value = '';
  emit('verificationSubmit', email.value, verificationCode.value);
};

const handleResendCode = () => {
  if (resendCooldown.value > 0) return;

  emit('resendCode', email.value);
  startResendCooldown();
  verificationCode.value = '';
  verificationError.value = '';
};

const goBackToEmail = () => {
  currentStep.value =
    currentStep.value === 'verification' && fullName.value
      ? 'register'
      : 'email';
  verificationCode.value = '';
  verificationError.value = '';
  clearCooldown();
};

const toggleMode = () => {
  currentStep.value = currentStep.value === 'register' ? 'email' : 'register';
  emailError.value = '';
  verificationError.value = '';
  email.value = '';
  fullName.value = '';
  verificationCode.value = '';
};

const startResendCooldown = () => {
  resendCooldown.value = 60;
  cooldownTimer = setInterval(() => {
    resendCooldown.value--;
    if (resendCooldown.value <= 0) {
      clearCooldown();
    }
  }, 1000);
};

const clearCooldown = () => {
  if (cooldownTimer) {
    clearInterval(cooldownTimer);
    cooldownTimer = null;
  }
  resendCooldown.value = 0;
};

const clearError = () => {
  emailError.value = '';
  verificationError.value = '';
  emit('clearError');
};

// Cleanup on unmount
onUnmounted(() => {
  clearCooldown();
});
</script>

<style lang="scss" scoped>
.login-form {
  display: flex;
  justify-content: center;

  --card-padding: var(--space-xl);

  .button {
    width: 100%;
  }

  &__card {
    background: var(--color-background);
    border-radius: var(--border-radius);
    box-shadow: 0 var(--space-s) var(--space-s) rgba(0, 0, 0, 0.1);
    width: 100%;
  }

  &__header {
    padding: var(--space) var(--card-padding);
    background-color: var(--color-primary);
    color: var(--color-primary-text);
    border-radius: var(--border-radius) var(--border-radius) 0 0;
  }

  &__title {
    margin: 0;
    font-weight: 600;
  }

  &__content {
    padding: var(--card-padding);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__register-link {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 500;
    cursor: pointer;
    background-color: transparent;
    font-size: 1em;
    border: none;

    &:hover {
      text-decoration: underline;
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
      background: color-mix(in srgb, var(--color-foreground), transparent 75%);
    }

    &-text {
      background: var(--color-background);
      padding: 0 1rem;
      color: color-mix(in srgb, var(--color-foreground), transparent 75%);
      font-size: 0.875rem;
      position: relative;
      z-index: 1;
    }
  }

  &__verification-options {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
    margin-top: var(--space-s);
    padding: var(--space-s);
    background: color-mix(in srgb, var(--color-primary), transparent 95%);
    border-radius: var(--border-radius-s);
    border-left: 3px solid var(--color-primary);
  }

  &__option {
    margin: 0;
    font-size: 0.875em;

    strong {
      color: var(--color-primary);
    }
  }

  &__sso-button {
    margin-bottom: var(--space-s);
  }
}
</style>
