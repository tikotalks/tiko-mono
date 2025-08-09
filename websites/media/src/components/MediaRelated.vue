<template>
  <div v-if="relatedItems.length > 0" :class="bemm()">
    <h2 :class="bemm('title')">{{ t('media.detail.relatedItems', 'Related Images') }}</h2>
    <TGrid :min-item-width="'250px'" :lazy="true">
      <router-link
        v-for="relatedMedia in relatedItems"
        :key="relatedMedia.id"
        :to="`/media/${relatedMedia.id}`"
        :class="bemm('link')"
      >
        <TMediaTile
          :media="relatedMedia"
          :get-image-variants="getImageVariants"
        />
      </router-link>
    </TGrid>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'
import { useImageUrl } from '@tiko/core'
import type { MediaItem } from '@tiko/ui'
import {
  useI18n,
  TGrid,
  TMediaTile
} from '@tiko/ui'

interface Props {
  currentMedia: MediaItem
  allMedia: MediaItem[]
  maxItems?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxItems: 24
})

const bemm = useBemm('media-related')
const { t } = useI18n()
const { getImageVariants } = useImageUrl()

// Related items with scoring algorithm
const relatedItems = computed(() => {
  if (!props.currentMedia || props.allMedia.length === 0) return []

  const currentCategories = props.currentMedia.categories || []
  const currentTags = props.currentMedia.tags || []

  // Score each media item based on shared categories and tags
  const scoredItems = props.allMedia
    .filter(item => item.id !== props.currentMedia.id) // Exclude current media
    .map(item => {
      let score = 0
      const itemCategories = item.categories || []
      const itemTags = item.tags || []

      // Score for shared categories (weight: 2 points each)
      const sharedCategories = currentCategories.filter(cat => itemCategories.includes(cat))
      score += sharedCategories.length * 2

      // Score for shared tags (weight: 1 point each)
      const sharedTags = currentTags.filter(tag => itemTags.includes(tag))
      score += sharedTags.length * 1

      return {
        media: item,
        score,
        sharedCategories,
        sharedTags
      }
    })
    .filter(item => item.score > 0) // Only include items with at least one match
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .slice(0, props.maxItems) // Limit to max items

  return scoredItems.map(item => item.media)
})
</script>

<style lang="scss">
.media-related {
  margin-top: var(--space-2xl);
  padding-top: var(--space-2xl);
  border-top: 1px solid var(--color-border);

  &__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    margin: 0 0 var(--space-lg) 0;
  }

  &__link {
    text-decoration: none;
    color: inherit;
    display: block;
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-2px);
    }
  }
}
</style>