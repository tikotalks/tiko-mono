<template>
  <div :class="bemm()">
    <div
      v-for="(item, index) in items"
      :key="item.id"
      :class="bemm('item', {
        dragging: draggedIndex === index,
        'drop-target': dropTargetIndex === index,
        'indent-preview': hierarchical && dropTargetIndex === index && currentIndentLevel > 0,
        'outdent-preview': hierarchical && dropTargetIndex === index && currentIndentLevel < 0
      })"
      :draggable="enabled"
      @dragstart="onDragStart(index, $event)"
      @dragend="onDragEnd"
      @dragover.prevent="onDragOver(index, $event)"
      @drop="onDrop(index, $event)"
    >
      <div v-if="enabled" :class="bemm('handle')">
        <TIcon :name="Icons.THREE_DOTS_VERTICAL" />
      </div>
      <div :class="bemm('content')">
        <slot :item="item" :index="index" />
      </div>
      <!-- Visual feedback for hierarchy changes -->
      <div
        v-if="hierarchical && dropTargetIndex === index && currentIndentLevel !== 0"
        :class="bemm('hierarchy-indicator', currentIndentLevel > 0 ? 'indent' : 'outdent')"
        :style="{ transform: `translateX(${currentIndentLevel * 20}px) translateY(-50%)` }"
      >
        <span v-if="currentIndentLevel > 0">→ Make child</span>
        <span v-else>← Move to root</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends { id: string }">
import { ref } from 'vue'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import TIcon from '../TIcon/TIcon.vue'

interface Props {
  items: T[]
  enabled?: boolean
  hierarchical?: boolean
  onReorder?: (items: T[], parentChanges?: Array<{id: string, parentId: string | null}>) => void
}

const props = withDefaults(defineProps<Props>(), {
  enabled: true,
  hierarchical: false
})

const bemm = useBemm('drag-list')

// Drag state
const draggedIndex = ref<number | null>(null)
const dropTargetIndex = ref<number | null>(null)
const dragStartX = ref<number>(0)
const currentIndentLevel = ref<number>(0)
const potentialParentIndex = ref<number | null>(null)

// Constants for hierarchical dragging
const INDENT_THRESHOLD = 40 // pixels to move horizontally to change parent
const MAX_DEPTH = 3 // maximum nesting depth

function onDragStart(index: number, event: DragEvent) {
  draggedIndex.value = index
  dragStartX.value = event.clientX
  currentIndentLevel.value = 0

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function onDragEnd() {
  draggedIndex.value = null
  dropTargetIndex.value = null
  currentIndentLevel.value = 0
  potentialParentIndex.value = null
}

function onDragOver(index: number, event: DragEvent) {
  event.preventDefault()

  if (draggedIndex.value !== null) {
    dropTargetIndex.value = index

    // Calculate indent level for hierarchical mode
    if (props.hierarchical) {
      const deltaX = event.clientX - dragStartX.value
      const indentLevel = Math.floor(deltaX / INDENT_THRESHOLD)
      currentIndentLevel.value = Math.max(-1, Math.min(1, indentLevel))

      // console.log('Drag over:', { deltaX, indentLevel, currentIndentLevel: currentIndentLevel.value })

      // Determine potential parent - when dropping on an item, it becomes a child of the item ABOVE the drop target
      if (currentIndentLevel.value > 0 && index > 0) {
        // Moving right - make it a child of the item above the drop target
        let parentIndex = index
        // If we're dragging from above the drop target, the parent is just the drop target
        if (draggedIndex.value < index) {
          parentIndex = index - 1
        }

        const potentialParent = props.items[parentIndex]
        // Check if we've reached max depth
        const parentDepth = (potentialParent as any).depth || 0
        if (parentDepth < MAX_DEPTH - 1) {
          potentialParentIndex.value = parentIndex
          // Can make child of index
        } else {
          currentIndentLevel.value = 0 // Can't indent further
          potentialParentIndex.value = null
          // Max depth reached
        }
      } else if (currentIndentLevel.value < 0 && draggedIndex.value !== null) {
        // Moving left - always allow moving to root level
        potentialParentIndex.value = null // Will remove parent or ensure it's at root
        // Will move to root level
      } else {
        potentialParentIndex.value = null
      }
    }
  }
}

function onDrop(dropIndex: number, event: DragEvent) {
  event.preventDefault()

  if (draggedIndex.value !== null) {
    // Handle drop with hierarchy

    // Create new array with reordered items
    const newItems = [...props.items]
    const [movedItem] = newItems.splice(draggedIndex.value, 1)

    // Adjust drop index if we removed an item before it
    let adjustedDropIndex = dropIndex
    if (draggedIndex.value < dropIndex) {
      adjustedDropIndex = dropIndex - 1
    }
    newItems.splice(adjustedDropIndex, 0, movedItem)

    // Handle parent changes in hierarchical mode
    const parentChanges: Array<{id: string, parentId: string | null}> = []

    if (props.hierarchical && currentIndentLevel.value !== 0) {
      if (potentialParentIndex.value !== null && potentialParentIndex.value >= 0) {
        // Set new parent
        const newParent = props.items[potentialParentIndex.value]
        if (newParent && movedItem.id !== newParent.id) {
          parentChanges.push({
            id: movedItem.id,
            parentId: newParent.id
          })
          // Setting parent
        }
      } else if (currentIndentLevel.value < 0) {
        // Always allow moving to root level when dragging left
        parentChanges.push({
          id: movedItem.id,
          parentId: null
        })
        // Moving to root level
      }
    }

    // Notify parent - parent is responsible for updating the items
    if (props.onReorder) {
      props.onReorder(newItems, parentChanges.length > 0 ? parentChanges : undefined)
    }
  }

  // Reset
  draggedIndex.value = null
  dropTargetIndex.value = null
  potentialParentIndex.value = null
  currentIndentLevel.value = 0
}
</script>

<style lang="scss" scoped>
.drag-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);

  &__item {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    padding: var(--space-s);
    background: var(--color-background);
    border: 1px solid var(--color-accent);
    border-radius: var(--border-radius);
    transition: all 0.2s ease;
    position: relative;

    &[draggable="true"] {
      cursor: move;

      // Ensure drag preview has rounded corners
      &:active {
        border-radius: var(--border-radius);
      }
    }

    &--dragging {
      opacity: 0.4;
      transform: scale(0.95);
      border-radius: var(--border-radius);
    }

    &--drop-target {
      border: 2px solid red;
      border-color: var(--color-primary);
      background: var(--color-primary-light);
      border-radius: var(--border-radius);
    }

    &--indent-preview {
      border-color: var(--color-success);
      background: var(--color-success-light);
      border-radius: var(--border-radius);
    }

    &--outdent-preview {
      border-color: var(--color-warning);
      background: var(--color-warning-light);
      border-radius: var(--border-radius);
    }
  }

  &__handle {
    color: var(--color-foreground-secondary);
    opacity: 0.5;

    .drag-list__item:hover & {
      opacity: 1;
    }
  }

  &__content {
    flex: 1;
  }

  &__hierarchy-indicator {
    position: absolute;
    top: 50%;
    right: var(--space);
    transform: translateY(-50%);
    font-size: var(--font-size-s);
    padding: var(--space-xs) var(--space-s);
    border-radius: var(--border-radius);
    background: var(--color-success);
    color: var(--color-success-text);
    font-weight: 500;
    pointer-events: none;
    z-index: 1;

    &--indent {
      background: var(--color-success);
    }

    &--outdent {
      background: var(--color-warning);
      color: var(--color-warning-text);
    }
  }
}
</style>
