<template>
  <a
    :class="bemm()"
    :href="href"
    @click="handleClick"
  >
    <div :class="bemm('image-container')">
      <img
        :src="thumbnailUrl"
        :alt="media.original_filename"
        loading="lazy"
        :class="bemm('image')"
      />
      <div v-if="showOverlay && (media.tags?.length || media.categories?.length)" :class="bemm('overlay')">
        <div v-if="media.tags?.length" :class="bemm('overlay-section')">
          <h6 :class="bemm('overlay-title')">{{ t('common.tags') }}</h6>
          <TChipGroup :class="bemm('chip-group')" direction="row">
            <TChip v-for="tag in media.tags" :key="tag" size="small">{{ tag }}</TChip>
          </TChipGroup>
        </div>
        <div v-if="media.categories?.length" :class="bemm('overlay-section')">
          <h6 :class="bemm('overlay-title')">{{ t('common.categories') }}</h6>
          <TChipGroup :class="bemm('chip-group')" direction="row">
            <TChip v-for="category in media.categories" :key="category" size="small">{{ category }}</TChip>
          </TChipGroup>
        </div>
      </div>
    </div>
    
    <div :class="bemm('info')">
      <p :class="bemm('title')">{{ displayTitle }}</p>
      <p v-if="showId" :class="bemm('id')">ID: {{ media.id }}</p>
      <p :class="bemm('meta')">
        <span>{{ formatBytes(media.file_size) }}</span>
        <span v-if="media.tags?.length">• {{ media.tags.length }} {{ t('common.tags') }}</span>
        <span v-if="media.categories?.length">• {{ media.categories.length }} {{ t('common.categories') }}</span>
      </p>
    </div>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'
import { useI18n } from '../../composables/useI18n'
import { TChip, TChipGroup } from '../TChip'
import type { TMediaTileProps } from './TMediaTile.model'

const props = withDefaults(defineProps<TMediaTileProps>(), {
  showOverlay: true,
  showId: true,
  getImageVariants: undefined
})

const emit = defineEmits<{
  click: [event: Event, media: TMediaTileProps['media']]
}>()

const bemm = useBemm('t-media-tile')
const { t } = useI18n()

const displayTitle = computed(() => 
  props.media.title || props.media.original_filename
)

const thumbnailUrl = computed(() => {
  if (props.getImageVariants) {
    return props.getImageVariants(props.media.original_url).thumbnail
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
  }

  &__image {
    width: 100%;
    height: 200px;
    object-fit: contain;
    
    // Checkerboard pattern for transparent images
    --dot-color: color-mix(in srgb, var(--color-foreground), transparent 90%);
    background-image:
      linear-gradient(45deg, var(--dot-color) 25%, transparent 25%),
      linear-gradient(-45deg, var(--dot-color) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--dot-color) 75%),
      linear-gradient(-45deg, transparent 75%, var(--dot-color) 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  }

  &__overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: column;
    background-color: rgba(0, 0, 0, 0.7);
    color: var(--color-background);
    opacity: 0;
    transition: opacity 0.2s ease;
    padding: var(--space);
    overflow: auto;
    gap: var(--space-s);
    pointer-events: none;
  }

  &:hover &__overlay {
    opacity: 1;
    pointer-events: all;
  }

  &__overlay-section {
    width: 100%;
  }

  &__overlay-title {
    font-size: var(--font-size-sm);
    font-weight: 600;
    margin-bottom: var(--space-xs);
    color: var(--color-background);
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
    font-size: var(--font-size-sm);
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