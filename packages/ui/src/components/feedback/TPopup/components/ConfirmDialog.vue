<template>
  <div :class="bemm()">
    <div :class="bemm('icon')">
      <TIcon :name="icon" />
    </div>

    <div :class="bemm('content')">
      <h3 :class="bemm('title')">{{ title }}</h3>
      <p :class="bemm('message')">{{ message }}</p>
    </div>

    <div :class="bemm('actions')">
      <TButton
        type="default"
        color="secondary"
        @click="handleCancel"
        :icon="Icons.ARROW_LEFT"
        :class="bemm('cancel-button')"
      >
        {{ cancelLabel }}
      </TButton>
      <TButton
        :color="confirmColor"
        :icon="confirmIcon(confirmColor)"
        @click="handleConfirm"
        :class="bemm('confirm-button')"
        ref="confirmButton"
        autofocus
      >
        {{ confirmLabel }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useBemm } from 'bemm'
import TButton from '../../../ui-elements/TButton/TButton.vue'
import TIcon from '../../../ui-elements/TIcon/TIcon.vue'
import { Icons } from 'open-icon'

interface Props {
  title: string
  message: string
  icon?: Icons
  confirmLabel?: string
  cancelLabel?: string
  confirmColor?: 'primary' | 'success' | 'error' | 'warning'
  onConfirm?: () => void
  onCancel?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'help-circle',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  confirmColor: 'primary'
})

const emit = defineEmits<{
  close: []
}>()

const bemm = useBemm('confirm-dialog')
const confirmButton = ref<InstanceType<typeof TButton> | null>(null)

const handleConfirm = () => {
  props.onConfirm?.()
  emit('close')
}

const handleCancel = () => {
  props.onCancel?.()
  emit('close')
}

const confirmIcon = (color: string) => {
  switch (color) {
    case 'success':
      return Icons.CIRCLED_CHECK
    case 'error':
      return Icons.MULTIPLY_M
    case 'warning':
      return Icons.CIRCLED_EXCLAMATION_MARK
    default:
      return Icons.ARROW_RIGHT
  }
}

// Focus the confirm button when mounted and handle enter key
onMounted(() => {
  nextTick(() => {
    // Focus the confirm button for keyboard navigation
    const button = confirmButton.value?.$el as HTMLElement
    if (button) {
      const buttonElement = button.querySelector('button') || button
      buttonElement?.focus()
    }
  })
})

// Handle keyboard events
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    handleConfirm()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    handleCancel()
  }
}

// Add event listener when component mounts
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

// Clean up event listener
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss">
.confirm-dialog {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
  min-width: 320px;
  max-width: 500px;
  text-align: center;

  &__icon {
    color: var(--color-warning);
    font-size: 2em;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-foreground);
  }

  &__message {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  &__actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    width: 100%;
  }

  &__cancel-button,
  &__confirm-button {
    flex: 1;
    min-width: 100px;
  }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .confirm-dialog {
    min-width: auto;
    width: 100%;

    &__actions {
      flex-direction: column-reverse;
    }

    &__cancel-button,
    &__confirm-button {
      width: 100%;
    }
  }
}
</style>
