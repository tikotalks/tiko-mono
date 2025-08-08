<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h1 :class="bemm('title')">{{ t('media.library.title') }}</h1>
      <p :class="bemm('description')">{{ t('media.library.description') }}</p>

      <div :class="bemm('filters')">
        <TInputText
          v-model="searchQuery"
          :placeholder="t('media.library.searchPlaceholder')"
          :icon="Icons.SEARCH_L"
          @input="searchImages(searchQuery)"
        />

        <TInputSelect
          v-model="categoryFilter"
          :label="t('media.library.category')"
          :options="categoryOptions"
        />

        <TViewToggle
          v-model="viewMode"
          :tiles-label="t('common.views.tiles')"
          :list-label="t('common.views.list')"
          :tiles-icon="Icons.BLOCK_PARTIALS"
          :list-icon="Icons.CHECK_LIST"
        />
      </div>
    </div>

    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <div v-else-if="filteredByCategoryImages.length === 0" :class="bemm('empty')">
      <TEmptyState
        :icon="Icons.IMAGE"
        :title="t('media.library.noImages')"
        :description="t('media.library.noImagesDescription')"
      />
    </div>

    <!-- Tiles View -->
    <TGrid
      v-else-if="viewMode === 'tiles'"
      :min-item-width="'300px'"
      :lazy="true"
      :lazy-root-margin="'100px'"
    >
      <router-link
        v-for="media in filteredByCategoryImages"
        :key="media.id"
        :to="`/media/${media.id}`"
        :class="bemm('tile-link')"
      >
        <TMediaTile
          :media="media"
          :get-image-variants="getImageVariants"
        />
      </router-link>
    </TGrid>

    <!-- List View -->
    <TList v-else :columns="listColumns" :show-stats="true">
      <router-link
        v-for="media in filteredByCategoryImages"
        :key="media.id"
        :to="`/media/${media.id}`"
        style="text-decoration: none; color: inherit;"
      >
        <TListItem clickable>
          <TListCell
            type="image"
            :image-src="getImageVariants(media.original_url).thumbnail"
            :image-alt="media.original_filename"
          />
          <TListCell
            type="text"
            :content="media.title || media.original_filename"
          />
          <TListCell type="chips" :chips="media.categories" :max-chips="2" />
          <TListCell type="size" :content="media.file_size" />
          <TListCell type="date" :content="media.created_at" />
        </TListItem>
      </router-link>
    </TList>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { useImageUrl, useImages } from '@tiko/core'
import {
  useI18n,
  TGrid,
  TMediaTile,
  TList,
  TListItem,
  TListCell,
  TInputSelect,
  TInputText,
  TViewToggle,
  TSpinner,
  TEmptyState
} from '@tiko/ui'

const bemm = useBemm('library-view')
const { t } = useI18n()
const { getImageVariants } = useImageUrl()
const { imageList, loading, searchImages, filteredImages, loadImages } = useImages(true) // Use public mode

// State
const searchQuery = ref('')
const categoryFilter = ref<string>('all')
const viewMode = ref<'tiles' | 'list'>('tiles')

// Computed
const categoryOptions = computed(() => {
  const categories = new Set<string>()
  imageList.value.forEach(img => {
    img.categories?.forEach(cat => categories.add(cat))
  })

  return [
    { value: 'all', label: t('common.all') },
    ...Array.from(categories).map(cat => ({ value: cat, label: cat }))
  ]
})

const listColumns = [
  { key: 'image', label: t('common.image'), width: '100px' },
  { key: 'title', label: t('common.title'), width: '1fr' },
  { key: 'categories', label: t('common.categories'), width: '200px' },
  { key: 'size', label: t('common.size'), width: '120px' },
  { key: 'date', label: t('common.uploadDate'), width: '150px' }
]

// Use filtered images from useImages and apply category filter
const filteredByCategoryImages = computed(() => {
  if (categoryFilter.value === 'all') {
    return filteredImages.value
  }
  return filteredImages.value.filter(img =>
    img.categories?.includes(categoryFilter.value)
  )
})

onMounted(() => {
  loadImages()
})
</script>

<style lang="scss">
.library-view {
  padding: var(--spacing);
  max-width: var(--max-width);
  margin: 0 auto;

  &__header {
    margin-bottom: var(--space-xl);
  }

  &__title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    margin: 0 0 var(--space-s) 0;
  }

  &__description {
    color: var(--color-foreground-secondary);
    margin: 0 0 var(--space-lg) 0;
  }

  &__filters {
    display: flex;
    gap: var(--space);
    align-items: center;
    flex-wrap: wrap;
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: var(--space-2xl);
  }

  &__empty {
    padding: var(--space-2xl);
  }

  &__tile-link {
    text-decoration: none;
    color: inherit;
    display: block;
  }
}
</style>
