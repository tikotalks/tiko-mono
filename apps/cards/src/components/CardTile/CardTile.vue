<template>
  <div ref="wrapperEl" :class="bemm('wrapper', {
    dragging: isDragging,
    'can-drag': canDrag,
    'drag-ready': isDragReady,
    selected: isSelected,
    'selection-mode': selectionMode
  })" @click.stop="handleClick" @mousedown.stop="handleMouseDown" @mouseup.stop="handleMouseUp" 
    @touchstart.stop="handleTouchStart" @touchend.stop="handleTouchEnd" @touchmove.stop="handleTouchMove" 
    @touchcancel.stop="handleTouchEnd"
    :draggable="canDrag" @dragstart.stop="handleDragStart" @dragend.stop="handleDragEnd"
    @dragover.stop="handleDragOver" @dragleave.stop="handleDragLeave" @drop.stop="handleDrop">
    <article :class="bemm('', ['', isEmpty ? 'empty' : '', editMode ? 'edit-mode' : ''])"
      :style="!isEmpty && card?.color ? { '--card-color':`var(--color-${card.color})`, '--card-text':`var(--color-${card.color}-text)`,  } : undefined">
      <div v-if="isEmpty && editMode" :class="bemm('empty-state')">
        <TIcon name="plus" size="large" />
      </div>
      <div v-else :class="bemm('container')">
        <!-- Show mini grid for groups with children -->
        <div v-if="hasChildren && children?.length" :class="bemm('mini-grid')">
          <!-- Background image -->
          <div v-if="displayImage && imageUrl" :class="bemm('mini-grid-bg')" :style="{ backgroundImage: `url(${imageUrl})` }" />
          
          <!-- Mini tiles -->
          <div :class="bemm('mini-tiles')">
            <div
              v-for="(child, index) in children.slice(0, 9)"
              :key="child.id"
              :class="bemm('mini-tile')"
              :style="child.color ? { backgroundColor: `var(--color-${child.color})` } : undefined"
            >
              <img v-if="child.image" :src="getThumbnailUrl(child.image)" :alt="child.title" />
            </div>
          </div>
        </div>
        
        <!-- Regular tile content for non-groups -->
        <template v-else>
          <figure v-if="displayImage && imageUrl" :class="bemm('figure')">
            <img :src="imageUrl" :alt="card.title" :class="bemm('image')" draggable="false" />
          </figure>
        </template>
        
        <h3 v-if="displayTitle && card?.title" :class="bemm('title')">{{ card.title }}</h3>
      </div>
      
      <!-- Selection indicator -->
      <div v-if="isSelected && selectionMode" :class="bemm('selection-indicator')">
        <TIcon name="check" size="small" />
      </div>
    </article>
  </div>
</template>
<script lang="ts" setup>
import { useBemm } from 'bemm';
import { ref, computed } from 'vue';
import { CardTile as CardTileType } from './CardTile.model';
import { TIcon } from '@tiko/ui';
import { useImageUrl } from '@tiko/core';

const bemm = useBemm('card-tile');
const { getImageVariants } = useImageUrl();

// Template refs
const wrapperEl = ref<HTMLElement>();

const props = defineProps<{
  card: CardTileType;
  showImage?: boolean;
  showTitle?: boolean;
  editMode?: boolean;
  isEmpty?: boolean;
  hasChildren?: boolean;
  children?: CardTileType[];
  isSelected?: boolean;
  selectionMode?: boolean;
}>();

const emit = defineEmits<{
  click: [];
  dragstart: [event: DragEvent, card: CardTileType];
  dragend: [];
  dragover: [event: DragEvent];
  dragleave: [event: DragEvent];
  drop: [event: DragEvent];
}>();

const isDragging = ref(false);
const isDragReady = ref(false);
const canDrag = computed(() => props.editMode && !props.isEmpty);
const longPressTimer = ref<number | null>(null);
const touchStartPos = ref({ x: 0, y: 0 });
const LONG_PRESS_DURATION = 500; // 500ms for long press
const DRAG_THRESHOLD = 10; // pixels of movement to cancel long press

// Computed properties for display flags
const displayImage = computed(() => props.showImage !== false);
const displayTitle = computed(() => props.showTitle !== false);

// Computed property to get the correct image URL
const imageUrl = computed(() => {
  if (!props.card?.image) return '';

  // Try to get image variants if available
  try {
    const variants = getImageVariants(props.card.image);
    // Use small variant for regular tiles
    return variants.small || variants.medium || props.card.image;
  } catch {
    // Fallback to the original URL if getImageVariants fails
    return props.card.image;
  }
});

// Get thumbnail URL for mini tiles
const getThumbnailUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';
  
  try {
    const variants = getImageVariants(imageUrl);
    // Use thumbnail for mini tiles
    return variants.thumbnail || variants.small || imageUrl;
  } catch {
    return imageUrl;
  }
};

// Long press handling
const startLongPress = () => {
  if (!canDrag.value) return;

  longPressTimer.value = window.setTimeout(() => {
    isDragReady.value = true;
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, LONG_PRESS_DURATION);
};

const cancelLongPress = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
  isDragReady.value = false;
};

// Mouse events
const handleMouseDown = (event: MouseEvent) => {
  if (!canDrag.value) return;
  touchStartPos.value = { x: event.clientX, y: event.clientY };
  startLongPress();
};

const handleMouseUp = (event: MouseEvent) => {
  cancelLongPress();
};

// Touch events
const handleTouchStart = (event: TouchEvent) => {
  if (!canDrag.value) return;
  const touch = event.touches[0];
  touchStartPos.value = { x: touch.clientX, y: touch.clientY };
  startLongPress();
};

const handleTouchMove = (event: TouchEvent) => {
  if (isDragReady.value) {
    event.preventDefault(); // Prevent scrolling when drag is ready
  }
  const touch = event.touches[0];
  const deltaX = Math.abs(touch.clientX - touchStartPos.value.x);
  const deltaY = Math.abs(touch.clientY - touchStartPos.value.y);

  // Cancel long press if user moves too much
  if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
    cancelLongPress();
  }
};

const handleTouchEnd = (event: TouchEvent) => {
  cancelLongPress();
};

// Click handling
const handleClick = (event: MouseEvent) => {
  // Only emit click if not drag ready
  if (!isDragReady.value) {
    emit('click');
  }
};

// Drag events
const handleDragStart = (event: DragEvent) => {
  if (!canDrag.value) return;
  
  isDragging.value = true;
  emit('dragstart', event, props.card);
};

const handleDragEnd = () => {
  isDragging.value = false;
  isDragReady.value = false;
  emit('dragend');
};

const handleDragOver = (event: DragEvent) => {
  emit('dragover', event);
};

const handleDragLeave = (event: DragEvent) => {
  emit('dragleave', event);
};

const handleDrop = (event: DragEvent) => {
  emit('drop', event);
};
</script>

<style lang="scss">
.card-tile {
  width: 100%;
  height: 100%;
  background-image: radial-gradient(circle at center, var(--card-color) 0%, color-mix(in srgb, var(--card-color), var(--color-background) 25%) 100%);
  border-radius: var(--border-radius);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  color: var(--card-text);

  &:hover {
    transform: scale(.95);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &__wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    
    &--selected {
      article {
        transform: scale(0.92);
        box-shadow: 
          0 0 0 4px var(--color-primary),
          0 8px 16px rgba(0, 0, 0, 0.2);
      }
    }
    
    &--selection-mode {
      cursor: pointer;
    }
  }

  &__container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-s);
    width: 100%;
    height: 100%;
    position: relative;
  }

  &__mini-grid {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: var(--border-radius);
  }

  &__mini-grid-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    opacity: 0.2;
    filter: blur(2px);
  }

  &__mini-tiles {
    position: relative;
    width: 100%;
    height: 100%;
    padding: var(--space-s);
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: var(--space-xs);
  }

  &__mini-tile {
    background: var(--color-gray);
    border-radius: calc(var(--border-radius) / 2);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__figure {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--space-xs);
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    user-select: none;
    -webkit-user-drag: none;
    pointer-events: none;
  }

  &__title {
    font-size: 1em;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    position: absolute;
    bottom: var(--space-s);
    padding: .25em .5em;
    background-color: var(--card-color);
    border-radius: var(--border-radius);
  }

  &--empty {
    background-color: transparent;
    border: 2px dashed transparent;
    pointer-events: none;

    &.card-tile--edit-mode {
      background-color: var(--color-gray-light);
      border-color: color-mix(in srgb, var(--color-foreground), transparent 75%);
      pointer-events: auto;

      &:hover {
        // background-color: var(--color-gray);
        border-color: color-mix(in srgb, var(--color-foreground), transparent 25%);

      }
    }
  }

  &__empty-state {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-gray-dark);
    opacity: 0;

    .card-tile--edit-mode & {
      opacity: 1;
    }
  }
  
  &__selection-indicator {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 2rem;
    height: 2rem;
    background: var(--color-primary);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    animation: pop-in 0.2s ease;
  }

  &--edit-mode {
    cursor: move;
    
    &:hover {
      transform: scale(0.98);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
    }
  }

  &__wrapper {
    &--dragging {
      opacity: 0.5;
      cursor: grabbing !important;

      .card-tile {
        transform: scale(0.95);
      }
    }

    &--drag-ready {
      cursor: grab;

      .card-tile {
        transform: scale(0.98);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }


    &--can-drag {
      .card-tile--edit-mode {
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }
    }
  }
}

@keyframes pop-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
