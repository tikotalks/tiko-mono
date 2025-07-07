<template>
  <div
    :class="bemm('', {
      selected,
      'edit-mode': editMode,
      [size]: true
    })"
    :style="{ backgroundColor: card.backgroundColor }"
    @click="handleClick"
  >
    <!-- Selection Checkbox -->
    <div
      v-if="editMode"
      :class="bemm('selection')"
      @click.stop="$emit('select', card.id)"
    >
      <TIcon
        :name="selected ? 'check-circle' : 'circle'"
        :class="bemm('selection-icon', { selected })"
      />
    </div>

    <!-- Card Image -->
    <div :class="bemm('image-container')">
      <img
        v-if="card.imageUrl"
        :src="card.imageUrl"
        :alt="card.label"
        :class="bemm('image')"
        loading="lazy"
      />
      <div v-else :class="bemm('placeholder')">
        <TIcon name="image" :class="bemm('placeholder-icon')" />
      </div>
    </div>

    <!-- Card Label -->
    <div v-if="showLabel" :class="bemm('label')">
      <span :class="bemm('label-text')">{{ card.label }}</span>
    </div>

    <!-- Card Actions (Edit Mode) -->
    <div v-if="editMode" :class="bemm('actions')">
      <TButton
        :class="bemm('action-button')"
        color="secondary"
        icon="edit"
        size="small"
        @click.stop="$emit('edit', card)"
      />
      <TButton
        :class="bemm('action-button')"
        color="danger"
        icon="trash"
        size="small"
        @click.stop="$emit('delete', card.id)"
      />
    </div>

    <!-- Visual Feedback -->
    <div
      v-if="isPlaying"
      :class="bemm('playing-indicator')"
    >
      <TIcon name="volume-up" :class="bemm('playing-icon')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBemm } from 'bemm'
import TIcon from '../TIcon/TIcon.vue'
import TButton from '../TButton/TButton.vue'

export interface Card {
  id: string
  label: string
  audioText: string
  imageUrl?: string
  animatedImageUrl?: string
  backgroundColor?: string
  tags?: string[]
}

interface Props {
  card: Card
  editMode?: boolean
  selected?: boolean
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
}

interface Emits {
  (e: 'click', card: Card): void
  (e: 'select', cardId: string): void
  (e: 'edit', card: Card): void
  (e: 'delete', cardId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  editMode: false,
  selected: false,
  size: 'medium',
  showLabel: true
})

const emit = defineEmits<Emits>()

const bemm = useBemm('communication-card')
const isPlaying = ref(false)

const handleClick = () => {
  if (props.editMode) {
    emit('select', props.card.id)
    return
  }

  // Visual feedback
  isPlaying.value = true
  setTimeout(() => {
    isPlaying.value = false
  }, 1000)

  emit('click', props.card)
}
</script>

<style lang="scss">
.communication-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 0.75rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  // Edit mode styling
  &--edit-mode {
    &:hover {
      border-color: var(--color-primary);
    }
  }

  // Selection styling
  &--selected {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-light);
  }

  // Size variants
  &--small {
    min-height: 100px;

    .communication-card__image-container {
      height: 60px;
    }

    .communication-card__label-text {
      font-size: 0.75rem;
    }
  }

  &--medium {
    min-height: 150px;

    .communication-card__image-container {
      height: 100px;
    }
  }

  &--large {
    min-height: 200px;

    .communication-card__image-container {
      height: 140px;
    }

    .communication-card__label-text {
      font-size: 1.125rem;
    }
  }

  &__selection {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 2;
    cursor: pointer;
  }

  &__selection-icon {
    font-size: 1.25rem;
    color: var(--color-text-secondary);
    transition: color 0.2s ease;

    &--selected {
      color: var(--color-primary);
    }
  }

  &__image-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.5);
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: var(--color-background);
  }

  &__placeholder-icon {
    font-size: 2rem;
    color: var(--color-text-secondary);
  }

  &__label {
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(4px);
    text-align: center;
  }

  &__label-text {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-primary-text);
    display: block;
    line-height: 1.2;
  }

  &__actions {
    position: absolute;
    bottom: 0.5rem;
    left: 0.5rem;
    display: flex;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &--edit-mode:hover &__actions {
    opacity: 1;
  }

  &__action-button {
    backdrop-filter: blur(4px);
    background: rgba(255, 255, 255, 0.9);
  }

  &__playing-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    background: var(--color-primary);
    border-radius: 50%;
    animation: pulse 1s ease-in-out;
  }

  &__playing-icon {
    font-size: 1.5rem;
    color: white;
  }
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0;
  }
}

// Accessibility
@media (prefers-reduced-motion: reduce) {
  .communication-card {
    transition: none;

    &:hover {
      transform: none;
    }

    &:active {
      transform: none;
    }
  }

  .communication-card__playing-indicator {
    animation: none;
  }
}

// High contrast mode
@media (prefers-contrast: high) {
  .communication-card {
    border: 2px solid var(--color-primary-text);

    &--selected {
      border-color: var(--color-primary);
      background: var(--color-primary-light);
    }
  }
}
</style>
