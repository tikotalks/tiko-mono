<template>
  <div :class="bemm()">
    <div :class="bemm('container')">
      <div
        v-for="(item, index) in items"
        :key="item.id"
        :class="bemm('item', {
          disabled: !enabled
        })"
        :draggable="enabled"
        @dragstart="enabled && handleDragStart($event, index)"
        @dragenter="enabled && handleDragEnter($event)"
        @dragleave="enabled && handleDragLeave($event)"
        @dragover="enabled && handleDragOver($event)"
        @drop="enabled && handleDrop($event, index)"
        @dragend="enabled && handleDragEnd($event)"
      >
        <div v-if="enabled" :class="bemm('handle')">
          <TIcon :name="Icons.THREE_DOTS_VERTICAL" size="1.5rem" />
        </div>
        <div :class="bemm('content')">
          <slot :item="item" :index="index" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends DraggableItem">
import { toRef } from 'vue'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { useDraggable, type DraggableItem } from '../../../composables/useDraggable'
import TIcon from '../../ui-elements/TIcon/TIcon.vue'

interface Props {
  items: T[]
  enabled?: boolean
  onReorder?: (items: T[]) => void | Promise<void>
}

const props = withDefaults(defineProps<Props>(), {
  enabled: true
})

const bemm = useBemm('draggable-list')
const itemsRef = toRef(props, 'items')

const {
  handleDragStart,
  handleDragEnter,
  handleDragLeave,
  handleDragOver,
  handleDrop,
  handleDragEnd
} = useDraggable(itemsRef, {
  onReorder: props.onReorder
})
</script>

<style lang="scss" scoped>
.draggable-list {
  &__container {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    background-color: var(--color-background);
    border: 1px solid var(--color-accent);
    border-radius: var(--border-radius);
    padding: var(--space-s);
    transition: all 0.2s ease;
    user-select: none;

    &:not(.draggable-list__item--disabled) {
      cursor: grab;
      
      &:active {
        cursor: grabbing;
      }
      
      &:hover {
        border-color: var(--color-accent-hover);
      }
    }

    &--disabled {
      cursor: default;
      opacity: 0.6;
    }
  }

  &__handle {
    color: var(--color-foreground-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    opacity: 0.5;
    transition: opacity 0.2s ease;
    
    .draggable-list__item:hover & {
      opacity: 1;
    }
  }

  &__content {
    flex: 1;
    min-width: 0;
  }
}

// Drag state styles
.dragging {
  opacity: 0.5;
  transform: scale(0.98);
}

.drag-over {
  border-color: var(--color-primary) !important;
  background-color: rgba(var(--color-primary-rgb), 0.1) !important;
  transform: translateY(-2px);
}
</style>