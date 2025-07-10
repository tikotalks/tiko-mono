<template>
  <div :class="bemm()">
    <TransitionGroup name="draggable-list" tag="div" :class="bemm('container')">
      <div
        v-for="item in items"
        :key="item.id"
        :data-draggable-id="item.id"
        :class="bemm('item', { 
          dragging: draggedItem?.id === item.id,
          'drag-over': draggedOverItem?.id === item.id,
          disabled: !isEnabled
        })"
        :draggable="isEnabled"
        @dragstart="handleDragStart($event, item)"
        @dragover="handleDragOver($event, item)"
        @dragend="handleDragEnd"
        @drop="handleDragEnd"
        @touchstart="handleTouchStart($event, item)"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <div v-if="isEnabled" :class="bemm('handle')">
          <TIcon name="drag-handle" size="1.5rem" />
        </div>
        <div :class="bemm('content')">
          <slot :item="item" :index="items.indexOf(item)" />
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts" generic="T extends DraggableItem">
import { computed, toRef } from 'vue'
import { useBemm } from 'bemm'
import { useDraggable, type DraggableItem } from '../../composables/useDraggable'
import TIcon from '../TIcon/TIcon.vue'

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
  isDragging,
  draggedItem,
  draggedOverItem,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  handleTouchMove,
  isEnabled
} = useDraggable(itemsRef, {
  onReorder: props.onReorder,
  enabled: computed(() => props.enabled)
})

// Touch event handlers with proper types
const handleTouchStart = (event: TouchEvent, item: T) => {
  handleDragStart(event, item)
}

const handleTouchEnd = (event: TouchEvent) => {
  handleDragEnd(event)
}
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
    border: 2px solid var(--color-border);
    border-radius: var(--radius);
    padding: var(--space-s);
    transition: all 0.2s ease;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;

    &--dragging {
      opacity: 0.5;
      transform: scale(0.95);
    }

    &--drag-over {
      border-color: var(--color-primary);
      background-color: var(--color-primary-light);
    }

    &--disabled {
      cursor: default;
    }

    &:not(.draggable-list__item--disabled) {
      cursor: move;
    }
  }

  &__handle {
    color: var(--color-foreground-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }
}

.draggable-list-move,
.draggable-list-enter-active,
.draggable-list-leave-active {
  transition: all 0.3s ease;
}

.draggable-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.draggable-list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.draggable-list-leave-active {
  position: absolute;
  width: 100%;
}
</style>