<template>
  <div :class="bemm('')">
    <header :class="bemm('list-header')" v-if="$slots.header">
      <slot name="header" />
    </header>
    <div v-if="columns?.length" :class="bemm('header')">
      <div
        v-for="column in columns"
        :key="column.key"
        :class="
          bemm('header-cell', [
            '',
            `align-${column.align || 'left'}`,
            column.sortable ? 'sortable' : '',
            props.sortBy === column.key ? 'sorted' : '',
          ])
        "
        :style="{ width: column.width }"
        @click="column.sortable && handleSort(column.key)"
      >
        <span :class="bemm('header-label')">{{ column.label }}</span>
        <TIcon
          v-if="column.sortable"
          :name="getSortIcon(column.key)"
          :class="
            bemm('sort-icon', ['', props.sortBy === column.key ? 'active' : ''])
          "
          size="small"
        />
      </div>
    </div>

    <div :class="bemm('body')">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useBemm } from 'bemm';
import { Icons } from 'open-icon';
import TIcon from '../TIcon/TIcon.vue';
import type { TListProps } from './TList.model';

const props = withDefaults(defineProps<TListProps>(), {
  striped: true,
  bordered: true,
  hover: true,
  sortDirection: 'asc',
});

const emit = defineEmits<{
  sort: [column: string, direction: 'asc' | 'desc'];
}>();

const bemm = useBemm('t-list');

// Compute grid template columns from column widths
const gridTemplateColumns = computed(() => {
  if (!props.columns?.length) return 'none';
  return props.columns.map((col) => col.width || '1fr').join(' ');
});

// Handle sort click
const handleSort = (column: string) => {
  let newDirection: 'asc' | 'desc' = 'asc';

  if (props.sortBy === column) {
    // Toggle direction if clicking the same column
    newDirection = props.sortDirection === 'asc' ? 'desc' : 'asc';
  }

  // Call parent handler if provided
  if (props.onSort) {
    props.onSort(column, newDirection);
  }

  // Emit event for v-model pattern
  emit('sort', column, newDirection);
};

// Get the appropriate sort icon
const getSortIcon = (column: string) => {
  if (props.sortBy !== column) {
    return Icons.ARROW_ROTATE_TOP_LEFT;
  }

  return props.sortDirection === 'asc' ? Icons.CHEVRON_UP : Icons.CHEVRON_DOWN;
};
</script>

<style lang="scss">
.t-list {
  --color-primary-accent: color-mix(
    in srgb,
    var(--color-primary),
    transparent 75%
  );

  display: flex;
  flex-direction: column;
  border-radius: var(--border-radius);
  overflow: hidden;
  border: 1px solid var(--color-primary-accent);
  margin: auto;

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
    gap: var(--space-xs);
    transition: background-color 0.2s ease;

    &--align-left {
      justify-content: flex-start;
    }

    &--align-center {
      justify-content: center;
    }

    &--align-right {
      justify-content: flex-end;
    }

    &--sortable {
      cursor: pointer;
      user-select: none;

      &:hover {
        background-color: var(--color-background-hover);
      }
    }

    &--sorted {
      background-color: var(--color-background-active);
    }
  }

  &__header-label {
    flex-shrink: 0;
  }

  &__sort-icon {
    width: 1em;
    height: 1em;
    display: block;
    opacity: 0.3;
    transition: opacity 0.2s ease;

    &--active {
      opacity: 1;
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
  }

  &__empty {
    padding: var(--space-xl);
    text-align: center;
    color: var(--color-text-secondary);
  }

  &__list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space);
    background: var(--color-background-secondary);
    border-bottom: 1px solid var(--color-border);
  }
}
</style>
