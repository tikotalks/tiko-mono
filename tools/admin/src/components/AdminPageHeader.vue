<template>
  <div :class="bemm()">
    <div :class="bemm('top')">
      <div :class="bemm('text')">
        <h1 :class="bemm('title')">{{ title }}</h1>
        <p v-if="description" :class="bemm('description')">{{ description }}</p>
      </div>

      <div v-if="$slots.actions" :class="bemm('actions')">
        <slot name="actions" />
      </div>
    </div>

    <div v-if="$slots.inputs" :class="bemm('inputs')">
      <slot name="inputs" />
    </div>

    <div v-if="$slots.stats" :class="bemm('stats')">
      <slot name="stats" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import type { AdminPageHeaderProps } from './AdminPageHeader.model'

defineProps<AdminPageHeaderProps>()

const bemm = useBemm('admin-page-header')
</script>

<style lang="scss">
.admin-page-header {
  display: flex;
  flex-direction: column;
  gap: var(--space);
  padding: 0;
  padding-bottom: var(--spacing);

  &__top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space);

    @media screen and (max-width: 768px) {
      flex-direction: column;
    }
  }

  &__text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__title {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--color-primary);
    line-height: 1.2;
  }

  &__description {
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
    line-height: 1.5;
  }

  &__actions {
    display: flex;
    gap: var(--space-s);
    align-items: center;
    flex-shrink: 0;
  }

  &__inputs {
    display: flex;
    gap: var(--space);
    align-items: center;
    flex-wrap: wrap;
  }

  &__stats {
    display: flex;
    gap: var(--space);
    flex-wrap: wrap;
  }
}</style>
