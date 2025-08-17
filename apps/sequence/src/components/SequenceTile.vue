<template>
  <div
    :class="bemm('', {
      'edit-mode': editMode,
      'draggable': isDraggable
    })"
    :style="{
      '--tile-color': `var(--color-${sequence.color || 'primary'})`
    }"
    @click="handleClick"
  >
    <!-- Delete button (edit mode only) -->
    <button
      v-if="editMode"
      :class="bemm('delete')"
      @click.stop="$emit('delete')"
    >
      <TIcon name="times" size="small" />
    </button>

    <!-- Image or icon -->
    <div :class="bemm('visual')">
      <img
        v-if="sequence.imageUrl"
        :src="sequence.imageUrl"
        :alt="sequence.title"
        :class="bemm('image')"
      >
      <TIcon
        v-else
        name="list-ordered"
        size="large"
        :class="bemm('icon')"
      />
    </div>

    <!-- Title -->
    <div :class="bemm('title')">
      {{ sequence.title }}
    </div>

    <!-- Item count badge -->
    <div v-if="itemCount > 0" :class="bemm('badge')">
      {{ itemCount }}
    </div>

    <!-- Edit mode indicator -->
    <div v-if="editMode" :class="bemm('edit-indicator')">
      <TIcon name="pencil" size="small" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { TIcon } from '@tiko/ui'
import type { Sequence } from '../stores/sequence'
import { sequenceService } from '../services/sequence.service'

const bemm = useBemm('sequence-tile')

const props = defineProps<{
  sequence: Sequence
  editMode?: boolean
  isDraggable?: boolean
}>()

const emit = defineEmits<{
  click: []
  edit: []
  delete: []
}>()

// State
const itemCount = ref(0)

// Methods
const handleClick = () => {
  emit('click')
}

// Load item count
onMounted(async () => {
  try {
    const items = await sequenceService.loadSequenceItems(props.sequence.id)
    itemCount.value = items.length
  } catch (error) {
    console.error('Failed to load item count:', error)
  }
})
</script>

<style lang="scss" scoped>
.sequence-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space);
  padding: var(--space-lg);
  background-color: var(--tile-color, var(--color-primary));
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 200px;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: rgba(255, 255, 255, 0.1);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover::before {
    opacity: 1;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  &--edit-mode {
    cursor: move;
  }

  &--draggable {
    user-select: none;
  }

  &__delete {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 1;

    &:hover {
      background-color: var(--color-danger);
      color: white;
      transform: scale(1.1);
    }
  }

  &__visual {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  &__icon {
    color: rgba(255, 255, 255, 0.9);
  }

  &__title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: white;
    text-align: center;
    word-break: break-word;
  }

  &__badge {
    position: absolute;
    bottom: var(--space);
    right: var(--space);
    min-width: 24px;
    height: 24px;
    padding: 0 var(--space-xs);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.3);
    color: white;
    font-size: var(--font-size-sm);
    font-weight: 600;
    border-radius: 12px;
  }

  &__edit-indicator {
    position: absolute;
    top: var(--space);
    left: var(--space);
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    color: var(--tile-color);
  }
}
</style>
