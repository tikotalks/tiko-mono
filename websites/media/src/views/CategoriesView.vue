<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h1 :class="bemm('title')">{{ t('media.categories.title') }}</h1>
      <p :class="bemm('description')">{{ t('media.categories.description') }}</p>
    </div>

    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <div v-else-if="categories.length === 0" :class="bemm('empty')">
      <TEmptyState
        :icon="Icons.FOLDER"
        :title="t('media.categories.noCategories')"
        :description="t('media.categories.noCategoriesDescription')"
      />
    </div>

    <TGrid v-else :min-item-width="'150px'" :lazy="true">
      <router-link
        v-for="category in categories"
        :key="category.name"
        :to="{ path: '/library', query: { category: category.name } }"
        style="text-decoration: none; color: inherit; display: block;"
      >
        <CategoryCard
          :category="category"
        />
      </router-link>
    </TGrid>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { useImages } from '@tiko/core'
import type { MediaItem } from '@tiko/ui'
import {
  useI18n,
  TGrid,
  TSpinner,
  TEmptyState
} from '@tiko/ui'
import CategoryCard from '../components/CategoryCard.vue'

interface CategoryInfo {
  name: string
  count: number
  previewImages: MediaItem[]
}

const bemm = useBemm('categories-view')
const { t } = useI18n()
const { imageList, loading, loadImages } = useImages(true) // Use public mode

// Compute categories with their images
const categories = computed<CategoryInfo[]>(() => {
  const categoryMap = new Map<string, MediaItem[]>()

  // Group images by category
  imageList.value.forEach(image => {
    if (image.categories && image.categories.length > 0) {
      image.categories.forEach(category => {
        if (!categoryMap.has(category)) {
          categoryMap.set(category, [])
        }
        categoryMap.get(category)!.push(image)
      })
    }
  })

  // Convert to array and sort by count
  return Array.from(categoryMap.entries())
    .map(([name, images]) => ({
      name,
      count: images.length,
      previewImages: images.slice(0, 4) // Get first 4 images for preview
    }))
    .sort((a, b) => b.count - a.count) // Sort by count descending
})


onMounted(() => {
  loadImages()
})
</script>

<style lang="scss">
.categories-view {
  padding: var(--spacing);
  max-width: var(--max-width);
  margin: 0 auto;

  &__header {
    margin-bottom: var(--space-xl);
  }

  &__title {
  }

  &__description {
    color: var(--color-foreground-secondary);
    margin: 0;
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: var(--space-2xl);
  }

  &__empty {
    padding: var(--space-2xl);
  }

  // Override TGrid's mobile behavior to show 2 columns
  .t-grid {
    @media (max-width: 768px) {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }
}
</style>
