<template>
  <div :class="bemm()">
      <div :class="bemm('header')">
        <div :class="bemm('stats')">
            <p :class="bemm('stats-value')">{{ t('admin.library.totalImages') }}: {{ stats.totalImages }}</p>
        </div>

        <div :class="bemm('search')">
          <TInput
            v-model="searchQuery"
            :placeholder="t('admin.library.searchPlaceholder')"
            :icon="Icons.SEARCH_L"
            @input="searchImages(searchQuery)"
          />
        </div>

        <TViewToggle
          v-model="viewMode"
          :tiles-label="t('admin.library.viewToggle.tiles')"
          :list-label="t('admin.library.viewToggle.list')"
          :tiles-icon="Icons.GRID_3X3"
          :list-icon="Icons.LIST"
        />
      </div>

      <div v-if="loading" :class="bemm('loading')">
        <TSpinner />
      </div>

      <div v-else-if="imageList.length === 0" :class="bemm('empty')">
        <TCard>
          <TIcon :name="Icons.IMAGE" size="large" />
          <p>{{ t('admin.library.noImages') }}</p>
          <TButton color="primary" @click="router.push('/upload')">
            {{ t('admin.library.uploadFirst') }}
          </TButton>
        </TCard>
      </div>

      <!-- Tiles View -->
      <TGrid
        v-else-if="viewMode === 'tiles'"
        :min-item-width="'250px'"
      >
        <TMediaTile
          v-for="media in filteredImages"
          :key="media.id"
          :media="media"
          :href="`/media/${media.id}`"
          :get-image-variants="getImageVariants"
          @click="selectMedia"
        />
      </TGrid>

      <!-- List View -->
      <TList
        v-else
        :columns="listColumns"
      >
        <TListItem
          v-for="media in filteredImages"
          :key="media.id"
          :href="`/media/${media.id}`"
          clickable
          @click="(e) => selectMedia(e, media)"
        >
          <div :class="bemm('list-cell', 'image')">
            <img
              :src="getImageVariants(media.original_url).thumbnail"
              :alt="media.original_filename"
              loading="lazy"
              :class="bemm('list-image')"
            />
          </div>
          <div :class="bemm('list-cell', 'title')">
            <span :class="bemm('list-title')">{{ media.title || media.original_filename }}</span>
          </div>
          <div :class="bemm('list-cell', 'size')">
            <span>{{ formatBytes(media.file_size) }}</span>
          </div>
          <div :class="bemm('list-cell', 'tags')">
            <TChipGroup v-if="media.tags?.length" :class="bemm('list-chips')" direction="row">
              <TChip v-for="tag in media.tags.slice(0, 2)" :key="tag" size="small">{{ tag }}</TChip>
              <span v-if="media.tags.length > 2" :class="bemm('more-indicator')">
                +{{ media.tags.length - 2 }}
              </span>
            </TChipGroup>
          </div>
          <div :class="bemm('list-cell', 'categories')">
            <TChipGroup v-if="media.categories?.length" :class="bemm('list-chips')" direction="row">
              <TChip v-for="category in media.categories.slice(0, 2)" :key="category" size="small">{{ category }}</TChip>
              <span v-if="media.categories.length > 2" :class="bemm('more-indicator')">
                +{{ media.categories.length - 2 }}
              </span>
            </TChipGroup>
          </div>
          <div :class="bemm('list-cell', 'id')">
            <span :class="bemm('list-id')">{{ media.id }}</span>
          </div>
        </TListItem>
      </TList>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { useI18n } from '@tiko/ui'
import { TCard, TButton, TIcon, TSpinner, TInput, TChip, TChipGroup, TViewToggle } from '@tiko/ui'
import { Icons } from 'open-icon'
import { useImageUrl, useImages } from '@tiko/core'
import type { MediaItem } from '@tiko/core'
import type { ToastService } from '@tiko/ui'

const toastService = inject<ToastService>('toastService')
const { getImageVariants } = useImageUrl()
const { imageList, stats, loading, searchImages, filteredImages, loadImages } = useImages()

const bemm = useBemm('library-view')
const { t } = useI18n()
const router = useRouter()

const searchQuery = ref('')
const viewMode = ref<'tiles' | 'list'>('tiles')

const listColumns = [
  { key: 'image', label: t('common.image'), width: '80px' },
  { key: 'title', label: t('common.title'), width: '2fr' },
  { key: 'size', label: t('common.size'), width: '120px' },
  { key: 'tags', label: t('common.tags'), width: '1fr' },
  { key: 'categories', label: t('common.categories'), width: '1fr' },
  { key: 'id', label: 'ID', width: '100px' }
]

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const selectMedia = (e: Event, media: MediaItem) => {
  e.preventDefault()
  // Navigate to media detail page
  router.push(`/media/${media.id}`)
}


onMounted(() => {
  loadImages()
})
</script>

<style lang="scss">
.library-view {
  padding: var(--space);
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    gap: var(--space);
    align-items: flex-start;
    align-items: center;
    padding: var(--space);

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  &__stats {
    opacity: 0.5;


  }


  &__search {
    flex: 1;
    max-width: 400px;
  }

  &__view-toggle {
    display: flex;
    gap: var(--space-xs);
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: var(--space-xl);
  }

  &__empty {
    max-width: 400px;
    margin: var(--space-xl) auto;
    text-align: center;

    .t-icon {
      color: var(--color-text-secondary);
      margin-bottom: var(--space);
    }

    p {
      color: var(--color-text-secondary);
      margin-bottom: var(--space);
    }
  }

  // List View Styles for custom cells
  .t-list-item {
    grid-template-columns: 80px 2fr 120px 1fr 1fr 100px;
  }

  &__list-cell {
    display: flex;
    align-items: center;
    min-height: 60px;
    overflow: hidden;

    &--image {
      justify-content: center;
    }
  }

  &__list-image {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--color-border);
    
    // Checkerboard pattern for transparent images (smaller for list view)
    --dot-color: color-mix(in srgb, var(--color-foreground), transparent 90%);
    background-image:
      linear-gradient(45deg, var(--dot-color) 25%, transparent 25%),
      linear-gradient(-45deg, var(--dot-color) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--dot-color) 75%),
      linear-gradient(-45deg, transparent 75%, var(--dot-color) 75%);
    background-size: 10px 10px;
    background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
  }

  &__list-title {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__list-id {
    font-family: monospace;
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    opacity: 0.6;
  }

  &__list-chips {
    gap: var(--space-xs) !important;
    
    .t-chip {
      font-size: var(--font-size-xs);
    }
  }

  &__more-indicator {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    opacity: 0.6;
    padding: var(--space-xs);
  }

  // Responsive adjustments
  @media (max-width: 1024px) {
    .t-list-item {
      grid-template-columns: 60px 2fr 100px 1fr 80px;
    }
    
    &__list-cell--categories {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .t-list-item {
      grid-template-columns: 50px 1fr 80px 60px;
    }
    
    &__list-cell--tags {
      display: none;
    }
  }
}</style>
