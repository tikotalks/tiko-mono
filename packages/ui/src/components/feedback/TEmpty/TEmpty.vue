<template>
  <div :class="bemm()">
    <slot name="default">
      <div :class="bemm('content')">
        <TIcon v-if="icon" :name="icon" :class="bemm('icon')" />
        <p :class="bemm('message')">{{ message || t('common.noData') }}</p>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import TIcon from '../../ui-elements/TIcon/TIcon.vue'
import { useI18n } from '../../../composables/useI18n'
import type { TEmptyProps } from './TEmpty.model'

const props = defineProps<TEmptyProps>()

const bemm = useBemm('empty')
const { t } = useI18n()
</script>

<style lang="scss">
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  min-height: 120px;

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space);
  }

  &__icon {
    font-size: var(--font-size-xl);
    color: var(--color-foreground-secondary);
    opacity: 0.6;
  }

  &__message {
    color: var(--color-foreground-secondary);
    font-size: var(--font-size-md);
    margin: 0;
  }
}
</style>