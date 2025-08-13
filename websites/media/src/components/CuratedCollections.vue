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
    
    <TGrid :min-item-width="'350px'" :lazy="true">
      <router-link
        v-for="collection in curatedCollections"
        :key="collection.id"
        :to="`/collections/${collection.id}`"
        :class="bemm('link')"
      >
        <article :class="bemm('card')">
          <div :class="bemm('image')">
            <img 
              v-if="collection.cover_image_url" 
              :src="collection.cover_image_url" 
              :alt="collection.name"
              loading="lazy"
            />
            <div v-else :class="bemm('placeholder')">
              <TIcon :name="Icons.FOLDER" size="xl" />
            </div>
            
            <!-- Overlay badge -->
            <div :class="bemm('badge')">
              <TIcon :name="Icons.STAR" size="xs" />
              {{ t('media.collections.curated') }}
            </div>
          </div>
          
          <div :class="bemm('content')">
            <h3 :class="bemm('name')">{{ collection.name }}</h3>
            <p v-if="collection.description" :class="bemm('description')">
              {{ collection.description }}
            </p>
            
            <div :class="bemm('stats')">
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
        </article>
      </router-link>
    </TGrid>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { useCollectionsStore } from '@tiko/core'
import {
  useI18n,
  TGrid,
  TIcon
} from '@tiko/ui'

const bemm = useBemm('curated-collections')
const { t } = useI18n()
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

  &__card {
    background: var(--color-surface);
    border-radius: var(--border-radius);
    overflow: hidden;
    transition: all 0.3s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 
        0 12px 24px rgba(0, 0, 0, 0.15),
        0 4px 8px rgba(0, 0, 0, 0.1);
    }
  }

  &__image {
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: var(--color-background-secondary);
    position: relative;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .curated-collections__card:hover & img {
      transform: scale(1.05);
    }
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-primary), transparent 85%),
      color-mix(in srgb, var(--color-primary), transparent 95%)
    );
    
    .t-icon {
      color: var(--color-primary);
      opacity: 0.3;
    }
  }

  &__badge {
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
  }

  &__content {
    padding: var(--space);
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__name {
    margin: 0 0 var(--space-xs) 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    line-height: 1.2;
  }

  &__description {
    margin: 0 0 var(--space) 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    line-height: 1.5;
    flex: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &__stats {
    display: flex;
    gap: var(--space);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-top: auto;
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