<template>
  <div :class="bemm()">
    <div :class="bemm('content')">
      <div :class="bemm('text')">
        <h1 v-if="title" :class="bemm('title')">{{ title }}</h1>
        <p v-if="description" :class="bemm('description')">{{ description }}</p>
      </div>

      <div v-if="$slots.actions" :class="bemm('actions')">
        <slot name="actions" />
      </div>
    </div>

    <div v-if="$slots.default" :class="bemm('extra')">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import type { THeaderProps } from './THeader.model'

const props = defineProps<THeaderProps>()

const bemm = useBemm('header')
</script>

<style lang="scss">
.header {
  display: flex;
  flex-direction: column;
  gap: var(--space);
  margin-bottom: var(--space-lg);

  &__content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space);
  }

  &__text {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0 0 var(--space-xs) 0;
    line-height: 1.2;
  }

  &__description {
    font-size: var(--font-size-md);
    color: var(--color-foreground-secondary);
    margin: 0;
    line-height: 1.4;
  }

  &__actions {
    display: flex;
    gap: var(--space);
    align-items: center;
    flex-shrink: 0;
  }

  &__extra {
    padding-top: var(--space);
    border-top: 1px solid var(--color-accent);
  }
}
</style>
