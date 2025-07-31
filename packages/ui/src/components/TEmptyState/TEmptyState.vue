<template>
  <div :class="bemm()">
    <div :class="bemm('icon')" v-if="icon">
      <TIcon :name="icon" :size="iconSize" />
    </div>

    <div :class="bemm('content')">
      <h3 v-if="title" :class="bemm('title')">{{ title }}</h3>
      <p v-if="description" :class="bemm('description')">{{ description }}</p>

      <div v-if="$slots.default" :class="bemm('actions')">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { TIcon } from '../TIcon'
import type { TEmptyStateProps } from './TEmptyState.model'

const props = withDefaults(defineProps<TEmptyStateProps>(), {
  iconSize: 'large'
})

const bemm = useBemm('empty-state')
</script>

<style lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-xl);
  min-height: 200px;
  border-radius: var(--border-radius);
  border: 1px solid color-mix( in srgb, var(--color-primary), transparent 50%);
  background-color: color-mix( in srgb, var(--color-primary), transparent 90%);

  &__icon {
    margin-bottom: var(--space);
    opacity: 0.6;
    color: var(--color-foreground-secondary);
  }

  &__content {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space);

  }

  &__title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0 0 var(--space-sm) 0;
  }

  &__description {
    font-size: var(--font-size-md);
    color: var(--color-foreground-secondary);
    line-height: 1.5;
    margin: 0 0 var(--space-lg) 0;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space);
  }
}
</style>
