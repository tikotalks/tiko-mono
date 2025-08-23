<template>
  <component
    :is="contextMenu && contextMenu.length > 0 && !isEmpty ? TContextMenu : 'div'"
    :class="bemm('container')"
    v-bind="contextMenu && contextMenu.length > 0 && !isEmpty ? {
      config: { menu: contextMenu, position: contextMenuPosition }
    } : {}"
    @menu-open="$emit('menu-open')"
    @menu-close="$emit('menu-close')"
  >
    <div ref="wrapperEl" :class="bemm('wrapper', ['',
      isDragging ? 'dragging' : '',
      canDrag ? 'can-drag' : '',
      isDragReady ? 'drag-ready' : '',
      isSelected ? 'selected' : '',
      selectionMode ? 'selection-mode' : '',
      isImageLoaded && displayImage && imageUrl ? 'image-loaded' : '',
      props.customState || ''
    ])" @click.stop="handleClick" @mousedown.stop="handleMouseDown" @mouseup.stop="handleMouseUp"
      @touchstart.stop="handleTouchStart" @touchend.stop="handleTouchEnd" @touchmove.stop="handleTouchMove"
      @touchcancel.stop="handleTouchEnd" :draggable="canDrag" @dragstart.stop="handleDragStart"
      @dragend.stop="handleDragEnd" @dragover.stop="handleDragOver" @dragleave.stop="handleDragLeave"
      @drop.stop="handleDrop">

      <article :class="tileClasses" @pointermove="setPointerPosition" :style="!isEmpty && card?.color ? {
        '--card-color': `var(--color-${card.color})`,
        '--card-text': `var(--color-${card.color}-text)`,
        '--x': `${pointer.x}`,
        '--y': `${pointer.y}`
      } : undefined" tabindex="0">
        <div v-if="isEmpty && editMode" :class="bemm('empty-state')">
          <TIcon name="plus" size="large" />
        </div>
        <div v-else :class="bemm('container')">
          <div :class="bemm('status')" v-if="isPublic || isCurated">
            <TIcon v-if="isCurated" :name="Icons.STAR_M" :tooltip="t('common.curated')"></TIcon>
            <TIcon v-else-if="isPublic" :name="Icons.ACCESSIBILITY_PERSON" :tooltip="t('common.public')"></TIcon>
          </div>

          <!-- Show mini grid for groups with children -->
          <div v-if="hasChildren && children?.length" :class="bemm('mini-grid')">
            <!-- Background image -->
            <div v-if="displayImage && imageUrl" :class="bemm('mini-grid-bg')"
              :style="{ backgroundImage: `url(${imageUrl})` }" />

            <!-- Mini tiles -->
            <div :class="bemm('mini-tiles')">
              <div v-for="(child, idx) in children.slice(0, 9)" :key="`mini-${child.id}-${idx}`" :class="bemm('mini-tile')"
                :style="child.color ? { backgroundColor: `var(--color-${child.color})` } : undefined">
                <img v-if="child.image" :src="getThumbnailUrl(child.image)" :alt="child.title" />
              </div>
            </div>
          </div>

          <!-- Regular tile content for non-groups -->
          <template v-else>
            <figure v-if="displayImage && imageUrl && isImageLoaded" :class="bemm('figure')">
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
  </component>
</template>
<script lang="ts" setup>
import { useBemm } from 'bemm';
import { ref, computed, watch, onMounted } from 'vue';
import { Icons } from 'open-icon';
import { useImageUrl, useI18n, useHaptic } from '@tiko/core';

import type { TCardTile, TCardTileProps } from './TCardTile.model';
import { TIcon } from '../../ui-elements/TIcon';
import { TContextMenu } from '../../navigation/TContextMenu';


const { t } = useI18n()
const haptic = useHaptic()

const bemm = useBemm('t-card-tile');
const { getImageVariants } = useImageUrl();

// Template refs
const wrapperEl = ref<HTMLElement>();

// Image loading state
const isImageLoaded = ref(false);
const isImageLoading = ref(false);

const props = defineProps<TCardTileProps>();

const emit = defineEmits<{
  click: [];
  dragstart: [event: DragEvent, card: TCardTile];
  dragend: [];
  dragover: [event: DragEvent];
  dragleave: [event: DragEvent];
  drop: [event: DragEvent];
  'menu-open': [];
  'menu-close': [];
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

// Computed property for context menu position based on grid position
const contextMenuPosition = computed(() => {
  if (!props.gridPosition) {
    return 'bottom-right'; // Default position
  }

  const { isRight, isBottom } = props.gridPosition;

  // Determine the best position based on card's grid position
  if (isBottom && isRight) {
    return 'top-left';
  } else if (isBottom) {
    return 'top-right';
  } else if (isRight) {
    return 'bottom-left';
  } else {
    return 'bottom-right'; // Default for cards not on edges
  }
});

// Computed property to get the correct image URL
const imageUrl = computed(() => {
  if (!props.card?.image) return '';

  // Try to get image variants if available
  try {
    const variants = getImageVariants(props.card.image);
    // Use large variant for better background images
    return variants.large || variants.medium || props.card.image;
  } catch {
    // Fallback to the original URL if getImageVariants fails
    return props.card.image;
  }
});

const isCurated = computed(() => {
  return props.card.isCurated;
})
const isPublic = computed(() => {
  return props.card.isPublic;
})

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

// Image loading logic
const loadImage = (url: string) => {
  if (!url) {
    isImageLoaded.value = false;
    isImageLoading.value = false;
    return;
  }

  isImageLoading.value = true;
  isImageLoaded.value = false;

  const img = new Image();
  img.onload = () => {
    isImageLoaded.value = true;
    isImageLoading.value = false;
  };
  img.onerror = () => {
    isImageLoaded.value = false;
    isImageLoading.value = false;
  };
  img.src = url;
};

// Watch for image URL changes
watch(imageUrl, (newUrl) => {
  if (newUrl && displayImage.value) {
    loadImage(newUrl);
  }
}, { immediate: true });

// Long press handling
const startLongPress = () => {
  if (!canDrag.value) return;

  longPressTimer.value = window.setTimeout(() => {
    isDragReady.value = true;
    // Add haptic feedback if available
    haptic.notification()
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

const handleTouchEnd = (_event: TouchEvent) => {
  cancelLongPress();
};

// Click handling
const handleClick = (_event: MouseEvent) => {
  // Only emit click if not drag ready
  if (!isDragReady.value) {
    // Add haptic feedback on click
    haptic.tap()
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

const tileClasses = computed(() => {
  return bemm('', [
    '',
    props.isEmpty ? 'empty' : 'filled',
    props.editMode ? 'edit-mode' : 'non-edit-mode',
    displayImage.value && imageUrl.value ? 'has-image' : 'no-image',
    isImageLoaded.value && displayImage.value && imageUrl.value ? 'pop-in' : '',
    props.card?.isHidden ? 'hidden' : ''
  ])
});


const pointer = ref({
  x: 0,
  y: 0
})

const setPointerPosition = (e: PointerEvent) => {
  const target = e.currentTarget as HTMLElement
  if (!target) return

  const rect = target.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100

  pointer.value = {
    x: Math.round(Math.max(0, Math.min(100, x)) * 100) / 100,
    y: Math.round(Math.max(0, Math.min(100, y)) * 100) / 100
  }
}
</script>

<style lang="scss">
.t-card-tile {
  width: 100%;
  height: 100%;
  border-radius: var(--border-radius);
  position: relative;
  // transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  color: var(--card-text);
  transition: all .2s ease-in-out;
  transform: scale(1);
  animation: tile-no-hover 0.2s ease-in-out forwards;
  z-index: 1;
  transform-style: preserve-3d;
  transform: 
    rotateX(calc(var(--rx, 0deg) * 0.5))
    rotateY(calc(var(--ry, 0deg) * 0.5))
    translateZ(calc(var(--tz, 0px) * 0.5))
    scale(1);

  &::before {
    --shine-color: color-mix(in srgb, var(--card-color), white 50%);
    --shine-size: 1px;
    content: "";
    display: block;
    position: absolute;
    left: calc(var(--shine-size) * -1);
    top: calc(var(--shine-size) * -1);
    width: calc(100% + (var(--shine-size) * 2));
    height: calc(100% + (var(--shine-size) * 2));

    border-radius: var(--border-radius);
    z-index: -2;
    background-image: radial-gradient(circle at calc(var(--x) * 1%) calc(var(--y) * 1%), var(--shine-color) 0%, rgba(0, 0, 0, 0) 50%);
  }


  &:hover {
    animation: tile-hover 0.2s ease-in-out forwards;

    .t-card-tile__image {
      transform: scale(1.1);

    }

    .t-card-tile__mini-grid {
      transform: scale(1.05);
    }
  }

  &:hover:focus {
    animation: tile-focus 0.2s ease-in-out forwards;
  }

  @keyframes tile-hover {
    0% {
      transform: scale(1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      opacity: 1;
    }

    100% {
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      opacity: 1;
    }
  }

  @keyframes tile-no-hover {
    0% {
      transform: scale(1.05);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      opacity: 1;
    }

    100% {
      transform: scale(1);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      opacity: 1;
    }
  }

  &__status {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
    background-color: var(--card-color);
    border-radius: var(--border-radius);
    opacity: .5;
    transition: .3s ease-in-out;

    &:hover {
      z-index: 100;
      opacity: 1;
    }

  }

  @keyframes tile-focus {
    0% {
      transform: scale(1.05);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      opacity: 1;
    }

    100% {
      transform: scale(.95);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      opacity: 1;
    }
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

  // Remove debug borders
  &--no-image {
    --card-title-bottom: 50%;
    --card-title-font-size: clamp(.75em, 3vw, 1.125em);
    --card-title-transform: translateY(50%);
  }

  &__container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: clamp(0.25rem, 1vw, var(--space-s));
    width: 100%;
    height: 100%;
    border-radius: inherit;
    position: relative;
    background-image: radial-gradient(circle at calc(var(--x) * 1%) calc(var(--y) * 1%), var(--card-color) 0%, color-mix(in srgb, var(--card-color), var(--color-background) 25%) 100%);

  }

  &__mini-grid {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: var(--border-radius);
    transform: scale(1);
    transition: .2s ease-in-out;
  }

  &__mini-grid-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    opacity: 0.5;
    filter: blur(1px);
    z-index: 0;
  }

  &__mini-tiles {
    position: relative;
    width: 100%;
    z-index: 1;
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
    flex: 1;
    min-height: 0;
  }

  &__image {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    user-select: none;
    -webkit-user-drag: none;
    pointer-events: none;
    transform: scale(1);
    transition: transform 0.2s ease-in-out;
  }

  &__title {
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    font-size: clamp(0.75rem, 2vw, 1rem);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    width: fit-content;
    font-size: var(--card-title-font-size, clamp(0.75rem, 2vw, 1rem));
    line-height: 1;
    z-index: 2;
    position: absolute;
    bottom: var(--card-title-bottom, var(--space-s));
    transform: var(--card-title-transform, translateY(0%));
    margin: auto;
    padding: .25em .5em;
    background-color: var(--card-color);
    border-radius: var(--border-radius);
    word-break: break-word;
    max-width: calc(100% - var(--space));
  }

  &--empty {
    --card-color: transparent;
    background-color: transparent;
    border: 2px dashed transparent;
    // pointer-events: none;

    &.t-card-tile--edit-mode {
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
    color: var(--color-gray);
    opacity: 0;

    .t-card-tile--edit-mode & {
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
    cursor: grab;

    // Disable pointer events on all child elements in edit mode
    * {
      pointer-events: none;
    }

    &:hover {
      transform: scale(0.98);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
    }
  }

  &--hidden {
    opacity: 0.5;
    filter: grayscale(20%);

    &:hover {
      opacity: 0.7;
    }
  }

  &__wrapper {
    &--dragging {
      opacity: 0.5;
      cursor: grabbing !important;

      .t-card-tile {
        transform: scale(0.95);
      }
    }

    &--drag-ready {
      cursor: grab;

      .t-card-tile {
        transform: scale(0.98);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }


    &--can-drag {
      .t-card-tile--edit-mode {
        cursor: grab;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;

        &:active {
          cursor: grabbing;
        }
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

@keyframes tile-image-pop-in {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
