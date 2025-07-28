<template>
  <div :class="bemm('')">
    <div v-if="columns?.length" :class="bemm('header')">
      <div
        v-for="column in columns"
        :key="column.key"
        :class="bemm('header-cell', ['', `align-${column.align || 'left'}`])"
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

  --color-primary-accent:color-mix(in srgb, var(--color-primary), transparent 75%);

  display: flex;
  flex-direction: column;
  border-radius: var(--border-radius);
  overflow: hidden;
  border: 1px solid var(--color-primary-accent);



   .t-list-item:nth-child(even) {
    background: var(--color-accent);
  }

  .t-list-item:hover {
    background: var(--color-secondary);
  }

  .t-list-item {
    grid-template-columns: v-bind(gridTemplateColumns);
  }

  &__header {
    display: grid;
    grid-template-columns: v-bind(gridTemplateColumns);
    background: var(--color-background-secondary);
    font-weight: 600;
    font-size: var(--font-size-s);
    color: var(--color-text-secondary);
    border-bottom: 1px solid var(--color-primary-accent);

  }

  &__header-cell {
    display: flex;
    align-items: center;
    padding: var(--space);

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
