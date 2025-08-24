<template>
  <component
    :is="href ? 'a' : 'div'"
    :class="bemm()"
    :href="href"
    @click="handleClick"
    ref="tileRef"
  >
    <!-- Actions Slot (positioned at top) -->
    <div v-if="$slots.actions" :class="bemm('actions')" @click.stop.prevent>
      <slot name="actions" />
    </div>

    <!-- Menu Slot (positioned at top) -->
    <div v-if="$slots.menu || contextMenuItems?.length" :class="bemm('menu')" @click.stop.prevent>
      <slot name="menu">
        <!-- Default Context Menu Button -->
        <TContextMenu
          v-if="contextMenuItems?.length"
          :config="{ position: 'bottom-right', menu: contextMenuItems }"
        >
          <TButton type="default" size="small" :icon="Icons.THREE_DOTS_VERTICAL" />
        </TContextMenu>
      </slot>
    </div>

    <!-- Image Container -->
    <div :class="bemm('image-container')">
      <!-- Empty State -->
      <div v-if="!hasMedia" :class="bemm('placeholder')">
        <TIcon :name="emptyIcon || Icons.IMAGE" size="large" />
      </div>

      <!-- Audio Player for Audio Files -->
      <template v-else-if="isAudioFile">
        <div :class="bemm('audio-player')">
          <TIcon :name="Icons.VOLUME_III" size="large" :class="bemm('audio-icon')" />
          <audio
            v-if="isVisible"
            :src="media?.original_url"
            :class="bemm('audio')"
            controls
            preload="metadata"
            @click.stop
          />
        </div>
      </template>

      <!-- Video Thumbnail with Play Button -->
      <template v-else-if="isVideoFile">
        <div :class="bemm('video-container')" @click.stop="handleVideoClick">
          <!-- Show thumbnail/poster -->
          <img
            v-if="media?.thumbnail_url && isVisible"
            :src="media.thumbnail_url"
            :alt="media.original_filename"
            :class="bemm('video-poster')"
            loading="lazy"
          />
          <div v-else :class="bemm('video-placeholder')">
            <TIcon :name="Icons.VIDEOS" size="large" />
          </div>
          
          <!-- Play button overlay -->
          <div :class="bemm('video-overlay')">
            <TIcon :name="Icons.CARET_RIGHT" size="large" />
          </div>
          
          <!-- Duration badge -->
          <div v-if="displayDuration" :class="bemm('video-duration')">
            {{ displayDuration }}
          </div>
        </div>
      </template>

      <!-- Single Image -->
      <template v-else-if="displayImages.length === 1">
        <div v-if="!isVisible || !imageLoaded" :class="bemm('placeholder')">
          <TIcon :name="Icons.IMAGE" size="large" />
        </div>
        <img
          v-if="isVisible"
          :src="getImageUrl(displayImages[0], 'medium')"
          :alt="displayImages[0].original_filename"
          loading="lazy"
          :class="bemm('image', ['', imageLoaded ? 'loaded' : ''])"
          @load="imageLoaded = true"
          @error="imageError = true"
        />
      </template>

      <!-- Multiple Images Grid -->
      <div v-else :class="bemm('grid-preview', ['',gridClass])">
        <div v-if="!isVisible" :class="bemm('placeholder')">
          <TIcon :name="Icons.IMAGE" size="large" />
        </div>
        <template
          v-else
          v-for="(image, index) in displayImages.slice(0, 4)"
          :key="image?.id || index"
        >
          <img
            v-if="image && image.original_url"
            :src="getImageUrl(image, 'thumbnail')"
            :alt="image.original_filename || 'Image'"
            :class="bemm('grid-image')"
            loading="lazy"
          />
        </template>
      </div>
    </div>

    <!-- Content Section -->
    <div
      v-if="displayTitle || description || meta || displayDuration || $slots.content"
      :class="bemm('content')"
    >
      <h4 v-if="displayTitle" :class="bemm('title')">{{ displayTitle }}</h4>
      <p v-if="description" :class="bemm('description')">{{ description }}</p>
      <span v-if="meta || displayDuration" :class="bemm('meta')">
        {{ meta || displayDuration }}
      </span>
      <slot name="content" />
    </div>

    <!-- Default slot for additional content -->
    <slot />
  </component>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted } from 'vue';
import { useBemm } from 'bemm';
import { Icons } from 'open-icon';
import TIcon from '../../ui-elements/TIcon/TIcon.vue';
import TButton from '../../ui-elements/TButton/TButton.vue';
import TContextMenu from '../../navigation/TContextMenu/TContextMenu.vue';
import type { TMediaTileProps, MediaItem } from './TMediaTile.model';

const props = withDefaults(defineProps<TMediaTileProps>(), {
  showId: true,
  aspectRatio: '3:2',
  emptyIcon: undefined,
  getImageVariants: undefined,
  contextMenuItems: undefined,
});

const emit = defineEmits<{
  click: [event: Event, media?: MediaItem];
  'video-play': [media: MediaItem];
}>();

const bemm = useBemm('t-media-tile');

// Refs
const tileRef = ref<HTMLElement>();
const imageLoaded = ref(false);
const imageError = ref(false);
const isVisible = ref(false);

// Check if parent grid has lazy loading enabled
const gridLazy = inject<any>('gridLazy', null);

// Computed
const media = computed(() => props.media);

const displayImages = computed(() => {
  if (props.images && props.images.length > 0) {
    return props.images;
  }
  if (props.media && !isAudioFile.value && !isVideoFile.value) {
    return [props.media];
  }
  return [];
});

const hasImages = computed(() => displayImages.value.length > 0);

const hasMedia = computed(() => hasImages.value || isAudioFile.value || isVideoFile.value);

const isAudioFile = computed(() => {
  if (!props.media) return false;
  const mimeType = props.media.type || '';
  const filename = props.media.original_filename || '';
  return mimeType.startsWith('audio/') ||
         filename.toLowerCase().endsWith('.mp3') ||
         filename.toLowerCase().endsWith('.wav') ||
         filename.toLowerCase().endsWith('.ogg') ||
         filename.toLowerCase().endsWith('.m4a');
});

const isVideoFile = computed(() => {
  if (!props.media) return false;
  const mimeType = props.media.type || '';
  const filename = props.media.original_filename || '';
  return mimeType.startsWith('video/') ||
         filename.toLowerCase().endsWith('.mp4') ||
         filename.toLowerCase().endsWith('.webm') ||
         filename.toLowerCase().endsWith('.ogg') ||
         filename.toLowerCase().endsWith('.mov') ||
         filename.toLowerCase().endsWith('.avi') ||
         filename.toLowerCase().endsWith('.mkv');
});

const displayTitle = computed(() => {
  if (props.title) return props.title;
  if (props.media) return props.media.title || props.media.original_filename;
  return '';
});

const gridClass = computed(() => {
  const count = displayImages.value.length;
  if (count === 2) return 'two';
  if (count === 3) return 'three';
  if (count >= 4) return 'four';
  return '';
});

const aspectRatioCss = computed(() => {
  if (!props.aspectRatio) return '3 / 2'; // Default if not provided
  const parts = props.aspectRatio.split(':');
  if (parts.length !== 2) return '3 / 2'; // Default if invalid format
  const [width, height] = parts.map(Number);
  if (!width || !height || isNaN(width) || isNaN(height)) return '3 / 2'; // Default if invalid numbers
  return `${width} / ${height}`;
});

const displayDuration = computed(() => {
  if (!props.media?.duration) return '';
  
  const duration = props.media.duration;
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return `0:${seconds.toString().padStart(2, '0')}`;
});

// Methods
const getImageUrl = (
  image: MediaItem,
  size: 'thumbnail' | 'medium' | 'large' = 'medium',
) => {
  if (props.getImageVariants && image.original_url) {
    return props.getImageVariants(image.original_url)[size];
  }
  return image.original_url;
};

const handleClick = (event: Event) => {
  if (!props.href) {
    event.preventDefault();
  }
  emit('click', event, props.media);
};

const handleVideoClick = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
  if (props.media) {
    emit('video-play', props.media);
  }
};

// Intersection Observer for lazy loading
let observer: IntersectionObserver | null = null;

onMounted(() => {
  // If lazy loading is disabled or not supported, show image immediately
  if (!gridLazy?.enabled || !window.IntersectionObserver) {
    isVisible.value = true;
    return;
  }

  // Small delay to ensure DOM is ready
  setTimeout(() => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisible.value = true;
            // Once visible, we can disconnect the observer
            observer?.disconnect();
          }
        });
      },
      {
        root: null, // Use viewport as root
        rootMargin: gridLazy.rootMargin || '50px',
        threshold: gridLazy.threshold || 0,
      },
    );

    if (tileRef.value) {
      observer.observe(tileRef.value);
    }
  }, 100);
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style lang="scss">
.t-media-tile {
  position: relative;
  cursor: pointer;
  border-radius: var(--border-radius);
  background: var(--color-background);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid color-mix(in srgb, var(--color-primary), transparent 75%);
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: var(--color-primary);
  }

  &__actions {
    position: absolute;
    top: var(--space-s);
    right: var(--space-s);
    z-index: 1;
    display: flex;
    gap: var(--space-xs);
  }

  &__menu {
    position: absolute;
    top: var(--space-s);
    right: var(--space-s);
    z-index: 2;
    opacity: 0;
    transition: opacity 0.2s;

    .t-button {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      &:hover {
        background: rgba(255, 255, 255, 1);
      }
    }
  }

  &:hover &__menu {
    opacity: 1;
  }

  &__image-container {
    position: relative;
    overflow: hidden;
    aspect-ratio: v-bind(aspectRatioCss);

    // Checkerboard pattern background
    --dot-color: color-mix(in srgb, var(--color-foreground), transparent 90%);
    background-image:
      linear-gradient(45deg, var(--dot-color) 25%, transparent 25%),
      linear-gradient(-45deg, var(--dot-color) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--dot-color) 75%),
      linear-gradient(-45deg, transparent 75%, var(--dot-color) 75%);
    background-size: 20px 20px;
    background-position:
      0 0,
      0 10px,
      10px -10px,
      -10px 0px;
  }

  &__placeholder {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-background-secondary);
    font-size: 4em;

    .icon {
      opacity: 0.25;
      transform: rotate(-10deg);
      animation: iconPulse 2s infinite;
      @keyframes iconPulse {
        0% {
          transform: rotate(-10deg) scale(1);
        }
        50% {
          transform: rotate(-10deg) scale(1.1);
        }
        100% {
          transform: rotate(-10deg) scale(1);
        }
      }
    }
  }

  &__audio-player {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-s);
    background: linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 100%);
    padding: var(--space-s);
  }

  &__audio-icon {
    color: var(--color-primary);
    opacity: 0.7;
  }

  &__audio {
    width: 100%;
    max-width: 280px;
    height: 40px;

    &:focus {
      outline: none;
    }

    // Style the audio controls
    &::-webkit-media-controls-panel {
      background-color: rgba(255, 255, 255, 0.9);
      border-radius: var(--border-radius);
    }

    &::-webkit-media-controls-play-button,
    &::-webkit-media-controls-pause-button {
      background-color: var(--color-primary);
      border-radius: 50%;
    }

    &::-webkit-media-controls-timeline {
      background-color: var(--color-primary-100);
      border-radius: var(--border-radius);
    }

    &::-webkit-media-controls-current-time-display,
    &::-webkit-media-controls-time-remaining-display {
      color: var(--color-foreground);
      font-size: 0.75rem;
    }
  }

  &__video-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    cursor: pointer;
    overflow: hidden;
    background: #000;
    
    &:hover {
      .t-media-tile__video-overlay {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.1);
      }
    }
  }

  &__video-poster {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__video-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-background-secondary);
    
    .icon {
      opacity: 0.5;
      color: var(--color-foreground-secondary);
    }
  }

  &__video-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    opacity: 0.7;
    transition: all 0.2s;
    width: 60px;
    height: 60px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    
    .icon {
      font-size: 2em;
      color: rgba(255, 255, 255, 0.95);
      margin-left: 4px; // Center play icon visually
    }
  }

  &__video-duration {
    position: absolute;
    bottom: var(--space-xs);
    right: var(--space-xs);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 2px 6px;
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    backdrop-filter: blur(10px);
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    opacity: 0;
    transition: opacity 0.3s;

    &--loaded {
      opacity: 1;
    }
  }

  &__grid-preview {
    display: grid;
    height: 100%;
    gap: 2px;
    background: var(--color-border);

    &--two {
      grid-template-columns: 1fr 1fr;
    }

    &--three {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;

      .t-media-tile__grid-image:first-child {
        grid-column: 1 / -1;
      }
    }

    &--four {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
    }
  }

  &__grid-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__content {
    padding: var(--space-s);
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    margin: 0;
    color: var(--color-foreground);
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__description {
    font-size: var(--font-size-xs);
    color: var(--color-foreground-secondary);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &__meta {
    font-size: var(--font-size-xs);
    color: var(--color-foreground-tertiary);
    margin: 0;
  }
}
</style>
