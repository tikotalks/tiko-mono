<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h3 :class="bemm('title')">{{ title }}</h3>
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
        v-if="showApply"
        :label="applyLabel"
        type="fancy"
        color="primary"
        @click="handleApply"
        :class="bemm('apply-button')"
      />
      <TButton
        v-else
        :label="closeLabel"
        type="fancy"
        color="primary"
        @click="handleClose"
        :class="bemm('close-button')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import TButton from '../../TButton/TButton.vue'

interface Props {
  title?: string
  showApply?: boolean
  applyLabel?: string
  cancelLabel?: string
  closeLabel?: string
  onApply?: () => void
  onCancel?: () => void
  onClose?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Settings',
  showApply: false,
  applyLabel: 'Apply',
  cancelLabel: 'Cancel',
  closeLabel: 'Close'
})

const emit = defineEmits<{
  close: []
}>()

const bemm = useBemm('settings-panel')

const handleApply = () => {
  props.onApply?.()
  emit('close')
}

const handleCancel = () => {
  props.onCancel?.()
  emit('close')
}

const handleClose = () => {
  props.onClose?.()
  emit('close')
}
</script>

<style lang="scss" scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 320px;
  max-width: 500px;
  width: 100%;

  &__header {
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
  }

  &__title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    text-align: center;
    color: var(--color-primary-text);
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-height: 60vh;
    overflow-y: auto;
  }

  &__actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
  }

  &__cancel-button,
  &__apply-button,
  &__close-button {
    flex: 1;
    min-width: 100px;
  }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .settings-panel {
    min-width: auto;
    max-width: none;

    &__actions {
      flex-direction: column-reverse;
    }

    &__cancel-button,
    &__apply-button,
    &__close-button {
      width: 100%;
    }
  }
}
</style>