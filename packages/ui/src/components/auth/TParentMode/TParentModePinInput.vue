<template>
  <div :class="bemm()">
    <form :class="bemm('container')" @submit.prevent="handleSubmit">
      <!-- PIN Input -->
      <div :class="bemm('pin-container')">
        <TPinInput
          ref="pinInputRef"
          v-model="pinValue"
          :length="4"
          :show-value="showNumbers"
          :auto-focus="autoFocus && mode === 'unlock'"
          :auto-submit="mode === 'unlock'"
          :error="!!error"
          @complete="handlePinComplete"
        />
      </div>

      <!-- Number Pad -->
      <TNumberPad
        v-if="mode === 'unlock' || (mode === 'setup' && pinValue.length < 4)"
        :class="bemm('numpad')"
        :disable-clear="pinValue.length === 0"
        :disable-submit="!canSubmitPin"
        @number="handleNumberClick"
        @clear="handleClearClick"
        @submit="handleSubmit"
      />

      <!-- Confirmation PIN for setup mode -->
      <div
        v-if="mode === 'setup' && pinValue.length === 4"
        :class="bemm('confirm-section')"
      >
        <p :class="bemm('confirm-label')">
          {{ t('parentMode.confirmYourPin') || 'Confirm your PIN' }}
        </p>
        <div :class="bemm('pin-container')">
          <TPinInput
            ref="confirmInputRef"
            v-model="confirmValue"
            :length="4"
            :show-value="showNumbers"
            :auto-focus="true"
            :auto-submit="true"
            :error="!!error"
            @complete="handleConfirmComplete"
          />
        </div>

        <!-- Number Pad for Confirm -->
        <TNumberPad
          v-if="confirmValue.length < 4"
          :class="bemm('numpad')"
          :disable-clear="confirmValue.length === 0"
          :disable-submit="!canSubmit"
          @number="handleConfirmNumberClick"
          @clear="handleConfirmClearClick"
          @submit="handleSubmit"
        />
      </div>

      <!-- Toggle number visibility -->
      <div :class="bemm('options')">
        <TButton
          type="outline"
          :icon="showNumbers ? Icons.EYE_SLASH : Icons.EYE"
          @click="toggleNumberVisibility"
        >
          {{
            showNumbers
              ? t('parentMode.hideNumbers') || 'Hide numbers'
              : t('parentMode.showNumbers') || 'Show numbers'
          }}
        </TButton>
      </div>

      <!-- Actions -->
      <div :class="[bemm('actions'), 'popup-footer']">
        <TButtonGroup
          :class="bemm('button-group')"
          :buttons="[
            {
              label: t(keys.common.cancel),
              type: 'ghost',
              action: handleClosePopup,
            },
            {
              label: submitLabel,
              type: 'primary',
              action: handleSubmit,
              disabled: !canSubmit,
              loading: isProcessing,
            },
          ]"
        >
          <TButton type="outline" @click="handleClosePopup">
            {{ t(keys.common.cancel) }}
          </TButton>

          <TButton
            html-button-type="submit"
            color="primary"
            :disabled="!canSubmit"
            :loading="isProcessing"
          >
            {{ submitLabel }}
          </TButton>
        </TButtonGroup>
      </div>

      <!-- Error message -->
      <div v-if="error" :class="bemm('error')">
        {{ error }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { useBemm } from 'bemm';
import { useI18n } from '@tiko/core';
import TButton from '../../ui-elements/TButton/TButton.vue';
import TIcon from '../../ui-elements/TIcon/TIcon.vue';
import TPinInput from '../../forms/TPinInput/TPinInput.vue';
import TNumberPad from '../../forms/TNumberPad/TNumberPad.vue';
import type { ParentModePinInputProps } from '../../../composables/useParentMode.model';
import { Icons } from 'open-icon';
import TButtonGroup from '../../ui-elements/TButton/TButtonGroup.vue';

interface ExtendedProps extends ParentModePinInputProps {
  onPinEntered?: (pin: string) => void;
  onClose?: () => void;
}

const props = withDefaults(defineProps<ExtendedProps>(), {
  showConfirmation: true,
  autoFocus: true,
  title: '',
  description: '',
});

const emit = defineEmits<{
  'pin-entered': [pin: string];
  close: [];
}>();

const bemm = useBemm('parent-mode-pin-input');
const { t, keys } = useI18n();

// Refs
const pinInputRef = ref<InstanceType<typeof TPinInput> | null>(null);
const confirmInputRef = ref<InstanceType<typeof TPinInput> | null>(null);

// Local state
const pinValue = ref('');
const confirmValue = ref('');
const showNumbers = ref(false);
const isProcessing = ref(false);
const error = ref('');

// Computed properties
const canSubmitPin = computed(() => {
  return pinValue.value.length === 4 && /^\d{4}$/.test(pinValue.value);
});

const canSubmit = computed(() => {
  if (props.mode === 'unlock') {
    return canSubmitPin.value;
  } else {
    return (
      pinValue.value.length === 4 &&
      confirmValue.value.length === 4 &&
      pinValue.value === confirmValue.value &&
      /^\d{4}$/.test(pinValue.value)
    );
  }
});

const submitLabel = computed(() => {
  return props.mode === 'setup'
    ? t('parentMode.setPin') || 'Set PIN'
    : t('parentMode.unlock') || 'Unlock';
});

/**
 * Handle PIN complete
 */
const handlePinComplete = (value: string) => {
  if (props.mode === 'unlock') {
    handleSubmit();
  } else if (props.mode === 'setup') {
    nextTick(() => {
      confirmInputRef.value?.focus();
    });
  }
};

/**
 * Handle confirm PIN complete
 */
const handleConfirmComplete = (value: string) => {
  if (value === pinValue.value) {
    handleSubmit();
  }
};

/**
 * Handle form submission
 */
const handleSubmit = async () => {
  if (!canSubmit.value || isProcessing.value) return;

  // Submitting PIN

  isProcessing.value = true;
  error.value = '';

  try {
    // Validate PIN format
    if (!/^\d{4}$/.test(pinValue.value)) {
      error.value = t('parentMode.pinMustBe4Digits') || 'PIN must be 4 digits';
      isProcessing.value = false;
      return;
    }

    // For setup mode, ensure PINs match
    if (props.mode === 'setup' && pinValue.value !== confirmValue.value) {
      error.value = t('parentMode.pinMismatch') || 'PINs do not match';
      isProcessing.value = false;
      return;
    }

    // PIN validation passed

    // Emit event for v-model usage
    emit('pin-entered', pinValue.value);

    // Call callback prop for popup service usage
    if (props.onPinEntered) {
      // Call onPinEntered callback
      await props.onPinEntered(pinValue.value);
    }
  } catch (err) {
    error.value = t(`common.errorLabel`);
    console.error('PIN input error:', err);
  } finally {
    isProcessing.value = false;
  }
};

/**
 * Toggle number visibility
 */
const toggleNumberVisibility = () => {
  showNumbers.value = !showNumbers.value;
};

/**
 * Handle number pad click for PIN
 */
const handleNumberClick = (num: string) => {
  if (pinValue.value.length < 4) {
    pinValue.value += num;
    error.value = '';
  }
};

/**
 * Handle clear button click for PIN
 */
const handleClearClick = () => {
  if (pinValue.value.length > 0) {
    pinValue.value = pinValue.value.slice(0, -1);
    error.value = '';
  }
};

/**
 * Handle number pad click for confirm PIN
 */
const handleConfirmNumberClick = (num: string) => {
  if (confirmValue.value.length < 4) {
    confirmValue.value += num;
    error.value = '';
  }
};

/**
 * Handle clear button click for confirm PIN
 */
const handleConfirmClearClick = () => {
  if (confirmValue.value.length > 0) {
    confirmValue.value = confirmValue.value.slice(0, -1);
    error.value = '';
  }
};

/**
 * Reset form
 */
const reset = () => {
  pinValue.value = '';
  confirmValue.value = '';
  error.value = '';
  isProcessing.value = false;
};

/**
 * Handle popup close
 */
const handleClosePopup = () => {
  emit('close');
  if (props.onClose) {
    props.onClose();
  }
};

// Component is ready

// Watch for mode changes to reset form
watch(
  () => props.mode,
  () => {
    reset();
  },
);
</script>

<style lang="scss" scoped>
.parent-mode-pin-input {
  display: flex;
  flex-direction: column;
  gap: var(--space);
  max-width: 400px;
  margin: 0 auto;

  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-s, 0.75em);
    text-align: center;
  }

  &__icon {
    font-size: 2em;
    color: var(--color-primary);
  }

  &__title {
    font-size: 1.25em;
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0;
  }

  &__description {
    font-size: 0.925em;
    color: color-mix(in srgb, var(--color-foreground), transparent 20%);
    line-height: 1.5;
    margin: 0;
  }

  &__container {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__pin-container {
    display: flex;
    justify-content: center;
    margin-bottom: var(--space);
  }

  &__confirm-section {
    margin-top: var(--space-md, 1em);
  }

  &__confirm-label {
    text-align: center;
    font-size: 0.925em;
    color: color-mix(in srgb, var(--color-foreground), transparent 20%);
    margin: 0 0 var(--space-s, 0.75em) 0;
  }

  &__actions {
    display: flex;
    gap: var(--space-s, 0.75em);
    justify-content: center;
  }

  &__options {
    display: flex;
    justify-content: center;
  }

  &__error {
    padding: var(--space-s, 0.75em);
    background: color-mix(in srgb, var(--color-error), transparent 90%);
    border: 1px solid color-mix(in srgb, var(--color-error), transparent 70%);
    border-radius: var(--border-radius, 0.25em);
    color: color-mix(in srgb, var(--color-error), var(--color-foreground) 20%);
    font-size: 0.875em;
    text-align: center;
  }

  &__numpad {
    margin: 0 auto var(--space);
  }
}

// Mobile responsiveness
@media (max-width: 480px) {
  .parent-mode-pin-input {
    &__actions {
      flex-direction: column;
    }
  }
}
</style>
