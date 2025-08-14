<template>
  <TButton
    :type="isUnlocked ? 'default' : 'ghost'"
    :color="isUnlocked ? 'success' : 'secondary'"
    :size="size"
    :icon="isUnlocked ? 'lock-open' : 'lock'"
    :class="[bemm(), { [bemm('--active')]: isUnlocked }]"
    @click="handleToggleClick"
  >
    {{ toggleLabel }}
  </TButton>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { useI18n } from '../../../composables/useI18n'
import { useParentMode } from '../../../composables/useParentMode'
import { toastService as defaultToastService } from '../../feedback/TToast/TToast.service'
import type { ToastSettings } from '../../feedback/TToast/TToast.model'
import TButton from '../../ui-elements/TButton/TButton.vue'
import TParentModePinInput from './TParentModePinInput.vue'
import ConfirmDialog from '../../feedback/TPopup/components/ConfirmDialog.vue'
import type { ParentModeToggleProps } from '../../../composables/useParentMode.model'
import { popupService } from '../../feedback/TPopup/TPopup.service'

interface ExtendedProps extends ParentModeToggleProps {
  popupService?: any // Accept popup service instance from parent
  toastService?: any // Accept toast service instance from parent
}

const props = withDefaults(defineProps<ExtendedProps>(), {
  requiredPermission: '',
  showLockIcon: true,
  label: '',
  size: 'medium'
})

const emit = defineEmits<{
  'mode-changed': [isUnlocked: boolean]
  'permission-denied': [permission: string]
  'show-pin-input': [mode: 'setup' | 'unlock', onPinEntered: (pin: string) => void]
}>()

const bemm = useBemm('parent-mode-toggle')
const { t, keys } = useI18n()
const parentMode = useParentMode(props.appName)

// Local state
const showPinInput = ref(false)
const pinInputMode = ref<'setup' | 'unlock'>('unlock')

// Use provided services or defaults
const toast = computed(() => props.toastService || defaultToastService)

// Computed properties
const isUnlocked = computed(() => parentMode.canManageContent.value)

const toggleLabel = computed(() => {
  if (props.label) return props.label
  return isUnlocked.value ? t(keys.parentMode.title) : t(keys.parentMode.enableParentMode)
})

const pinInputTitle = computed(() => {
  return pinInputMode.value === 'setup' ? t(keys.parentMode.setUpParentMode) : t(keys.parentMode.enterParentPin)
})

const pinInputDescription = computed(() => {
  return pinInputMode.value === 'setup'
    ? t(keys.parentMode.createPinDescription)
    : t(keys.parentMode.enterPinDescription)
})


/**
 * Handle toggle button click
 */
const handleToggleClick = async () => {
  console.log('Parent mode toggle clicked', {
    isEnabled: parentMode.isEnabled.value,
    isUnlocked: parentMode.isUnlocked.value,
    canManageContent: parentMode.canManageContent.value,
    popupService: props.popupService
  })

  // If parent mode is not enabled, show setup
  if (!parentMode.isEnabled.value) {
    console.log('Going to setup flow - parent mode not enabled')
    if (props.popupService) {
      // Use popup service for setup modal
      console.log('Showing setup modal via popup service')
      props.popupService.open({
        component: TParentModePinInput,
        title: t(keys.parentMode.setUpParentMode),
        description: t(keys.parentMode.createPinDescription),
        props: {
          mode: 'setup',
          onPinEntered: async (pin: string) => {
            console.log('PIN entered for setup:', pin)
            const result = await parentMode.enable(pin)
            console.log('Enable result:', result)
            console.log('Parent mode state after enable:', {
              isEnabled: parentMode.isEnabled.value,
              isUnlocked: parentMode.isUnlocked.value,
              canManageContent: parentMode.canManageContent.value
            })
            if (result.success) {
              props.popupService.close()
              // Parent mode is now automatically unlocked after setup
              emit('mode-changed', true)
              toast.value.show({
                message: t(keys.parentMode.parentModeEnabled),
                type: 'success'
              })
              // Force re-initialization to ensure state is synced
              await parentMode.initialize()
            } else {
              toast.value.show({
                message: result.error || t(keys.parentMode.failedToEnable),
                type: 'error'
              })
            }
          },
          onClose: () => props.popupService.close()
        }
      })
    }
    return
  }

  // If already unlocked, show confirmation to disable parent mode
  if (isUnlocked.value) {
    console.log('Going to disable flow - parent mode is unlocked')

    // Show confirmation dialog
    if (props.popupService) {
      props.popupService.open({
        component: ConfirmDialog,
        title: t(keys.parentMode.disableParentMode),
        props: {
          title: t(keys.parentMode.disableParentMode),
          message: t(keys.parentMode.disableConfirmMessage),
          icon: 'shield-off',
          confirmLabel: t(keys.parentMode.yesDisable),
          cancelLabel: t(keys.common.cancel),
          confirmColor: 'warning',
          onConfirm: async () => {
            console.log('User confirmed - disabling parent mode...')
            props.popupService.close()

            const result = await parentMode.disable()
            console.log('Disable result:', result)
            if (result.success) {
              // Wait a moment for database update to complete, then re-initialize
              await new Promise(resolve => setTimeout(resolve, 100))
              console.log('Re-initializing after disable...')
              await parentMode.initialize()
              console.log('State after re-initialize:', {
                isEnabled: parentMode.isEnabled.value,
                isUnlocked: parentMode.isUnlocked.value
              })
              emit('mode-changed', false)
              toast.value.show({
                message: t(keys.parentMode.parentModeDisabled),
                type: 'success'
              })
            } else {
              toast.value.show({
                message: result.error || t(keys.parentMode.failedToDisable),
                type: 'error'
              })
            }
          },
          onCancel: () => {
            props.popupService.close()
          }
        }
      })
    } else {
      // Fallback to simple toast if no popup service
      toast.value.show({
        message: t(keys.parentMode.cannotDisableNoPopup),
        type: 'error'
      })
    }
    return
  }

  // If parent mode is enabled but not unlocked, show unlock flow
  if (parentMode.isEnabled.value && !isUnlocked.value) {
    console.log('Going to unlock flow - parent mode enabled but not unlocked')

    // Check if user has required permission (only check when enabled)
    if (props.requiredPermission && !parentMode.hasPermission(props.appName, props.requiredPermission)) {
      emit('permission-denied', props.requiredPermission)
      toast.value.show({
        message: t(keys.parentMode.insufficientPermissions),
        type: 'warning'
      })
      return
    }

    // If popup service is provided, use it directly
    if (props.popupService) {
      console.log('Using provided popup service for unlock')
      try {
        props.popupService.open({
          component: TParentModePinInput,
          title: t(keys.parentMode.enterParentPin),
          description: t(keys.parentMode.enterPinDescription),
          props: {
            mode: 'unlock',
            onPinEntered: handlePinEntered,
            onClose: () => props.popupService.close()
          }
        })
      } catch (error) {
        console.error('Error opening popup for unlock:', error)
      }
    } else {
      console.log('No popup service provided, emitting event')
      // Otherwise emit event for parent to handle
      emit('show-pin-input', 'unlock', handlePinEntered)
    }
  }
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
      toast.value.show({
        message: t(keys.parentMode.parentModeUnlocked),
        type: 'success'
      })
    } else {
      toast.value.show({
        message: result.error || t(keys.parentMode.incorrectPin),
        type: 'error'
      })
    }
  }
}

/**
 * Close PIN input modal
 */
const closePinInput = () => {
  showPinInput.value = false
}

// Watch for parent mode changes
watch(() => parentMode.canManageContent.value, (isUnlocked) => {
  if (!isUnlocked && showPinInput.value) {
    showPinInput.value = false
  }
})

// Initialize parent mode on mount
onMounted(async () => {
  console.log('TParentModeToggle mounted, initializing parent mode...')
  await parentMode.initialize()
  console.log('Parent mode initialized:', {
    isEnabled: parentMode.isEnabled.value,
    isUnlocked: parentMode.isUnlocked.value
  })
})
</script>

<style lang="scss" scoped>
.parent-mode-toggle {
  &--active {
    box-shadow: 0 0 0 2px var(--color-success);
  }
}
</style>
