<template>
  <div :class="bemm('',{ striped, bordered, hover })">
    <div v-if="columns?.length" :class="bemm('header')">
      <div
        v-for="column in columns"
        :key="column.key"
        :class="bemm('header-cell', { [`align-${column.align || 'left'}`]: true })"
        :style="{ width: column.width }"
      >
        {{ column.label }}
      </div>
    </div>

    <div :class="bemm('body')">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'
import type { TListProps } from './TList.model'

const props = withDefaults(defineProps<TListProps>(), {
  striped: true,
  bordered: true,
  hover: true
})

const bemm = useBemm('t-list')

// Compute grid template columns from column widths
const gridTemplateColumns = computed(() => {
  if (!props.columns?.length) return 'none'
  return props.columns.map(col => col.width || '1fr').join(' ')
})
</script>

<style lang="scss">
.t-list {
  display: flex;
  flex-direction: column;
  border-radius: var(--border-radius);
  overflow: hidden;

  &--bordered {
    border: 1px solid var(--color-border);
  }

  &--striped &__body .t-list-item:nth-child(even) {
    background: var(--color-background-secondary);
  }

  &--hover &__body .t-list-item:hover {
    background: var(--color-background-secondary);
  }

  &__header {
    display: grid;
    grid-template-columns: v-bind(gridTemplateColumns);
    gap: var(--space);
    padding: var(--space-s) var(--space);
    background: var(--color-background-secondary);
    font-weight: 600;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    border-bottom: 1px solid var(--color-border);
  }

  &__header-cell {
    display: flex;
    align-items: center;

    &--align-left {
      justify-content: flex-start;
    }

    &--align-center {
      justify-content: center;
    }

    &--align-right {
      justify-content: flex-end;
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
  }
}
</style>
