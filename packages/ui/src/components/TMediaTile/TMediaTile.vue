<template>
  <a
    :class="bemm()"
    :href="href"
    @click="handleClick"
    ref="tileRef"
  >
    <div :class="bemm('image-container')">
      <div v-if="!isVisible || !imageLoaded" :class="bemm('placeholder')">
        <TIcon :name="Icons.IMAGE" size="large" />
      </div>
      <img
        v-if="isVisible"
        :src="thumbnailUrl"
        :alt="media.original_filename"
        loading="lazy"
        :class="bemm('image', ['', imageLoaded ? 'loaded' :''])"
        @load="imageLoaded = true"
        @error="imageError = true"
      />
    </div>

    <div :class="bemm('info')">
      <p :class="bemm('title')">{{ displayTitle }}</p>
    </div>
  </a>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { useI18n } from '../../composables/useI18n'
import { TIcon } from '../TIcon'
import type { TMediaTileProps } from './TMediaTile.model'

const props = withDefaults(defineProps<TMediaTileProps>(), {
  showId: true,
  getImageVariants: undefined
})

const emit = defineEmits<{
  click: [event: Event, media: TMediaTileProps['media']]
}>()

const bemm = useBemm('t-media-tile')
const { t } = useI18n()

// Refs
const tileRef = ref<HTMLElement>()
const imageLoaded = ref(false)
const imageError = ref(false)
const isVisible = ref(false)

// Check if parent grid has lazy loading enabled
const gridLazy = inject<any>('gridLazy', null)

const displayTitle = computed(() =>
  props.media.title || props.media.original_filename
)

const thumbnailUrl = computed(() => {
  if (props.getImageVariants) {
    return props.getImageVariants(props.media.original_url).medium
  }
  return props.media.original_url
})

const href = computed(() => props.href || `#${props.media.id}`)

const handleClick = (event: Event) => {
  emit('click', event, props.media)
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Intersection Observer for lazy loading
let observer: IntersectionObserver | null = null

onMounted(() => {
  // If lazy loading is disabled or not supported, show image immediately
  if (!gridLazy?.enabled || !window.IntersectionObserver) {
    isVisible.value = true
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible.value = true
          // Once visible, we can disconnect the observer
          observer?.disconnect()
        }
      })
    },
    {
      rootMargin: gridLazy.rootMargin,
      threshold: gridLazy.threshold
    }
  )

  if (tileRef.value) {
    observer.observe(tileRef.value)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style lang="scss">
.t-media-tile {
  position: relative;
  cursor: pointer;
  border-radius: var(--border-radius);
  overflow: hidden;
  background: var(--color-background);
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid color-mix(in srgb, var(--color-primary), transparent 75%);
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &__image-container {
    position: relative;
    overflow: hidden;
    height: 200px;

    // Checkerboard pattern background
    --dot-color: color-mix(in srgb, var(--color-foreground), transparent 90%);
    background-image:
      linear-gradient(45deg, var(--dot-color) 25%, transparent 25%),
      linear-gradient(-45deg, var(--dot-color) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--dot-color) 75%),
      linear-gradient(-45deg, transparent 75%, var(--dot-color) 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
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

    .t-icon {
      color: var(--color-foreground-secondary);
      opacity: 0.3;
    }
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

  &__chip-group {
    gap: var(--space-xs);

    .t-chip {
      background: rgba(255, 255, 255, 0.2);
      color: var(--color-background);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
  }

  &__info {
    padding: var(--space-s) var(--space);
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__title {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin: 0;
  }

  &__id {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    font-family: monospace;
    opacity: 0.6;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin: 0;
  }

  &__meta {
    font-size: var(--font-size-s);
    color: var(--color-text-secondary);
    display: flex;
    gap: var(--space-xs);
    opacity: 0.5;
    margin: 0;

    span {
      white-space: nowrap;
    }
  }
}
</style>
