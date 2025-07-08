<template>
  <div :class="bemm()">
    <!-- Parent Mode Status Indicator -->
    <div v-if="showVisualIndicator" :class="bemm('indicator')">
      <TIcon name="shield-check" :class="bemm('indicator-icon')" />
      <span :class="bemm('indicator-text')">Parent Mode Active</span>
    </div>

    <!-- Parent Mode Toggle Button -->
    <TButton
      :type="isUnlocked ? 'default' : 'ghost'"
      :color="isUnlocked ? 'success' : 'secondary'"
      :size="size"
      :icon="isUnlocked ? 'unlock' : 'lock'"
      :class="bemm('toggle')"
      @click="handleToggleClick"
    >
      {{ toggleLabel }}
    </TButton>

    <!-- PIN Input Modal -->
    <TParentModePinInput
      v-if="showPinInput"
      :mode="pinInputMode"
      :title="pinInputTitle"
      :description="pinInputDescription"
      @pin-entered="handlePinEntered"
      @close="closePinInput"
    />

    <!-- Setup Modal for First Time Users -->
    <TPopup
      v-if="showSetupModal"
      :show="showSetupModal"
      @close="closeSetupModal"
      :closable="false"
    >
      <div :class="bemm('setup')">
        <h2 :class="bemm('setup-title')">Set Up Parent Mode</h2>
        <p :class="bemm('setup-description')">
          Create a 4-digit PIN to protect parental controls.
          This PIN will be required to access settings and manage content.
        </p>

        <form @submit.prevent="handleSetupSubmit">
          <TInput
            v-model="setupPin"
            type="password"
            label="Create 4-digit PIN"
            placeholder="Enter 4 digits"
            maxlength="4"
            pattern="[0-9]{4}"
            required
            :class="bemm('setup-input')"
          />

          <TInput
            v-model="confirmPin"
            type="password"
            label="Confirm PIN"
            placeholder="Enter 4 digits again"
            maxlength="4"
            pattern="[0-9]{4}"
            required
            :class="bemm('setup-input')"
          />

          <div :class="bemm('setup-actions')">
            <TButton
              type="ghost"
              color="secondary"
              @click="closeSetupModal"
            >
              Cancel
            </TButton>

            <TButton
              type="submit"
              color="primary"
              :loading="isSettingUp"
              :disabled="!canSubmitSetup"
            >
              Enable Parent Mode
            </TButton>
          </div>
        </form>

        <div v-if="setupError" :class="bemm('setup-error')">
          {{ setupError }}
        </div>
      </div>
    </TPopup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBemm } from 'bemm'
import { useParentMode } from '../../composables/useParentMode'
import { useEventBus } from '../../composables/useEventBus'
import TButton from '../TButton/TButton.vue'
import TIcon from '../TIcon/TIcon.vue'
import TInput from '../TInput/TInput.vue'
import TPopup from '../TPopup/TPopup.vue'
import TParentModePinInput from './TParentModePinInput.vue'
import type { ParentModeToggleProps } from '../../composables/useParentMode.model'

const props = withDefaults(defineProps<ParentModeToggleProps>(), {
  requiredPermission: '',
  showLockIcon: true,
  label: '',
  size: 'medium'
})

const emit = defineEmits<{
  'mode-changed': [isUnlocked: boolean]
  'permission-denied': [permission: string]
}>()

const bemm = useBemm('parent-mode-toggle')
const parentMode = useParentMode(props.appName)
const eventBus = useEventBus()

// Local state
const showPinInput = ref(false)
const pinInputMode = ref<'setup' | 'unlock'>('unlock')
const showSetupModal = ref(false)
const setupPin = ref('')
const confirmPin = ref('')
const isSettingUp = ref(false)
const setupError = ref('')

// Computed properties
const isUnlocked = computed(() => parentMode.canManageContent.value)
const showVisualIndicator = computed(() => parentMode.showVisualIndicator.value)

const toggleLabel = computed(() => {
  if (props.label) return props.label
  return isUnlocked.value ? 'Parent Mode' : 'Enable Parent Mode'
})

const pinInputTitle = computed(() => {
  return pinInputMode.value === 'setup' ? 'Set Up Parent Mode' : 'Enter Parent PIN'
})

const pinInputDescription = computed(() => {
  return pinInputMode.value === 'setup'
    ? 'Create a 4-digit PIN to protect parental controls'
    : 'Enter your 4-digit PIN to access parent controls'
})

const canSubmitSetup = computed(() => {
  return setupPin.value.length === 4 &&
         confirmPin.value.length === 4 &&
         setupPin.value === confirmPin.value &&
         /^\d{4}$/.test(setupPin.value)
})

/**
 * Handle toggle button click
 */
const handleToggleClick = async () => {
  // If parent mode is not enabled, show setup
  if (!parentMode.isEnabled.value) {
    showSetupModal.value = true
    return
  }

  // If already unlocked, lock it
  if (isUnlocked.value) {
    parentMode.lock()
    emit('mode-changed', false)
    eventBus.emit('notification:show', {
      message: 'Parent mode locked',
      type: 'info'
    })
    return
  }

  // Check if user has required permission
  if (props.requiredPermission && !parentMode.hasPermission(props.appName, props.requiredPermission)) {
    emit('permission-denied', props.requiredPermission)
    eventBus.emit('notification:show', {
      message: 'Insufficient permissions for this action',
      type: 'warning'
    })
    return
  }

  // Show PIN input to unlock
  pinInputMode.value = 'unlock'
  showPinInput.value = true
}

/**
 * Handle PIN entered from PIN input component
 */
const handlePinEntered = async (pin: string) => {
  if (pinInputMode.value === 'unlock') {
    const result = await parentMode.unlock(pin)

    if (result.success) {
      showPinInput.value = false
      emit('mode-changed', true)
      eventBus.emit('notification:show', {
        message: 'Parent mode unlocked',
        type: 'success'
      })
    } else {
      eventBus.emit('notification:show', {
        message: result.error || 'Incorrect PIN',
        type: 'error'
      })
    }
  }
}

/**
 * Handle setup form submission
 */
const handleSetupSubmit = async () => {
  if (!canSubmitSetup.value) return

  isSettingUp.value = true
  setupError.value = ''

  try {
    const result = await parentMode.enable(setupPin.value)

    if (result.success) {
      showSetupModal.value = false
      resetSetupForm()

      // Auto-unlock after setup
      await parentMode.unlock(setupPin.value)
      emit('mode-changed', true)

      eventBus.emit('notification:show', {
        message: 'Parent mode enabled successfully',
        type: 'success'
      })
    } else {
      setupError.value = result.error || 'Failed to enable parent mode'
    }
  } catch (error) {
    setupError.value = 'An unexpected error occurred'
    console.error('Parent mode setup error:', error)
  } finally {
    isSettingUp.value = false
  }
}

/**
 * Close PIN input modal
 */
const closePinInput = () => {
  showPinInput.value = false
}

/**
 * Close setup modal
 */
const closeSetupModal = () => {
  showSetupModal.value = false
  resetSetupForm()
}

/**
 * Reset setup form
 */
const resetSetupForm = () => {
  setupPin.value = ''
  confirmPin.value = ''
  setupError.value = ''
  isSettingUp.value = false
}

// Watch for parent mode changes
watch(() => parentMode.canManageContent.value, (isUnlocked) => {
  if (!isUnlocked && showPinInput.value) {
    showPinInput.value = false
  }
})
</script>

<style lang="scss" scoped>
.parent-mode-toggle {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs, 0.5em);

  &__indicator {
    display: flex;
    align-items: center;
    gap: var(--space-xs, 0.5em);
    padding: var(--space-xs, 0.5em) var(--space-s, 0.75em);
    background: color-mix(in srgb, var(--color-success), transparent 90%);
    border: 1px solid color-mix(in srgb, var(--color-success), transparent 70%);
    border-radius: var(--radius-sm, 0.25em);
    font-size: 0.875em;
    color: color-mix(in srgb, var(--color-success), var(--color-foreground) 20%);
  }

  &__indicator-icon {
    color: var(--color-success);
  }

  &__indicator-text {
    font-weight: 500;
  }

  &__setup {
    display: flex;
    flex-direction: column;
    gap: var(--space-md, 1em);
    padding: var(--space-lg, 1.5em);
    max-width: 400px;
  }

  &__setup-title {
    font-size: 1.25em;
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0;
    text-align: center;
  }

  &__setup-description {
    font-size: 0.925em;
    color: color-mix(in srgb, var(--color-foreground), transparent 20%);
    line-height: 1.5;
    margin: 0;
    text-align: center;
  }

  &__setup-input {
    margin-bottom: var(--space-s, 0.75em);
  }

  &__setup-actions {
    display: flex;
    gap: var(--space-s, 0.75em);
    justify-content: flex-end;
  }

  &__setup-error {
    padding: var(--space-s, 0.75em);
    background: color-mix(in srgb, var(--color-error), transparent 90%);
    border: 1px solid color-mix(in srgb, var(--color-error), transparent 70%);
    border-radius: var(--radius-sm, 0.25em);
    color: color-mix(in srgb, var(--color-error), var(--color-foreground) 20%);
    font-size: 0.875em;
    text-align: center;
  }
}
</style>
