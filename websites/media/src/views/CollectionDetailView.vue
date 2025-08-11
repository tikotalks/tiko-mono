<template>
  <div :class="bemm()">
    <PageHeader>
      <template #title>{{ collection?.name || '' }}</template>
      <template #subtitle>{{ mediaCount }} {{ t('common.images', { count: mediaCount }) }}</template>
      <template #actions>
        <TButton
          v-if="collection && mediaItems.length > 0 && isOwner"
          @click="confirmDeleteAll"
          :icon="Icons.TRASH"
          variant="error"
          size="small"
        >
          {{ t('media.clearCollection') }}
        </TButton>
      </template>
    </PageHeader>

    <div v-if="loading || collectionLoading" :class="bemm('loading')">
      <TIcon :name="Icons.LOADER" size="large" />
    </div>

    <div v-else-if="accessError" :class="bemm('error')">
      <TIcon :name="Icons.ALERT_CIRCLE" size="xxlarge" />
      <p>{{ accessError }}</p>
      <TButton @click="goToCollections" :icon="Icons.ARROW_LEFT" variant="primary">
        {{ t('media.backToCollections') }}
      </TButton>
    </div>

    <div v-else-if="mediaItems.length === 0" :class="bemm('empty')">
      <TIcon :name="Icons.FOLDER" size="xxlarge" />
      <p>{{ t('media.emptyCollection') }}</p>
      <TButton @click="goToLibrary" :icon="Icons.IMAGE" variant="primary">
        {{ t('media.browseLibrary') }}
      </TButton>
    </div>

    <VirtualGrid
      v-else
      :items="mediaItems"
      :gap="16"
      :min-item-width="200"
    >
      <template #item="{ item }">
        <MediaTile
          :media="item"
          @click="viewMedia(item)"
        >
          <template #actions>
            <TButton
              v-if="isOwner"
              @click.stop="removeFromCollection(item.id)"
              :icon="Icons.X"
              variant="error"
              size="small"
              shape="circle"
              :title="t('media.removeFromCollection')"
            />
          </template>
        </MediaTile>
      </template>
    </VirtualGrid>

    <ConfirmDialog ref="confirmDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { useCollectionsStore, useImages, useImageUrl, useAuthStore } from '@tiko/core'
import type { MediaItem, PopupService } from '@tiko/ui'
import { TButton, TIcon, useI18n } from '@tiko/ui'
import PageHeader from '../components/PageHeader.vue'
import VirtualGrid from '../components/VirtualGrid.vue'
import MediaTile from '../components/MediaTile.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const bemm = useBemm('collection-detail-view')
const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const collectionsStore = useCollectionsStore()
const authStore = useAuthStore()
const { imageList, loading, loadImages } = useImages(true)
const popupService = inject<PopupService>('popupService')

const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const collectionLoading = ref(false)
const collectionData = ref<any>(null)
const accessError = ref<string | null>(null)

const collectionId = computed(() => route.params.id as string)
const isAuthenticated = computed(() => authStore.isAuthenticated)

const collection = computed(() => collectionData.value)

const mediaItems = computed(() => {
  if (!collection.value) return []
  return imageList.value.filter(image => 
    collection.value.media_ids.includes(image.id)
  )
})

const mediaCount = computed(() => collection.value?.media_ids.length || 0)

const isOwner = computed(() => {
  return collection.value && authStore.user && collection.value.user_id === authStore.user.id
})

const viewMedia = (media: MediaItem) => {
  router.push({
    name: 'media-detail',
    params: { id: media.id }
  })
}

const removeFromCollection = async (mediaId: string) => {
  const confirmed = await popupService?.confirm({
    title: t('media.removeFromCollection'),
    message: t('media.confirmRemoveFromCollection'),
    confirmText: t('common.remove'),
    cancelText: t('common.cancel'),
    confirmColor: 'error'
  })
  
  if (confirmed) {
    collectionsStore.removeFromCollection(collectionId.value, mediaId)
  }
}

const loadCollection = async () => {
  collectionLoading.value = true
  accessError.value = null
  
  try {
    const result = await collectionsStore.getCollection(collectionId.value)
    if (!result) {
      accessError.value = 'Collection not found or access denied'
      router.push({ name: 'collections' })
    } else {
      collectionData.value = result
    }
  } catch (error) {
    console.error('Failed to load collection:', error)
    accessError.value = 'Failed to load collection'
    router.push({ name: 'collections' })
  } finally {
    collectionLoading.value = false
  }
}

const confirmDeleteAll = async () => {
  const confirmed = await confirmDialog.value?.show({
    title: t('media.clearCollection'),
    message: t('media.confirmClearCollection', { name: collection.value?.name }),
    confirmText: t('common.clear'),
    confirmColor: 'error'
  })
  
  if (confirmed) {
    // For now, we'll clear by removing all items individually
    for (const mediaId of collection.value.media_ids) {
      await collectionsStore.removeFromCollection(collectionId.value, mediaId)
    }
  }
}

const goToLibrary = () => {
  router.push({ name: 'library' })
}

const goToCollections = () => {
  router.push({ name: 'collections' })
}

onMounted(async () => {
  await Promise.all([
    loadCollection(),
    loadImages()
  ])
})
</script>

<style lang="scss">
.collection-detail-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  &__loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .icon {
      animation: spin 1s linear infinite;
    }
  }

  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space);
    color: var(--color-foreground-secondary);
    text-align: center;
    padding: var(--space-xl);

    .icon {
      opacity: 0.3;
    }

    p {
      font-size: var(--font-size-lg);
      margin: 0;
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
}
</style>