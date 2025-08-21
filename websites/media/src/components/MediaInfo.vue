<template>
  <div :class="bemm()">
    <h1 :class="bemm('title')">{{ media.title || media.original_filename }}</h1>

    <div v-if="media.description" :class="bemm('description')">
      {{ media.description }}
    </div>

    <!-- Metadata -->
    <div :class="bemm('metadata')">
      <TKeyValue :items="metadataItems" />
    </div>

    <!-- Tags -->
    <div v-if="media.tags?.length" :class="bemm('tags')">
      <h3>{{ t('media.detail.tags', 'Tags') }}</h3>
      <TChipGroup>
        <TChip 
          v-for="tag in media.tags" 
          :key="tag"
          clickable
          @click="$emit('filter-by-tag', tag)"
        >
          {{ tag }}
        </TChip>
      </TChipGroup>
    </div>

    <!-- Categories -->
    <div v-if="media.categories?.length" :class="bemm('categories')">
      <h3>{{ t('media.detail.categories', 'Categories') }}</h3>
      <TChipGroup>
        <TChip 
          v-for="category in media.categories" 
          :key="category" 
          color="secondary"
          clickable
          @click="$emit('filter-by-category', category)"
        >
          {{ category }}
        </TChip>
      </TChipGroup>
    </div>

    <!-- Download Options -->
    <div :class="bemm('downloads')">
      <h3>{{ t('media.detail.downloadOptions', 'Download Options') }}</h3>
      <div :class="bemm('download-grid')">
        <TButton
          v-for="format in downloadFormats"
          :key="format.key"
          type="outline"
          :icon="Icons.ARROW_DOWN"
          @click="$emit('download', format)"
          :class="bemm('download-button')"
        >
          <div :class="bemm('download-info')">
            <span :class="bemm('download-label')">{{ format.label }}</span>
            <span :class="bemm('download-size')">{{ format.dimensions }}</span>
          </div>
        </TButton>
      </div>

      <!-- Original Download -->
      <TButton
        color="primary"
        :icon="Icons.ARROW_DOWN"
        @click="$emit('download-original')"
        :class="bemm('download-original')"
        size="large"
      >
        {{ t('media.detail.downloadOriginal', 'Download Original') }}
        <span :class="bemm('file-size')">{{ formatFileSize(media.file_size) }}</span>
      </TButton>
    </div>

    <!-- Share Options -->
    <div :class="bemm('share')">
      <h3>{{ t('media.detail.share', 'Share') }}</h3>
      <div :class="bemm('share-buttons')">
        <TButton
          type="ghost"
          :icon="Icons.LINK"
          @click="$emit('copy-link')"
          size="small"
        >
          {{ t('media.detail.copyLink', 'Copy Link') }}
        </TButton>
        <TButton
          type="ghost"
          :icon="Icons.CODE_BRACKETS"
          @click="$emit('copy-embed')"
          size="small"
        >
          {{ t('media.detail.copyEmbed', 'Copy Embed Code') }}
        </TButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import type { MediaItem } from '@tiko/ui'
import {
  TButton,
  TKeyValue,
  TChip,
  TChipGroup
} from '@tiko/ui'
import { useI18n } from '@tiko/core'

interface Props {
  media: MediaItem
}

const props = defineProps<Props>()

defineEmits<{
  'filter-by-tag': [tag: string]
  'filter-by-category': [category: string]
  'download': [format: { key: string; label: string; dimensions: string }]
  'download-original': []
  'copy-link': []
  'copy-embed': []
}>()

const bemm = useBemm('media-info')
const { t } = useI18n()

// Download formats
const downloadFormats = [
  { key: 'thumbnail', label: 'Thumbnail', dimensions: '200x200' },
  { key: 'small', label: 'Small', dimensions: '400x400' },
  { key: 'medium', label: 'Medium', dimensions: '800x800' },
  { key: 'large', label: 'Large', dimensions: '1024x1024' }
]

// Metadata items
const metadataItems = computed(() => {
  const media = props.media

  return [
    { key: t('media.detail.filename', 'Filename'), value: media.original_filename },
    { key: t('media.detail.fileSize', 'File Size'), value: formatFileSize(media.file_size) },
    { key: t('media.detail.uploadDate', 'Upload Date'), value: formatDate(media.created_at) },
    { key: t('media.detail.dimensions', 'Dimensions'), value: `${media.width || 'N/A'} × ${media.height || 'N/A'}` },
    { key: t('media.detail.format', 'Format'), value: media.mime_type || 'N/A' }
  ]
})

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style lang="scss">
.media-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);

  &__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    margin: 0;
  }

  &__description {
    color: var(--color-foreground-secondary);
  }

  &__metadata {
    background: var(--color-background-secondary);
    padding: var(--space);
    border-radius: var(--border-radius);
  }

  &__tags,
  &__categories,
  &__downloads,
  &__share {
    h3 {
      font-size: var(--font-size);
      font-weight: var(--font-weight-bold);
      margin: 0 0 var(--space-s) 0;
    }
  }

  &__download-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-s);
    margin-bottom: var(--space);
  }

  &__download-button {
    width: 100%;
    justify-content: flex-start;
  }

  &__download-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  &__download-label {
    font-weight: var(--font-weight-medium);
  }

  &__download-size {
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
  }

  &__download-original {
    width: 100%;
  }

  &__file-size {
    font-size: var(--font-size-s);
    color: var(--color-primary-text);
    opacity: 0.8;
  }

  &__share-buttons {
    display: flex;
    gap: var(--space-s);
  }
}
</style>