<template>
  <div :class="bemm()" data-cy="login-form">
    <!-- Login Card -->
    <div :class="bemm('card')">
      <template v-if="currentStep === 'email'">
        <!-- Header -->
        <div :class="bemm('header')">
          <h4 :class="bemm('title')" data-cy="login-title">{{ t(keys.auth.loginToAccount) }}</h4>
        </div>
        <!-- Email Step -->
        <div :class="bemm('content')">
          <!-- Email Input -->
          <TForm @submit.prevent="handleEmailSubmit" data-cy="email-form">
            <TInputEmail
              v-model="email"
              type="email"
              :label="t(keys.auth.emailAddress)"
              :placeholder="t(keys.auth.enterEmail)"
              :disabled="isLoading"
              required
              :class="bemm('input')"
              data-cy="email-input"
            />

            <TButton
              :label="t(keys.auth.sendCode)"
              color="primary"
              size="large"
              @click="handleEmailSubmit"
              :disabled="!isEmailValid || isLoading"
              :loading="isLoading"
              :class="bemm('submit-button')"
              data-cy="submit-email-button"
              >{{ t(keys.auth.sendCode) }}</TButton
            >
          </TForm>

          <!-- Divider -->
          <div :class="bemm('divider')">
            <span :class="bemm('divider-text')">{{ t(keys.auth.or) }}</span>
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
            >{{ t(keys.auth.loginWithApple) }}</TButton
          >

          <!-- Register Link -->
          <div :class="bemm('register')">
            <span :class="bemm('register-text')">{{ t(keys.auth.dontHaveAccount) }}</span>
            <button
              type="button"
              :class="bemm('register-link')"
              @click="toggleMode"
              data-cy="toggle-register"
            >
              {{ t(keys.auth.register) }}
            </button>
          </div>
        </div>
      </template>

      <template v-else-if="currentStep === 'verification'">
        <!-- Verification Code Step -->
        <div :class="bemm('content')">
          <div :class="bemm('verification-info')" data-cy="verification-info">
            <TIcon name="mail" :class="bemm('verification-icon')" />
            <p :class="bemm('verification-text')" data-cy="verification-message">
              We've sent you an email with two options:<br />
              <strong data-cy="verification-email">{{ email }}</strong>
            </p>
            <div :class="bemm('verification-options')">
              <p :class="bemm('option')">
                {{ t(keys.auth.option1MagicLink) }}
              </p>
              <p :class="bemm('option')">
                {{ t(keys.auth.option2EnterCode, { codeLength }) }}
              </p>
            </div>
          </div>

          <TForm @submit.prevent="handleVerificationSubmit" data-cy="verification-form">
            <TInputText
              v-model="verificationCode"
              type="text"
              :label="t(keys.auth.verificationCode)"
              :placeholder="t(keys.auth.enterDigitCode, { codeLength })"
              :error="verificationError ? [verificationError] : undefined"
              :disabled="isLoading"
              :maxlength="codeLength"
              required
              :class="bemm('code-input')"
              data-cy="verification-code-input"
            />

            <TButton
              :label="t(keys.auth.verifyCode)"
              color="primary"
              size="large"
              @click="handleVerificationSubmit"
              :disabled="!isVerificationValid || isLoading"
              :loading="isLoading"
              :class="bemm('submit-button')"
              data-cy="verify-code-button"
              >{{ t(keys.auth.verifyCode) }}</TButton
            >
          </TForm>

          <!-- Actions -->
          <TButtonGroup :class="bemm('actions')">
            <TButton
              :class="bemm('action-link')"
              @click="handleResendCode"
              :disabled="isLoading || resendCooldown > 0"
              data-cy="resend-code-button"
            >
              {{
                resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : t(keys.auth.didntReceiveCode) + ' ' + t(keys.auth.resendCode)
              }}
            </TButton>

            <TButton
              :class="bemm('action-link')"
              @click="goBackToEmail"
              :disabled="isLoading"
              data-cy="back-to-email-button"
            >
              {{ t(keys.auth.useDifferentEmail) }}
            </TButton>
          </TButtonGroup>
        </div>
      </template>

      <!-- Register Step -->
      <template v-else-if="currentStep === 'register'">
        <div :class="bemm('header')">
          <h2 :class="bemm('title')" data-cy="register-title">{{ t(keys.auth.createAccount) }}</h2>
        </div>
        <div :class="bemm('content')">
          <TForm @submit.prevent="handleRegisterSubmit" data-cy="register-form">
            <TInputEmail
              v-model="email"
              type="email"
              :label="t(keys.auth.emailAddress)"
              :placeholder="t(keys.auth.enterEmail)"
              :disabled="isLoading"
              required
              :class="bemm('input')"
              data-cy="register-email-input"
            />

            <TInputText
              v-model="fullName"
              type="text"
              :label="t(keys.auth.fullNameOptional)"
              :placeholder="t(keys.auth.enterFullName)"
              :disabled="isLoading"
              :class="bemm('input')"
              data-cy="register-name-input"
            />

            <TButton
              :label="t(keys.auth.sendCode)"
              type="fancy"
              color="primary"
              size="large"
              @click="handleRegisterSubmit"
              :disabled="!isEmailValid || isLoading"
              :loading="isLoading"
              :class="bemm('submit-button')"
              data-cy="register-submit-button"
              >{{ t(keys.auth.sendCode) }}</TButton
            >
          </TForm>

          <!-- Back to Login -->
          <div :class="bemm('register')">
            <span :class="bemm('register-text')">{{ t(keys.auth.alreadyHaveAccount) }}</span>
            <button
              type="button"
              :class="bemm('register-link')"
              @click="toggleMode"
              data-cy="toggle-login"
            >
              {{ t(keys.auth.login) }}
            </button>
          </div>
        </div>
      </template>

      <!-- Error Message (shown for all steps) -->
      <div v-if="error" :class="bemm('error')" data-cy="error-message">
        <TIcon name="alert-circle" :class="bemm('error-icon')" />
        <p :class="bemm('error-message')">{{ error }}</p>
        <TButton
          :label="t(keys.auth.tryAgain)"
          type="ghost"
          color="secondary"
          size="small"
          @click="clearError"
          :class="bemm('error-button')"
          >{{ t(keys.auth.tryAgain) }}</TButton
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useBemm } from 'bemm';
import { useI18n } from '../../composables/useI18n';
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

// i18n
const { t, keys } = useI18n();

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
    emailError.value = t(keys.auth.pleaseEnterValidEmail);
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
    emailError.value = t(keys.auth.pleaseEnterValidEmail);
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
    verificationError.value = t(keys.auth.pleaseEnterValidCode, { codeLength });
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
