<template>
  <section :class="bemm()">
    <div :class="bemm('header')">
      <h2 :class="bemm('title')">{{ t('media.collections.myCollections') }}</h2>
      <TButton
        @click="$emit('create')"
        size="small"
      >
        {{ t('media.collections.create') }}
      </TButton>
    </div>

    <div v-if="collectionsStore.isLoading" :class="bemm('loading')">
      {{ t('common.loading') }}...
    </div>
    
    <div v-else-if="myCollections.length === 0" :class="bemm('empty')">
      <TEmptyState
        :icon="Icons.FOLDER_PLUS"
        :title="t('media.collections.noCollections')"
        :description="t('media.collections.createFirstCollection')"
      >
        <TButton @click="$emit('create')">
          {{ t('media.collections.createFirst') }}
        </TButton>
      </TEmptyState>
    </div>
    
    <TGrid v-else :min-item-width="'350px'" :lazy="true">
      <router-link
        v-for="collection in myCollections"
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
            <div :class="bemm('collection-info')">
              <h3 :class="bemm('collection-name')">{{ collection.name }}</h3>
              <p v-if="collection.description" :class="bemm('collection-description')">
                {{ collection.description }}
              </p>
              
              <div :class="bemm('collection-stats')">
                <span :class="bemm('stat')">
                  <TIcon :name="Icons.IMAGE" size="xs" />
                  {{ collection.item_count || 0 }} {{ t('common.items') }}
                </span>
                <span v-if="collection.is_public" :class="bemm('stat')">
                  <TIcon :name="Icons.EYE" size="xs" />
                  {{ formatNumber(collection.view_count || 0) }}
                </span>
              </div>
            </div>
          </template>
        </TMediaTile>
      </router-link>
    </TGrid>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { useAuthStore, useCollectionsStore, useImageUrl } from '@tiko/core'
import {
  useI18n,
  TEmptyState,
  TButton,
  TGrid,
  TIcon,
  TMediaTile
} from '@tiko/ui'

// Emits
defineEmits<{
  create: []
}>()

const bemm = useBemm('my-collections')
const { t } = useI18n()
const { getImageVariants } = useImageUrl()
const authStore = useAuthStore()
const collectionsStore = useCollectionsStore()

// Computed
const myCollections = computed(() => {
  return collectionsStore.collections.filter(collection => 
    collection.user_id === authStore.user?.id
  )
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
  if (authStore.user) {
    await collectionsStore.loadCollections()
  }
})
</script>

<style lang="scss">
.my-collections {
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

  &__loading {
    text-align: center;
    padding: var(--space-xl);
    color: var(--color-text-secondary);
  }

  &__empty {
    padding: var(--space-xl);
  }

  &__link {
    text-decoration: none;
    color: inherit;
    display: block;
    height: 100%;
  }

  &__collection-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
    color: white;
    padding: var(--space-xl) var(--space) var(--space);
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
}
</style>