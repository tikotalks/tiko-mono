<template>
  <div :class="bemm()">
    <p :class="bemm('message')">{{ message }}</p>
    <div :class="bemm('actions')">
      <TButton
        variant="secondary"
        @click="onCancel"
      >
        {{ cancelText }}
      </TButton>
      <TButton
        :variant="confirmVariant"
        @click="onConfirm"
      >
        {{ confirmText }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { TButton } from '@tiko/ui'

interface Props {
  message: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'secondary' | 'danger'
  onConfirm: () => void
  onCancel?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  confirmVariant: 'primary',
  onCancel: () => {}
})

const bemm = useBemm('confirm-dialog')
</script>

<style lang="scss">
.confirm-dialog {
  padding: var(--space);
  
  &__message {
    margin: 0 0 var(--space-l) 0;
    color: var(--color-foreground);
  }
  
  &__actions {
    display: flex;
    gap: var(--space);
    justify-content: flex-end;
  }
}
</style>