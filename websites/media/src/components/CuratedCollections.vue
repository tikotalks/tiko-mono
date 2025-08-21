<template>
  <section :class="bemm()">
    <!-- Debug info -->
    <div v-if="collectionsStore.isLoading" :class="bemm('loading')">
      Loading curated collections...
    </div>

    <div v-else-if="collectionsStore.error" :class="bemm('error')">
      Error loading collections: {{ collectionsStore.error }}
    </div>

    <div v-else-if="curatedCollections.length === 0" :class="bemm('empty')">
      <p>No curated collections available yet.</p>
      <p style="font-size: 0.9em; color: var(--color-text-secondary);">
        Debug info: {{ curatedCollections.length }} curated collections found
      </p>
    </div>

    <template v-else>
      <div :class="bemm('header')">
        <h2 :class="bemm('title')">{{ t('media.home.curatedCollections') }}</h2>
        <router-link to="/collections" :class="bemm('view-all')">
          {{ t('common.viewAll') }}
          <TIcon :name="Icons.ARROW_RIGHT" />
        </router-link>
      </div>

      <section :class="bemm('media-grid')">

    <TGrid :min-item-width="'350px'" :lazy="true">
      <router-link
        v-for="collection in curatedCollections"
        :key="collection.id"
        :to="`/collections/${collection.id}`"
        :class="bemm('link')"
      >
        <TMediaTile
          :media="collection"
          :get-image-variants="getImageVariants"
          :show-overlay="true"
        >
          <template #content>
            <div :class="bemm('curated-badge')">
              <TIcon :name="Icons.STAR_M" size="xs" />
              {{ t('media.collections.curated') }}
            </div>

            <div :class="bemm('collection-info')">
              <h4 :class="bemm('collection-name')">{{ collection.name }}</h4>
              <p v-if="collection.description" :class="bemm('collection-description')">
                {{ collection.description }}
              </p>

              <div :class="bemm('collection-stats')">
                <span :class="bemm('stat')">
                  <TIcon :name="Icons.IMAGE" size="xs" />
                  {{ collection.item_count || 0 }} {{ t('common.items') }}
                </span>
                <span :class="bemm('stat')">
                  <TIcon :name="Icons.EYE" size="xs" />
                  {{ formatNumber(collection.view_count || 0) }}
                </span>
                <span :class="bemm('stat')">
                  <TIcon :name="Icons.HEART" size="xs" />
                  {{ formatNumber(collection.like_count || 0) }}
                </span>
              </div>
            </div>
          </template>
        </TMediaTile>
      </router-link>
    </TGrid>      </section>

    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { useCollectionsStore, useImageUrl } from '@tiko/core'
import {
  useI18n,
  TGrid,
  TIcon,
  TMediaTile
} from '@tiko/ui'

const bemm = useBemm('curated-collections')
const { t } = useI18n()
const { getImageVariants } = useImageUrl()
const collectionsStore = useCollectionsStore()

// Props
interface Props {
  limit?: number
}

const props = withDefaults(defineProps<Props>(), {
  limit: 6
})

// Computed
const curatedCollections = computed(() => {
  const collections = collectionsStore.curatedCollections.slice(0, props.limit)
  console.log('Computed curatedCollections:', collections)
  return collections
})

// Helpers
const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

// Load collections on mount
onMounted(async () => {
  console.log('CuratedCollections - onMounted')
  console.log('Current curated collections:', collectionsStore.curatedCollections)
  console.log('Current curated collections length:', collectionsStore.curatedCollections.length)

  if (collectionsStore.curatedCollections.length === 0) {
    console.log('Loading curated collections...')
    try {
      await collectionsStore.loadCuratedCollections()
      console.log('Curated collections loaded:', collectionsStore.curatedCollections)
      console.log('Curated collections count:', collectionsStore.curatedCollections.length)
    } catch (error) {
      console.error('Failed to load curated collections:', error)
    }
  }
})
</script>

<style lang="scss">
.curated-collections {
  padding: var(--spacing);
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-l);
  }

  &__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    margin: 0;
  }

  &__view-all {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    color: var(--color-primary);
    text-decoration: none;
    font-weight: var(--font-weight-medium);

    &:hover {
      text-decoration: underline;
    }
  }

  &__link {
    text-decoration: none;
    color: inherit;
    display: block;
    height: 100%;
  }

  &__media-grid{}

  &__curated-badge {
    position: absolute;
    top: var(--space-s);
    right: var(--space-s);
    background: var(--color-background);
    color: var(--color-primary);
    padding: var(--space-xs) var(--space-s);
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    backdrop-filter: blur(10px);
    background: color-mix(in srgb, var(--color-background), transparent 10%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 2;
    display:none;
  }

  &__collection-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
    color: white;
    padding: var(--space);
    border-radius: 0 0 var(--border-radius) var(--border-radius);
  }

  &__collection-name {
    margin: 0 0 var(--space-xs) 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    line-height: 1.2;
    color: white;
  }

  &__collection-description {
    margin: 0 0 var(--space) 0;
    color: rgba(255, 255, 255, 0.9);
    font-size: var(--font-size-sm);
    line-height: 1.4;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &__collection-stats {
    display: flex;
    gap: var(--space);
    font-size: var(--font-size-sm);
    color: rgba(255, 255, 255, 0.8);
  }

  &__stat {
    display: flex;
    align-items: center;
    gap: var(--space-xs);

    .t-icon {
      color: var(--color-primary);
    }
  }

  &__loading,
  &__error,
  &__empty {
    padding: var(--space-xl);
    text-align: center;
    color: var(--color-text-secondary);
  }

  &__error {
    color: var(--color-error);
  }
}
</style>
