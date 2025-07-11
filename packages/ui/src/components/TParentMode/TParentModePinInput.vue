<template>
  <div :class="bemm()">
      <form @submit.prevent="handleSubmit">
        <div :class="bemm('pin-container')">
          <!-- PIN Input Dots -->
          <div :class="bemm('pin-display')">
            <div
              v-for="(_, index) in 4"
              :key="index"
              :class="bemm('pin-dot', { filled: index < pinValue.length, active: index === pinValue.length })"
            >
              <span v-if="showNumbers && pinValue[index]">{{ pinValue[index] }}</span>
            </div>
          </div>

          <!-- Hidden input for actual value -->
          <input
            ref="pinInput"
            v-model="pinValue"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="4"
            :class="bemm('pin-input')"
            @input="handleInput"
            @keydown="handleKeydown"
            autofocus
          />
        </div>

        <!-- Number Pad -->
        <div v-if="mode === 'unlock' || (mode === 'setup' && pinValue.length < 4)" :class="bemm('numpad')">
          <button
            v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
            :key="num"
            type="button"
            :class="bemm('numpad-button')"
            @click="handleNumberClick(num.toString())"
          >
            {{ num }}
          </button>

          <button
            type="button"
            :class="bemm('numpad-button', ['','clear'])"
            @click="handleClearClick"
            :disabled="(confirmValue ? confirmValue : pinValue).length === 0"
          >
            <TIcon name="arrow-left" />
          </button>

          <button
            type="button"
            :class="bemm('numpad-button')"
            @click="handleNumberClick('0')"
          >
            0
          </button>

          <button
            type="button"
            :class="bemm('numpad-button', ['','submit'])"
            @click="handleSubmit"
            :disabled="!canSubmit"
          >
            <TIcon name="check" />
          </button>
        </div>

        <!-- Confirmation PIN for setup mode -->
        <div v-if="mode === 'setup' && pinValue.length === 4" :class="bemm('confirm-section')">
          <p :class="bemm('confirm-label')">Confirm your PIN</p>
          <div :class="bemm('pin-container')">
            <div :class="bemm('pin-display')">
              <div
                v-for="(_, index) in 4"
                :key="'confirm-' + index"
                :class="bemm('pin-dot', { filled: index < confirmValue.length, active: index === confirmValue.length })"
              >
                <span v-if="showNumbers && confirmValue[index]">{{ confirmValue[index] }}</span>
              </div>
            </div>

            <input
              ref="confirmInput"
              v-model="confirmValue"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="4"
              :class="bemm('pin-input')"
              @input="handleConfirmInput"
              @keydown="handleConfirmKeydown"
            />
          </div>

          <!-- Number Pad for Confirm -->
          <div v-if="mode === 'setup' && pinValue.length === 4 && confirmValue.length < 4" :class="bemm('numpad')">
            <button
              v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
              :key="`confirm-${num}`"
              type="button"
              :class="bemm('numpad-button')"
              @click="handleNumberClick(num.toString())"
            >
              {{ num }}
            </button>

            <button
              type="button"
              :class="bemm('numpad-button', 'clear')"
              @click="handleClearClick"
              :disabled="confirmValue.length === 0"
            >
              <TIcon name="arrow-left" />
            </button>

            <button
              type="button"
              :class="bemm('numpad-button')"
              @click="handleNumberClick('0')"
            >
              0
            </button>

            <button
              type="button"
              :class="bemm('numpad-button', 'submit')"
              @click="handleSubmit"
              :disabled="!canSubmit"
            >
              <TIcon name="check" />
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div :class="bemm('actions')">
          <TButton
            type="ghost"
            color="secondary"
            @click="handleClosePopup"
          >
            Cancel
          </TButton>

          <TButton
            type="submit"
            color="primary"
            :disabled="!canSubmit"
            :loading="isProcessing"
          >
            {{ submitLabel }}
          </TButton>
        </div>

        <!-- Toggle number visibility -->
        <div :class="bemm('options')">
          <TButton
            type="ghost"
            size="small"
            :icon="showNumbers ? 'eye-off' : 'eye'"
            @click="toggleNumberVisibility"
          >
            {{ showNumbers ? 'Hide' : 'Show' }} Numbers
          </TButton>
        </div>

        <!-- Error message -->
        <div v-if="error" :class="bemm('error')">
          {{ error }}
        </div>
      </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useBemm } from 'bemm'
import TButton from '../TButton/TButton.vue'
import TIcon from '../TIcon/TIcon.vue'
import type { ParentModePinInputProps } from '../../composables/useParentMode.model'

interface ExtendedProps extends ParentModePinInputProps {
  onPinEntered?: (pin: string) => void
  onClose?: () => void
}

const props = withDefaults(defineProps<ExtendedProps>(), {
  showConfirmation: true,
  autoFocus: true,
  title: '',
  description: ''
})

const emit = defineEmits<{
  'pin-entered': [pin: string]
  'close': []
}>()

const bemm = useBemm('parent-mode-pin-input')

// Refs
const pinInput = ref<HTMLInputElement | null>(null)
const confirmInput = ref<HTMLInputElement | null>(null)

// Local state
const pinValue = ref('')
const confirmValue = ref('')
const showNumbers = ref(false)
const isProcessing = ref(false)
const error = ref('')

// Computed properties
const canSubmit = computed(() => {
  if (props.mode === 'unlock') {
    return pinValue.value.length === 4 && /^\d{4}$/.test(pinValue.value)
  } else {
    return pinValue.value.length === 4 &&
           confirmValue.value.length === 4 &&
           pinValue.value === confirmValue.value &&
           /^\d{4}$/.test(pinValue.value)
  }
})

const submitLabel = computed(() => {
  return props.mode === 'setup' ? 'Set PIN' : 'Unlock'
})

/**
 * Handle PIN input
 */
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value.replace(/\D/g, '') // Only allow digits

  if (value.length <= 4) {
    pinValue.value = value
    error.value = ''

    // Auto-submit for unlock mode when 4 digits entered
    if (props.mode === 'unlock' && value.length === 4) {
      handleSubmit()
    }

    // Focus confirm input for setup mode
    if (props.mode === 'setup' && value.length === 4) {
      nextTick(() => {
        confirmInput.value?.focus()
      })
    }
  }
}

/**
 * Handle confirmation input
 */
const handleConfirmInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value.replace(/\D/g, '') // Only allow digits

  if (value.length <= 4) {
    confirmValue.value = value
    error.value = ''

    // Auto-submit when both PINs match and are 4 digits
    if (value.length === 4 && value === pinValue.value) {
      handleSubmit()
    }
  }
}

/**
 * Handle keydown events
 */
const handleKeydown = (event: KeyboardEvent) => {
  // Allow backspace, delete, tab, escape, enter
  if ([8, 9, 27, 13, 46].includes(event.keyCode)) {
    return
  }

  // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
  if (event.ctrlKey === true && [65, 67, 86, 88].includes(event.keyCode)) {
    return
  }

  // Ensure that it is a number and stop the keypress
  if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) &&
      (event.keyCode < 96 || event.keyCode > 105)) {
    event.preventDefault()
  }
}

/**
 * Handle confirm keydown events
 */
const handleConfirmKeydown = (event: KeyboardEvent) => {
  handleKeydown(event)
}

/**
 * Handle form submission
 */
const handleSubmit = async () => {
  if (!canSubmit.value || isProcessing.value) return

  isProcessing.value = true
  error.value = ''

  try {
    // Validate PIN format
    if (!/^\d{4}$/.test(pinValue.value)) {
      error.value = 'PIN must be exactly 4 digits'
      return
    }

    // For setup mode, ensure PINs match
    if (props.mode === 'setup' && pinValue.value !== confirmValue.value) {
      error.value = 'PINs do not match'
      return
    }

    // Emit event for v-model usage
    emit('pin-entered', pinValue.value)

    // Call callback prop for popup service usage
    if (props.onPinEntered) {
      props.onPinEntered(pinValue.value)
    }
  } catch (err) {
    error.value = 'An error occurred. Please try again.'
    console.error('PIN input error:', err)
  } finally {
    isProcessing.value = false
  }
}

/**
 * Toggle number visibility
 */
const toggleNumberVisibility = () => {
  showNumbers.value = !showNumbers.value
}

/**
 * Handle number pad click
 */
const handleNumberClick = (num: string) => {
  // Determine which field is active
  if (props.mode === 'setup' && pinValue.value.length === 4 && confirmValue.value.length < 4) {
    // Add to confirm field
    confirmValue.value += num
    if (confirmValue.value.length === 4 && confirmValue.value === pinValue.value) {
      handleSubmit()
    }
  } else if (pinValue.value.length < 4) {
    // Add to pin field
    pinValue.value += num
    if (props.mode === 'unlock' && pinValue.value.length === 4) {
      handleSubmit()
    } else if (props.mode === 'setup' && pinValue.value.length === 4) {
      nextTick(() => {
        confirmInput.value?.focus()
      })
    }
  }
}

/**
 * Handle clear button click
 */
const handleClearClick = () => {
  // Determine which field to clear from
  if (props.mode === 'setup' && pinValue.value.length === 4 && confirmValue.value.length > 0) {
    confirmValue.value = confirmValue.value.slice(0, -1)
  } else if (pinValue.value.length > 0) {
    pinValue.value = pinValue.value.slice(0, -1)
  }
}

/**
 * Reset form
 */
const reset = () => {
  pinValue.value = ''
  confirmValue.value = ''
  error.value = ''
  isProcessing.value = false
}

/**
 * Handle popup close
 */
const handleClosePopup = () => {
  emit('close')
  if (props.onClose) {
    props.onClose()
  }
}

// Watch for mode changes to reset form
watch(() => props.mode, () => {
  reset()
})

// Auto-focus on mount
watch(pinInput, (input) => {
  if (input && props.autoFocus) {
    nextTick(() => {
      input.focus()
    })
  }
})
</script>

<style lang="scss" scoped>
.parent-mode-pin-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg, 1.5em);
  padding: var(--space-lg, 1.5em);
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

  &__pin-container {
    position: relative;
    display: flex;
    justify-content: center;
    margin-bottom: var(--space-md, 1em);
  }

  &__pin-display {
    display: flex;
    gap: var(--space-s, 0.75em);
  }

  &__pin-dot {
    width: 3em;
    height: 3em;
    border: 2px solid color-mix(in srgb, var(--color-foreground), transparent 70%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125em;
    font-weight: 600;
    transition: all 0.2s ease;
    background: var(--color-background);

    &--filled {
      border-color: var(--color-primary);
      background: color-mix(in srgb, var(--color-primary), transparent 90%);
      color: var(--color-primary);

      &:not(:has(span)) {
        &::after {
          content: '•';
          font-size: 1.5em;
        }
      }
    }

    &--active {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary), transparent 80%);
    }
  }

  &__pin-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    pointer-events: none;
    border: none;
    outline: none;
    background: transparent;
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
    border-radius: var(--radius-sm, 0.25em);
    color: color-mix(in srgb, var(--color-error), var(--color-foreground) 20%);
    font-size: 0.875em;
    text-align: center;
  }

  &__numpad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-s);
    max-width: 300px;
    margin: 0 auto var(--space);
  }

  &__numpad-button {
    aspect-ratio: 1;
    min-height: 3.5em;
    border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 80%);
    border-radius: var(--border-radius);
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-size: 1.25rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover:not(:disabled) {
      background-color: var(--color-primary);
      border-color: var(--color-primary);
      color: var(--color-primary-text);
      transform: scale(1.05);
    }

    &:active:not(:disabled) {
      transform: scale(0.95);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &--clear {
      background-color: var(--color-background-secondary);
    }

    &--submit {
      background-color: var(--color-success);
      border-color: var(--color-success);
      color: var(--color-success-text);

      &:hover:not(:disabled) {
        background-color: var(--color-success);
        opacity: 0.9;
      }
    }

    .icon{
      font-size: 2em;
    }
  }
}

// Mobile responsiveness
@media (max-width: 480px) {
  .parent-mode-pin-input {
    padding: var(--space-md, 1em);

    &__pin-dot {
      width: 2.5em;
      height: 2.5em;
      font-size: 1em;
    }

    &__actions {
      flex-direction: column;
    }
  }
}
</style>
