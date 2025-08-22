<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="t('admin.collections.title')"
      :description="t('admin.collections.description')"
    >
      <template #actions>
        <TButton
          type="outline"
          :icon="Icons.ARROW_ROTATE_TOP_LEFT"
          @click="refresh"
          :disabled="loading"
        >
          {{ t('common.refresh') }}
        </TButton>

        <TButton
          color="primary"
          :icon="Icons.PLUS"
          @click="createNewCollection"
        >
          {{ t('admin.collections.createCollection') }}
        </TButton>
      </template>

      <template #inputs>
        <TInputText
          v-model="searchQuery"
          :label="t('common.search')"
          :placeholder="t('common.searchPlaceholder')"
          :icon="Icons.SEARCH_M"
        />

        <TInputSelect
          v-model="filterType"
          :label="t('admin.collections.filter')"
          :options="filterOptions"
        />

        <TViewToggle
          v-model="viewMode"
          :tiles-label="t('common.views.tiles')"
          :list-label="t('common.views.list')"
        />
      </template>

      <template #stats>
        <TKeyValue
          :items="[
            { key: t('admin.collections.totalVisible'), value: String(stats.total) },
            { key: t('admin.collections.myCollections'), value: String(stats.mine) },
            { key: t('admin.collections.publicCollections'), value: String(stats.public) },
            { key: t('admin.collections.curatedCollections'), value: String(stats.curated) }
          ]"
        />
      </template>
    </AdminPageHeader>

    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <div v-else-if="collectionsStore.error" :class="bemm('error')">
      <TCard>
        <TIcon :name="Icons.TRIANGLE_WARNING" size="large" />
        <p>{{ t('admin.collections.loadError') }}: {{ collectionsStore.error }}</p>
        <p class="error-details">{{ t('admin.collections.migrationRequired') }}</p>
        <TButton color="primary" @click="refresh">
          {{ t('common.retry') }}
        </TButton>
      </TCard>
    </div>

    <div v-else-if="filteredCollections.length === 0" :class="bemm('empty')">
      <TCard>
        <TIcon :name="Icons.FOLDER" size="large" />
        <p>{{ getEmptyMessage() }}</p>
        <TButton color="primary" @click="createNewCollection">
          {{ t('admin.collections.createFirst') }}
        </TButton>
      </TCard>
    </div>

    <!-- Tiles View -->
    <TVirtualGrid
      v-else-if="viewMode === 'tiles'"
      :items="filteredCollections"
      :min-item-width="250"
      :gap="16"
      :aspect-ratio="'1:1'"
    >
      <template #default="{ item }">
        <TMediaTile
          :media="convertCollectionToMediaItem(item)"
          :get-image-variants="getImageVariants"
          :context-menu-items="getContextMenuItems(item)"
          @click="() => openCollection(item)"
        >
          <template #content>
            <!-- Collection Type Badge -->
            <div :class="bemm('collection-type')">
              <TChip v-if="item.is_curated" type="success" size="small">
                {{ t('admin.collections.curated') }}
              </TChip>
              <TChip v-else-if="item.is_public" type="info" size="small">
                {{ t('common.public') }}
              </TChip>
              <TChip v-else type="default" size="small">
                {{ t('common.private') }}
              </TChip>
            </div>

            <!-- Stats Badge -->
            <div :class="bemm('collection-stats')">
              <TChip type="default" size="small">
                {{ item.item_count || 0 }} {{ t('common.items') }}
              </TChip>
            </div>
          </template>
        </TMediaTile>
      </template>
    </TVirtualGrid>

    <!-- List View -->
    <TList v-else :columns="listColumns">
      <TListItem
        v-for="collection in filteredCollections"
        :key="collection.id"
        clickable
        @click="openCollection(collection)"
      >
        <TListCell
          type="image"
          :image-src="collection.cover_image_url || getDefaultCover()"
          :image-alt="collection.name"
        />
        <TListCell
          type="text"
          :content="collection.name"
        />
        <TListCell type="custom">
          <div :class="bemm('badges')">
            <TChip v-if="collection.is_public" type="info" size="small">
              {{ t('common.public') }}
            </TChip>
            <TChip v-if="collection.is_curated" type="success" size="small">
              {{ t('admin.collections.curated') }}
            </TChip>
          </div>
        </TListCell>
        <TListCell
          type="text"
          :content="collection.owner?.username || t('common.unknown')"
        />
        <TListCell
          type="number"
          :content="collection.items?.length || 0"
          :suffix="t('common.items')"
        />
        <TListCell
          type="number"
          :content="collection.view_count"
          :suffix="t('common.views')"
        />
        <TListCell
          type="number"
          :content="collection.like_count"
          :suffix="t('common.likes')"
        />
        <TListCell type="custom">
          <div :class="bemm('actions')">
            <TButton
              type="ghost"
              size="small"
              :icon="Icons.PENCIL"
              @click.stop="editCollection(collection)"
            />
            <TButton
              type="ghost"
              size="small"
              :icon="collection.is_curated ? Icons.STAR_FULL : Icons.STAR"
              @click.stop="toggleCurated(collection)"
            />
            <TButton
              type="ghost"
              size="small"
              :icon="Icons.TRASH"
              @click.stop="deleteCollection(collection)"
            />
          </div>
        </TListCell>
      </TListItem>
    </TList>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue';
import { useRouter } from 'vue-router';
import { Icons } from 'open-icon';
import { useBemm } from 'bemm';
import {
  useCollectionsStore,
  useAuthStore,
  useImageUrl,
  useI18n,
  type MediaCollection
} from '@tiko/core';
import type { ToastService, PopupService } from '@tiko/ui';
import {
  TCard,
  TButton,
  TIcon,
  TSpinner,
  TVirtualGrid,
  TList,
  TListItem,
  TListCell,
  TInputSelect,
  TInputText,
  TKeyValue,
  TChip,
  TViewToggle,
  TMediaTile
} from '@tiko/ui';
import AdminPageHeader from '../components/AdminPageHeader.vue';

const toastService = inject<ToastService>('toastService');
const popupService = inject<PopupService>('popupService');
const collectionsStore = useCollectionsStore();
const authStore = useAuthStore();
const { getImageVariants } = useImageUrl();

const bemm = useBemm('collections-view');
const { t } = useI18n();
const router = useRouter();

// State
const loading = ref(false);
const searchQuery = ref('');
const viewMode = ref<'tiles' | 'list'>('tiles');
const filterType = ref<'all' | 'mine' | 'public' | 'curated'>('all');

// Options
const filterOptions = [
  { value: 'all', label: t('common.all') },
  { value: 'mine', label: t('admin.collections.myCollections') },
  { value: 'public', label: t('admin.collections.publicCollections') },
  { value: 'curated', label: t('admin.collections.curatedCollections') }
];

const listColumns = [
  { key: 'image', label: t('common.image'), width: '80px' },
  { key: 'name', label: t('common.name'), width: '200px' },
  { key: 'badges', label: t('common.status'), width: '150px' },
  { key: 'owner', label: t('common.owner'), width: '150px' },
  { key: 'items', label: t('common.items'), width: '100px' },
  { key: 'views', label: t('common.views'), width: '100px' },
  { key: 'likes', label: t('common.likes'), width: '100px' },
  { key: 'actions', label: t('common.actions'), width: '150px' }
];

// Computed
const filteredCollections = computed(() => {
  const allCollections = collectionsStore.allCollections || [];
  let collections = [...allCollections];

  // Apply filter
  switch (filterType.value) {
    case 'mine':
      collections = collections.filter(c => c.user_id === authStore.user?.id);
      break;
    case 'public':
      collections = collections.filter(c => c.is_public);
      break;
    case 'curated':
      collections = collections.filter(c => c.is_curated);
      break;
  }

  // Apply search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    collections = collections.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query) ||
      c.owner?.username?.toLowerCase().includes(query)
    );
  }

  return collections;
});

const stats = computed(() => {
  const allCollections = collectionsStore.allCollections || [];
  return {
    total: allCollections.length,
    mine: allCollections.filter(c => c.user_id === authStore.user?.id).length,
    public: allCollections.filter(c => c.is_public).length,
    curated: allCollections.filter(c => c.is_curated).length
  };
});

// Convert Collection to MediaItem for TMediaTile compatibility
const convertCollectionToMediaItem = (collection: MediaCollection) => {
  return {
    id: collection.id,
    original_url: collection.cover_image_url || '',
    original_filename: collection.name,
    title: collection.name,
    description: collection.description || '',
    file_size: 0,
    mime_type: 'image/jpeg',
    width: 300,
    height: 300,
    tags: [],
    categories: collection.is_curated ? ['curated'] : ['collection'],
    is_private: !collection.is_public,
    ai_analyzed: false,
    metadata: {
      item_count: collection.item_count || 0,
      view_count: collection.view_count || 0,
      like_count: collection.like_count || 0
    },
    created_at: collection.created_at,
    updated_at: collection.updated_at
  };
};

// Context menu items for collection tiles
const getContextMenuItems = (collection: MediaCollection) => {
  const items = [
    {
      id: 'view',
      label: t('common.view'),
      icon: Icons.EYE,
      action: () => openCollection(collection)
    }
  ];

  // Only show edit options if user owns the collection
  if (collection.user_id === authStore.user?.id) {
    items.push(
      {
        id: 'edit',
        label: t('common.edit'),
        icon: Icons.PENCIL,
        action: () => editCollection(collection)
      },
      {
        id: 'separator-1',
        type: 'separator' as const
      },
      {
        id: 'toggle-public',
        label: collection.is_public ? t('admin.collections.makePrivate') : t('admin.collections.makePublic'),
        icon: collection.is_public ? Icons.LOCK : Icons.GLOBE,
        action: () => togglePublic(collection)
      }
    );

    // Only show curated toggle for admins
    // TODO: Add admin check when admin role system is ready
    items.push({
      id: 'toggle-curated',
      label: collection.is_curated ? t('admin.collections.removeCurated') : t('admin.collections.makeCurated'),
      icon: collection.is_curated ? Icons.STAR_FULL : Icons.STAR,
      action: () => toggleCurated(collection)
    });

    items.push(
      {
        id: 'separator-2',
        type: 'separator' as const
      },
      {
        id: 'delete',
        label: t('common.delete'),
        icon: Icons.TRASH,
        action: () => deleteCollection(collection)
      }
    );
  }

  return items;
};

// Methods
const getDefaultCover = () => {
  return '';
};

const getEmptyMessage = () => {
  switch (filterType.value) {
    case 'mine':
      return t('admin.collections.noMyCollections');
    case 'public':
      return t('admin.collections.noPublicCollections');
    case 'curated':
      return t('admin.collections.noCuratedCollections');
    default:
      return t('admin.collections.noCollections');
  }
};

const refresh = async () => {
  loading.value = true;
  try {
    await collectionsStore.loadAllCollections();
  } catch (error) {
    console.error('Failed to refresh collections:', error);
    toastService?.show({
      message: t('admin.collections.refreshFailed'),
      type: 'error'
    });
  } finally {
    loading.value = false;
  }
};

const createNewCollection = async () => {
  // Open create collection dialog
  const { default: CreateCollectionDialog } = await import(
    '../components/dialogs/CreateCollectionDialog.vue'
  );

  const popupId = popupService.open({
    component: CreateCollectionDialog,
    title: t('admin.collections.createCollection'),
    props: {
      onSave: async (data: any) => {
        try {
          await collectionsStore.createCollection(data);
          popupService.close({ id: popupId });
          toastService?.show({
            message: t('admin.collections.createSuccess'),
            type: 'success'
          });
          // Refresh the collections list to show the new collection
          await collectionsStore.loadAllCollections();
        } catch (error) {
          console.error('Failed to create collection:', error);
          toastService?.show({
            message: t('admin.collections.createFailed'),
            type: 'error'
          });
        }
      }
    }
  });
};

const openCollection = (collection: MediaCollection) => {
  router.push(`/collections/${collection.id}`);
};

const editCollection = async (collection: MediaCollection) => {
  const { default: EditCollectionDialog } = await import(
    '../components/dialogs/EditCollectionDialog.vue'
  );

  const popupId = popupService.open({
    component: EditCollectionDialog,
    title: t('admin.collections.editCollection'),
    props: {
      collection,
      onSave: async (data: any) => {
        try {
          await collectionsStore.updateCollection(collection.id, data);
          popupService.close({ id: popupId });
          toastService?.show({
            message: t('admin.collections.updateSuccess'),
            type: 'success'
          });
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

const deleteCollection = async (collection: MediaCollection) => {
  if (!confirm(t('admin.collections.confirmDelete', { name: collection.name }))) {
    return;
  }

  try {
    await collectionsStore.deleteCollection(collection.id);
    toastService?.show({
      message: t('admin.collections.deleteSuccess'),
      type: 'success'
    });
  } catch (error) {
    console.error('Failed to delete collection:', error);
    toastService?.show({
      message: t('admin.collections.deleteFailed'),
      type: 'error'
    });
  }
};

const togglePublic = async (collection: MediaCollection) => {
  try {
    await collectionsStore.updateCollection(collection.id, {
      is_public: !collection.is_public
    });
    toastService?.show({
      message: collection.is_public
        ? t('admin.collections.madePrivate')
        : t('admin.collections.madePublic'),
      type: 'success'
    });
  } catch (error) {
    console.error('Failed to toggle public status:', error);
    toastService?.show({
      message: t('admin.collections.togglePublicFailed'),
      type: 'error'
    });
  }
};

const toggleCurated = async (collection: MediaCollection) => {
  try {
    await collectionsStore.updateCollection(collection.id, {
      is_curated: !collection.is_curated
    });
    toastService?.show({
      message: collection.is_curated
        ? t('admin.collections.removedCurated')
        : t('admin.collections.madeCurated'),
      type: 'success'
    });
  } catch (error) {
    console.error('Failed to toggle curated status:', error);
    toastService?.show({
      message: t('admin.collections.toggleCuratedFailed'),
      type: 'error'
    });
  }
};

// Lifecycle
onMounted(async () => {
  await refresh();
});
</script>

<style lang="scss">
.collections-view {
  padding: var(--space);
  display: flex;
  flex-direction: column;

  &__loading {
    display: flex;
    justify-content: center;
    padding: var(--space-xl);
  }

  &__error {
    max-width: 500px;
    margin: var(--space-xl) auto;
    text-align: center;

    .t-icon {
      color: var(--color-error);
      margin-bottom: var(--space);
    }

    p {
      color: var(--color-text-secondary);
      margin-bottom: var(--space);
    }

    .error-details {
      font-size: var(--font-size-sm);
      color: var(--color-text-tertiary);
      font-style: italic;
    }
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

  &__badges {
    display: flex;
    gap: var(--space-xs);
  }

  &__actions {
    display: flex;
    gap: var(--space-xs);
  }

  &__collection-type {
    position: absolute;
    top: var(--space-s);
    right: var(--space-s);
    z-index: 2;
  }

  &__collection-stats {
    position: absolute;
    bottom: var(--space-s);
    left: var(--space-s);
    z-index: 2;
  }
}

// Fix z-index for media tiles on hover/interaction
:global(.t-virtual-grid__item) {
  position: relative;
  z-index: 1;

  &:hover {
    z-index: 100;
  }

  // When context menu is active
  &:has(.context-panel--active) {
    z-index: 200;
  }
}

// Ensure TMediaTile can overflow its container on hover
:global(.t-media-tile) {
  position: relative;
  transition: transform 0.2s ease, z-index 0s;

  &:hover {
    z-index: 50;
  }
}
</style>
