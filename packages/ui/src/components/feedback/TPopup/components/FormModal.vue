<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h3 :class="bemm('title')">{{ title }}</h3>
      <p v-if="subtitle" :class="bemm('subtitle')">{{ subtitle }}</p>
    </div>

    <div :class="bemm('content')">
      <slot />
    </div>

    <div :class="bemm('actions')">
      <TButton
        :label="cancelLabel"
        type="default"
        color="secondary"
        @click="handleCancel"
        :class="bemm('cancel-button')"
      />
      <TButton
        :label="submitLabel"
        type="fancy"
        color="primary"
        @click="handleSubmit"
        :disabled="!canSubmit"
        :loading="isLoading"
        :class="bemm('submit-button')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import TButton from '../../../ui-elements/TButton/TButton.vue'

interface Props {
  title: string
  subtitle?: string
  submitLabel?: string
  cancelLabel?: string
  canSubmit?: boolean
  isLoading?: boolean
  onSubmit?: () => void
  onCancel?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  submitLabel: 'Submit',
  cancelLabel: 'Cancel',
  canSubmit: true,
  isLoading: false
})

const emit = defineEmits<{
  close: []
}>()

const bemm = useBemm('form-modal')

const handleSubmit = () => {
  props.onSubmit?.()
  // Don't auto-close, let the parent handle success/error
}

const handleCancel = () => {
  props.onCancel?.()
  emit('close')
}
</script>

<style lang="scss" scoped>
.form-modal {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 400px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;

  &__header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-accent);
  }

  &__title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-primary-text);
  }

  &__subtitle {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid var(--color-accent);
  }

  &__cancel-button,
  &__submit-button {
    min-width: 100px;
  }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .form-modal {
    min-width: auto;
    max-width: none;
    max-height: 90vh;

    &__actions {
      flex-direction: column-reverse;
    }

    &__cancel-button,
    &__submit-button {
      width: 100%;
    }
  }
}
</style>
