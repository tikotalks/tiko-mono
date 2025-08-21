<template>
  <div :class="bemm()">
    <p :class="bemm('message')">{{ message }}</p>

    <div :class="bemm('footer')">
      <TButton type="ghost" @click="$emit('close')">
        {{ cancelLabel || t('common.cancel') }}
      </TButton>
      <TButton :color="confirmColor || 'primary'" @click="handleConfirm">
        {{ confirmLabel || t('common.confirmLabel') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { TButton } from '@tiko/ui'
import { useI18n } from '@tiko/core'

interface Props {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmColor?: 'primary' | 'error' | 'warning' | 'success'
  onConfirm?: () => void | Promise<void>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const bemm = useBemm('confirm-dialog')
const { t } = useI18n()

async function handleConfirm() {
  if (props.onConfirm) {
    await props.onConfirm()
  }
  emit('close')
}
</script>

<style lang="scss">
.confirm-dialog {
  &__message {
    margin: 0;
    color: var(--color-foreground);
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space);
    margin-top: var(--space-lg);
    padding-top: var(--space);
    border-top: 1px solid var(--color-border);
  }
}
</style>
