<template>
  <TAppLayout
    :title="t('parentMode.resetPincode')"
    :show-header="true"
    app-name="tiko"
  >
    <div :class="bemm('container')">
      <div :class="bemm('content')">
        <div :class="bemm('card')">
          <h1 :class="bemm('title')">{{ t('parentMode.resetPincode') }}</h1>
          <p :class="bemm('description')">
            {{ t('parentMode.resetPincodeDescription') }}
          </p>

          <form :class="bemm('form')" @submit.prevent="handleResetPincode">
            <!-- Current Pincode -->
            <div :class="bemm('field')">
              <label :class="bemm('label')" for="current-pin">
                {{ t('parentMode.currentPincode') }}
              </label>
              <TPinInput
                v-model="currentPin"
                :length="4"
                :auto-focus="true"
                :class="bemm('input')"
                @complete="handleCurrentPinComplete"
              />
              <p v-if="currentPinError" :class="bemm('error')">
                {{ currentPinError }}
              </p>
            </div>

            <!-- New Pincode -->
            <div v-if="currentPinVerified" :class="bemm('field')">
              <label :class="bemm('label')" for="new-pin">
                {{ t('parentMode.newPincode') }}
              </label>
              <TPinInput
                v-model="newPin"
                :length="4"
                :auto-focus="currentPinVerified"
                :class="bemm('input')"
                @complete="handleNewPinComplete"
              />
              <p v-if="newPinError" :class="bemm('error')">
                {{ newPinError }}
              </p>
            </div>

            <!-- Confirm New Pincode -->
            <div v-if="currentPinVerified && newPin.length === 4" :class="bemm('field')">
              <label :class="bemm('label')" for="confirm-pin">
                {{ t('parentMode.confirmNewPincode') }}
              </label>
              <TPinInput
                v-model="confirmPin"
                :length="4"
                :auto-focus="newPin.length === 4"
                :class="bemm('input')"
                @complete="handleConfirmPinComplete"
              />
              <p v-if="confirmPinError" :class="bemm('error')">
                {{ confirmPinError }}
              </p>
            </div>

            <!-- Submit Button -->
            <div :class="bemm('actions')">
              <TButton
                type="outline"
                color="secondary"
                @click="handleCancel"
              >
                {{ t('common.cancel') }}
              </TButton>
              <TButton
                html-button-type="submit"
                color="primary"
                :loading="isSubmitting"
                :disabled="!canSubmit"
              >
                {{ t('parentMode.changePincode') }}
              </TButton>
            </div>
          </form>

          <!-- Forgot Pincode Help -->
          <div v-if="!user" :class="bemm('help')">
            <p :class="bemm('help-text')">
              {{ t('parentMode.forgotPincodeHelp') }}
            </p>
            <TButton
              type="text"
              color="primary"
              @click="handleLogin"
            >
              {{ t('auth.login') }}
            </TButton>
          </div>
        </div>
      </div>
    </div>
  </TAppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBemm } from 'bemm'
import { useRouter } from 'vue-router'
import { TAppLayout, TButton, TPinInput } from '@tiko/ui'
import { useI18n, useAuthStore, parentModeService } from '@tiko/core'
import { storeToRefs } from 'pinia'

const bemm = useBemm('reset-pincode')
const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

// Form state
const currentPin = ref('')
const newPin = ref('')
const confirmPin = ref('')
const currentPinVerified = ref(false)
const isSubmitting = ref(false)

// Error messages
const currentPinError = ref('')
const newPinError = ref('')
const confirmPinError = ref('')

// Computed
const canSubmit = computed(() => {
  return currentPinVerified.value &&
         newPin.value.length === 4 &&
         confirmPin.value.length === 4 &&
         newPin.value === confirmPin.value &&
         !isSubmitting.value
})

// Handle current PIN complete
const handleCurrentPinComplete = async () => {
  if (!user.value) {
    currentPinError.value = t('parentMode.pleaseLoginFirst')
    return
  }

  currentPinError.value = ''

  // Verify current PIN
  const result = await parentModeService.verifyPin(user.value.id, currentPin.value)

  if (result.success) {
    currentPinVerified.value = true
  } else {
    currentPinError.value = t('parentMode.incorrectPincode')
    currentPin.value = ''
  }
}

// Handle new PIN complete
const handleNewPinComplete = () => {
  newPinError.value = ''

  // Validate new PIN
  if (newPin.value.length !== 4 || !/^\d{4}$/.test(newPin.value)) {
    newPinError.value = t('parentMode.pincodeRequirements')
    return
  }

  if (newPin.value === currentPin.value) {
    newPinError.value = t('parentMode.newPincodeMustBeDifferent')
    return
  }
}

// Handle confirm PIN complete
const handleConfirmPinComplete = () => {
  confirmPinError.value = ''

  if (confirmPin.value !== newPin.value) {
    confirmPinError.value = t('parentMode.pincodesDoNotMatch')
  }
}

// Handle form submission
const handleResetPincode = async () => {
  if (!canSubmit.value || !user.value) return

  isSubmitting.value = true

  try {
    const result = await parentModeService.changePin(
      user.value.id,
      currentPin.value,
      newPin.value
    )

    if (result.success) {
      // Show success message
      alert(t('parentMode.pincodeChangedSuccessfully'))

      // Navigate back to dashboard
      await router.push('/')
    } else {
      // Show error
      confirmPinError.value = result.error || t('parentMode.failedToChangePincode')
    }
  } catch (error) {
    console.error('Failed to change pincode:', error)
    confirmPinError.value = t('parentMode.failedToChangePincode')
  } finally {
    isSubmitting.value = false
  }
}

// Handle cancel
const handleCancel = () => {
  router.push('/')
}

// Handle login
const handleLogin = () => {
  router.push('/auth/login')
}
</script>

<style lang="scss">
.reset-pincode {
  &__container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - var(--top-bar-height));
    padding: var(--space);
  }

  &__content {
    width: 100%;
    max-width: 500px;
  }

  &__card {
    background: var(--color-background);
    border-radius: var(--border-radius);
    padding: var(--space-xl);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  &__title {
    font-size: var(--font-size-xxl);
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0 0 var(--space-s) 0;
    text-align: center;
  }

  &__description {
    font-size: var(--font-size);
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-xl) 0;
    text-align: center;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-l);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
  }

  &__label {
    font-size: var(--font-size);
    font-weight: 500;
    color: var(--color-foreground);
  }

  &__input {
    // Pin code styling handled by TPinCode component
  }

  &__error {
    font-size: var(--font-size-sm);
    color: var(--color-error);
    margin: 0;
  }

  &__actions {
    display: flex;
    gap: var(--space);
    justify-content: flex-end;
    margin-top: var(--space);
  }

  &__help {
    margin-top: var(--space-xl);
    padding-top: var(--space-xl);
    border-top: 1px solid var(--color-accent);
    text-align: center;
  }

  &__help-text {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0 0 var(--space) 0;
  }
}
</style>
