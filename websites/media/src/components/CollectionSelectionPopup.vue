<template>
  <div :class="bemm()">
    <div v-if="collections.length === 0" :class="bemm('no-collections')">
      <p>{{ t('media.noCollections') }}</p>
    </div>
    <TGrid v-else :min-item-width="'120px'" :gap="'var(--space-s)'">
      <div
        v-for="collection in collectionsWithInfo"
        :key="collection.id"
        :class="bemm('collection-wrapper')"
      >
        <div
          :class="[bemm('collection-tile'), { [bemm('collection-tile', 'active')]: collection.containsMedia }]"
          @click="handleCollectionClick(collection)"
        >
          <TMediaTile
            :images="collection.previewImages"
            :title="collection.name"
            :meta="`${collection.count} ${t('common.images', { count: collection.count })}`"
            :empty-icon="Icons.FOLDER"
            :get-image-variants="getImageVariants"
            style="pointer-events: none"
          />
        </div>
        <div v-if="collection.containsMedia" :class="bemm('active-badge')">
          <TIcon :name="Icons.CHECK" size="small" />
        </div>
      </div>
    </TGrid>
    <TButton
      @click="createNewCollection"
      :icon="Icons.ADD"
      variant="primary"
      size="small"
      :class="bemm('create-collection-btn')"
    >
      {{ t('media.createCollection') }}
    </TButton>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { useImageUrl, useImages } from '@tiko/core'
import type { MediaItem, PopupService } from '@tiko/ui'
import { TButton, TIcon, TGrid, TMediaTile, useI18n } from '@tiko/ui'

interface Collection {
  id: string
  name: string
  media_ids: string[]
}

interface CollectionWithInfo extends Collection {
  previewImages: MediaItem[]
  count: number
  containsMedia: boolean
}

interface Props {
  collections: Collection[]
  mediaId: string
  onSelectCollection: (collectionId: string) => void
  onRemoveFromCollection?: (collectionId: string) => void
  onCreateNew: () => void
}

const props = withDefaults(defineProps<Props>(), {
  onRemoveFromCollection: undefined
})

const bemm = useBemm('collection-selection-popup')
const { t } = useI18n()
const { getImageVariants } = useImageUrl()
const { imageList } = useImages(true)
const popupService = inject<PopupService>('popupService')

// Compute collections with their images and status
const collectionsWithInfo = computed<CollectionWithInfo[]>(() => {
  return props.collections.map(collection => {
    const collectionImages = imageList.value.filter(image =>
      collection.media_ids.includes(image.id)
    )

    return {
      ...collection,
      count: collection.media_ids.length,
      previewImages: collectionImages.slice(0, 4),
      containsMedia: collection.media_ids.includes(props.mediaId)
    }
  })
})

const handleCollectionClick = async (collection: CollectionWithInfo) => {
  if (collection.containsMedia && props.onRemoveFromCollection) {
    // Show confirmation dialog
    const confirmed = await popupService?.confirm({
      title: 'Remove from Collection',
      message: `Are you sure you want to remove this item from "${collection.name}"?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      confirmColor: 'error'
    })
    
    if (confirmed) {
      props.onRemoveFromCollection?.(collection.id)
    }
  } else {
    props.onSelectCollection(collection.id)
  }
}

const createNewCollection = () => {
  props.onCreateNew()
}
</script>

<style lang="scss">
.collection-selection-popup {
  display: flex;
  flex-direction: column;
  gap: var(--space);
  padding: var(--space);
  max-width: 600px;

  &__no-collections {
    text-align: center;
    padding: var(--space-l);
    color: var(--color-foreground-secondary);
  }

  &__collection-wrapper {
    position: relative;
  }

  &__collection-tile {
    cursor: pointer;
    transition: all 0.2s ease;

    &--active {
      .t-media-tile {
        border-color: var(--color-success);
        border-width: 2px;
      }
    }

    &:hover {
      transform: translateY(-2px);
    }
  }

  &__active-badge {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
    background: var(--color-success);
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    pointer-events: none;
  }

  &__create-collection-btn {
    margin-top: var(--space);
    align-self: center;
  }

  // Override TGrid for this specific use
  .t-grid {
    max-height: 400px;
    overflow-y: auto;
    padding: var(--space-xs);
  }
}
</style>