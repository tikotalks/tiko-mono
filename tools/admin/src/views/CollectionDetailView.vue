<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="collection?.name || t('admin.collections.loading')"
      :description="collection?.description"
      show-back
      @back="router.push('/collections')"
    >
      <template #actions>
        <TButton
          v-if="isOwner"
          type="outline"
          :icon="Icons.PENCIL"
          @click="editCollection"
        >
          {{ t('common.edit') }}
        </TButton>

        <TButton
          v-if="!isOwner && collection"
          :type="collection.is_liked ? 'primary' : 'outline'"
          :icon="collection.is_liked ? Icons.HEART_FULL : Icons.HEART"
          @click="toggleLike"
          :disabled="togglingLike"
        >
          {{ collection.like_count || 0 }}
        </TButton>

        <TButton
          v-if="collection?.items"
          type="outline"
          :icon="Icons.ARROW_DOWNLOAD"
          @click="downloadCollection"
        >
          {{ t('admin.collections.download') }}
        </TButton>
      </template>

      <template #stats>
        <TKeyValue
          v-if="collection"
          :items="[
            { key: t('admin.collections.items'), value: String(collection.items?.length || 0) },
            { key: t('admin.collections.views'), value: String(collection.view_count) },
            { key: t('admin.collections.likes'), value: String(collection.like_count) },
            { key: t('admin.collections.visibility'), value: collection.is_public ? t('common.public') : t('common.private') }
          ]"
        />
      </template>
    </AdminPageHeader>

    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <div v-else-if="!collection" :class="bemm('not-found')">
      <TCard>
        <TIcon :name="Icons.FOLDER_X" size="large" />
        <p>{{ t('admin.collections.notFound') }}</p>
        <TButton color="primary" @click="router.push('/collections')">
          {{ t('admin.collections.backToCollections') }}
        </TButton>
      </TCard>
    </div>

    <div v-else :class="bemm('content')">
      <!-- Empty state -->
      <div v-if="!collection.items || collection.items.length === 0" :class="bemm('empty')">
        <TCard>
          <TIcon :name="Icons.FOLDER_OPEN" size="large" />
          <p>{{ t('admin.collections.emptyCollection') }}</p>
          <div v-if="isOwner" :class="bemm('empty-actions')">
            <TButton color="primary" @click="router.push('/library')">
              {{ t('admin.collections.browseLibrary') }}
            </TButton>
            <TButton color="outline" @click="router.push('/personal-library')">
              {{ t('admin.collections.browsePersonal') }}
            </TButton>
          </div>
        </TCard>
      </div>

      <!-- Collection items -->
      <TVirtualGrid
        v-else
        :items="collectionItems"
        :min-item-width="250"
        :gap="16"
        :aspect-ratio="'1:1'"
      >
        <template #default="{ item }">
          <TMediaTile
            :media="item.media"
            :get-image-variants="getImageVariants"
            :context-menu-items="getContextMenuItems(item)"
            @click="(e) => viewMedia(e, item)"
          >
            <template #content>
              <div :class="bemm('item-info')">
                <TChip :type="item.item_type === 'media' ? 'info' : 'success'" size="small">
                  {{ item.item_type === 'media' ? t('common.public') : t('common.personal') }}
                </TChip>
              </div>
            </template>
          </TMediaTile>
        </template>
      </TVirtualGrid>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icons } from 'open-icon';
import { useBemm } from 'bemm';
import { 
  useCollectionsStore,
  useAuthStore,
  useImageUrl,
  type MediaCollection,
  type CollectionItem
} from '@tiko/core';
import type { ToastService, PopupService } from '@tiko/ui';
import {
  useI18n,
  TCard,
  TButton,
  TIcon,
  TSpinner,
  TKeyValue,
  TChip,
  TVirtualGrid,
  TMediaTile
} from '@tiko/ui';
import AdminPageHeader from '../components/AdminPageHeader.vue';

const bemm = useBemm('collection-detail-view');
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toastService = inject<ToastService>('toastService');
const popupService = inject<PopupService>('popupService');
const collectionsStore = useCollectionsStore();
const authStore = useAuthStore();
const { getImageVariants } = useImageUrl();

// State
const loading = ref(false);
const togglingLike = ref(false);
const collection = ref<MediaCollection | null>(null);

// Computed
const collectionId = computed(() => route.params.id as string);
const isOwner = computed(() => collection.value?.user_id === authStore.user?.id);

const collectionItems = computed(() => {
  if (!collection.value?.items) return [];
  
  return collection.value.items.map(item => ({
    ...item,
    media: transformItemMedia(item)
  }));
});

// Transform item media based on type
const transformItemMedia = (item: CollectionItem) => {
  if (!item.media) return null;
  
  if (item.item_type === 'media') {
    // Public media is already in the right format
    return item.media;
  } else {
    // Transform user_media to match MediaItem interface
    return {
      id: item.media.id,
      original_url: item.media.url,
      original_filename: item.media.original_filename,
      title: item.media.original_filename,
      description: '',
      file_size: item.media.file_size,
      mime_type: item.media.mime_type,
      width: item.media.width,
      height: item.media.height,
      tags: item.media.metadata?.tags || [],
      categories: [item.media.usage_type],
      is_private: true,
      ai_analyzed: false,
      metadata: item.media.metadata,
      created_at: item.media.created_at,
      updated_at: item.media.updated_at
    };
  }
};

// Methods
const loadCollection = async () => {
  loading.value = true;
  try {
    collection.value = await collectionsStore.getCollection(collectionId.value, true);
  } catch (error) {
    console.error('Failed to load collection:', error);
    toastService?.show({
      message: t('admin.collections.loadFailed'),
      type: 'error'
    });
  } finally {
    loading.value = false;
  }
};

const editCollection = async () => {
  if (!collection.value || !popupService) return;

  const { default: EditCollectionDialog } = await import(
    '../components/dialogs/EditCollectionDialog.vue'
  );

  const popupId = popupService.open({
    component: EditCollectionDialog,
    title: t('admin.collections.editCollection'),
    props: {
      collection: collection.value,
      onSave: async (data: any) => {
        try {
          await collectionsStore.updateCollection(collection.value!.id, data);
          popupService.close({ id: popupId });
          toastService?.show({
            message: t('admin.collections.updateSuccess'),
            type: 'success'
          });
          await loadCollection(); // Reload to get updated data
        } catch (error) {
          console.error('Failed to update collection:', error);
          toastService?.show({
            message: t('admin.collections.updateFailed'),
            type: 'error'
          });
        }
      }
    }
  });
};

const toggleLike = async () => {
  if (!collection.value) return;

  togglingLike.value = true;
  try {
    const isLiked = await collectionsStore.toggleCollectionLike(collection.value.id);
    collection.value.is_liked = isLiked;
    collection.value.like_count = isLiked ? 
      (collection.value.like_count || 0) + 1 : 
      Math.max((collection.value.like_count || 0) - 1, 0);
  } catch (error) {
    console.error('Failed to toggle like:', error);
    toastService?.show({
      message: t('admin.collections.likeFailed'),
      type: 'error'
    });
  } finally {
    togglingLike.value = false;
  }
};

const viewMedia = async (e: Event, item: CollectionItem) => {
  e.preventDefault();
  
  if (item.item_type === 'media') {
    router.push(`/media/${item.item_id}`);
  } else {
    // For user media, we need to open the detail dialog
    if (!popupService) return;

    const { default: MediaDetailDialog } = await import(
      '../components/dialogs/MediaDetailDialog.vue'
    );

    popupService.open({
      component: MediaDetailDialog,
      title: item.media?.original_filename || t('admin.media.detail'),
      size: 'large',
      props: {
        media: item.media
      }
    });
  }
};

const getContextMenuItems = (item: CollectionItem) => {
  const items = [
    {
      id: 'view',
      label: t('common.view'),
      icon: Icons.EYE,
      action: () => viewMedia(new Event('click'), item)
    }
  ];

  if (isOwner.value) {
    items.push(
      {
        id: 'separator',
        type: 'separator' as const
      },
      {
        id: 'remove',
        label: t('admin.collections.removeFromCollection'),
        icon: Icons.FOLDER_MINUS,
        action: () => removeFromCollection(item)
      }
    );
  }

  return items;
};

const removeFromCollection = async (item: CollectionItem) => {
  if (!popupService) return;

  const { default: ConfirmDialog } = await import(
    '../components/dialogs/ConfirmDialog.vue'
  );

  const popupId = popupService.open({
    component: ConfirmDialog,
    title: t('admin.collections.removeFromCollection'),
    props: {
      message: t('admin.collections.confirmRemove'),
      confirmText: t('common.remove'),
      confirmColor: 'error',
      onConfirm: async () => {
        try {
          await collectionsStore.removeItemFromCollection(
            collectionId.value,
            item.item_id,
            item.item_type
          );
          
          popupService.close({ id: popupId });
          
          toastService?.show({
            message: t('admin.collections.removedFromCollection'),
            type: 'success'
          });

          // Reload collection to update items
          await loadCollection();
        } catch (error) {
          console.error('Failed to remove from collection:', error);
          toastService?.show({
            message: t('admin.collections.removeFailed'),
            type: 'error'
          });
        }
      }
    }
  });
};

const downloadCollection = async () => {
  // TODO: Implement collection download
  toastService?.show({
    message: t('admin.collections.downloadNotImplemented'),
    type: 'info'
  });
};

// Lifecycle
onMounted(() => {
  loadCollection();
});
</script>

<style lang="scss">
.collection-detail-view {
  padding: var(--space);
  display: flex;
  flex-direction: column;

  &__loading {
    display: flex;
    justify-content: center;
    padding: var(--space-xl);
  }

  &__not-found {
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

  &__content {
    flex: 1;
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

  &__empty-actions {
    display: flex;
    gap: var(--space);
    justify-content: center;
  }

  &__item-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-xs);
  }
}
</style>