<template>
  <div v-if="visible" :class="bemm([type])">
    <TIcon v-if="icon" :name="icon" :class="bemm('icon')" />
    <div :class="bemm('content')">
      <slot />
    </div>
    <button
      v-if="dismissible"
      :class="bemm('close')"
      @click="handleDismiss"
      :aria-label="t('common.close')"
    >
      <TIcon name="close" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBemm } from 'bemm'
import { useI18n } from '@/composables/useI18n'
import TIcon from '../TIcon/TIcon.vue'
import type { TAlertProps } from './TAlert.model'

const bemm = useBemm('t-alert')
const { t } = useI18n()

const props = withDefaults(defineProps<TAlertProps>(), {
  type: 'info',
  dismissible: false
})

const emit = defineEmits<{
  dismiss: []
}>()

const visible = ref(true)

const icon = computed(() => {
  const iconMap = {
    info: 'info-circled',
    success: 'check-circled',
    warning: 'exclamation-mark-circled',
    error: 'multiply-circled'
  }
  return iconMap[props.type]
})

const handleDismiss = () => {
  visible.value = false
  emit('dismiss')
}
</script>

<style lang="scss">
.t-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-s);
  padding: var(--space);
  border-radius: var(--radius);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);

  &--info {
    background-color: var(--color-info-background);
    border-color: var(--color-info);
    color: var(--color-info-text);
  }

  &--success {
    background-color: var(--color-success-background);
    border-color: var(--color-success);
    color: var(--color-success-text);
  }

  &--warning {
    background-color: var(--color-warning-background);
    border-color: var(--color-warning);
    color: var(--color-warning-text);
  }

  &--error {
    background-color: var(--color-error-background);
    border-color: var(--color-error);
    color: var(--color-error-text);
  }

  &__icon {
    flex-shrink: 0;
    font-size: 1.25em;
  }

  &__content {
    flex: 1;
  }

  &__close {
    flex-shrink: 0;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }
  }
}
</style>