<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="t('admin.personalLibrary.title')"
      :description="t('admin.personalLibrary.description')"
    >
      <template #actions>
        <TButton
          type="outline"
          :icon="Icons.ARROW_ROTATE_TOP_LEFT"
          @click="forceRefresh"
          :disabled="loading"
        >
          {{ t('common.refresh') }}
        </TButton>

        <TButton
          color="primary"
          :icon="Icons.AI_FACE"
          @click="router.push('/generate')"
        >
          {{ t('admin.personalLibrary.generateImages') }}
        </TButton>

        <TButton
          color="primary"
          :icon="Icons.ARROW_UPLOAD"
          @click="router.push('/upload?personal=true')"
        >
          {{ t('admin.personalLibrary.uploadImages') }}
        </TButton>
      </template>

      <template #inputs>
        <TInputText
          v-model="searchQuery"
          :label="t('common.search')"
          :placeholder="t('common.searchPlaceholder')"
          :icon="Icons.SEARCH_M"
          @input="searchImages(searchQuery)"
        />

        <TInputSelect
          v-model="usageTypeFilter"
          :label="t('admin.personalLibrary.usageType')"
          :options="usageTypeOptions"
        />

        <TViewToggle
          v-model="viewMode"
          :tiles-label="t('common.views.tiles')"
          :list-label="t('common.views.list')"
          :tiles-icon="Icons.BLOCK_PARTIALS"
          :list-icon="Icons.CHECK_LIST"
        />

        <div :class="bemm('sorting')">
          <TInputSelect
            v-model="sortField"
            :options="sortOptions"
          />

          <TButton
            :icon="sortOrder === 'asc' ? Icons.ARROW_UP : Icons.ARROW_DOWN"
            type="outline"
            size="small"
            @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
            :title="sortOrder === 'asc' ? t('admin.library.order.ascending') : t('admin.library.order.descending')"
          />
        </div>
      </template>

      <template #stats>
        <TKeyValue
          :items="[
            { key: t('admin.personalLibrary.totalImages'), value: String(stats.totalImages) },
            { key: t('admin.personalLibrary.storageUsed'), value: formatBytes(stats.storageUsed) }
          ]"
        />
      </template>
    </AdminPageHeader>

    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <div v-else-if="imageList.length === 0" :class="bemm('empty')">
      <TCard>
        <TIcon :name="Icons.IMAGE" size="large" />
        <p>{{ t('admin.personalLibrary.noImages') }}</p>
        <div :class="bemm('empty-actions')">
          <TButton color="primary" @click="router.push('/generate')">
            {{ t('admin.personalLibrary.generateFirst') }}
          </TButton>
          <TButton color="outline" @click="router.push('/upload?personal=true')">
            {{ t('admin.personalLibrary.uploadFirst') }}
          </TButton>
        </div>
      </TCard>
    </div>

    <!-- Tiles View -->
    <TVirtualGrid
      v-else-if="viewMode === 'tiles'"
      :items="sortedImages"
      :min-item-width="250"
      :gap="16"
      :aspect-ratio="'1:1'"
    >
      <template #default="{ item }">
        <TMediaTile
          :media="convertToMediaItem(item)"
          :get-image-variants="getImageVariants"
          :context-menu-items="getContextMenuItems(item)"
          @click="(e) => selectMedia(e, item)"
        >
          <template #overlay>
            <!-- Status Badge for generated images -->
            <div v-if="item.status" :class="bemm('media-status')">
              <TChip :type="getStatusType(item.status)" size="small">
                {{ item.status }}
              </TChip>
            </div>

            <!-- Usage Type Badge -->
            <div :class="bemm('usage-badge')">
              <TChip type="info" size="small">
                {{ getUsageTypeLabel(item.usage_type) }}
              </TChip>
            </div>
          </template>
        </TMediaTile>
      </template>
    </TVirtualGrid>

    <!-- List View -->
    <TList v-else :columns="listColumns" :show-stats="true">
      <TListItem
        v-for="media in sortedImages"
        :key="media.id"
        clickable
        @click="(e) => selectMedia(e, media)"
      >
        <TListCell
          type="image"
          :image-src="media.thumbnail_url || media.url"
          :image-alt="media.original_filename"
        />
        <TListCell
          type="text"
          :content="media.original_filename"
        />
        <TListCell type="custom">
          <TChip type="info" size="small">
            {{ getUsageTypeLabel(media.usage_type) }}
          </TChip>
        </TListCell>
        <TListCell type="size" :content="media.file_size" />
        <TListCell type="custom">
          <TChip
            v-if="media.status"
            :type="getStatusType(media.status)"
            size="small"
          >
            {{ media.status }}
          </TChip>
        </TListCell>
        <TListCell type="date" :content="media.created_at" />
        <TListCell type="id" :content="media.id" :truncate="true" />
      </TListItem>
    </TList>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Icons } from 'open-icon';
import { useBemm } from 'bemm';
import {
  useImageUrl,
  useImages,
  ImageLibraryType,
  useUserSettings,
  useAuthStore,
  userMediaService,
  useI18n,
  type UserMedia,
  formatBytes
} from '@tiko/core';
import type { ToastService, MediaItem, PopupService } from '@tiko/ui';
import {
  TCard,
  TButton,
  TIcon,
  TSpinner,
  TViewToggle,
  TMediaTile,
  TList,
  TListItem,
  TListCell,
  TInputSelect,
  TInputText,
  TKeyValue,
  TChip,
  TVirtualGrid
} from '@tiko/ui';
import AdminPageHeader from '../components/AdminPageHeader.vue';

const toastService = inject<ToastService>('toastService');
const popupService = inject<PopupService>('popupService');
const { getImageVariants } = useImageUrl();
const { imageList, stats, loading, searchImages, filteredImages, loadImages, refresh } =
  useImages({ libraryType: ImageLibraryType.USER });
const { settings, loadSettings, setSetting } = useUserSettings('admin');
const authStore = useAuthStore();

const bemm = useBemm('personal-library-view');
const { t } = useI18n();
const router = useRouter();

// State
const searchQuery = ref('');

// View options
type ViewMode = 'tiles' | 'list';
type SortField = 'upload_date' | 'name' | 'size' | 'usage_type';
type SortOrder = 'asc' | 'desc';
type UsageTypeFilter = 'all' | 'profile_picture' | 'card_media' | 'general' | 'generated';

const viewMode = ref<ViewMode>('tiles');
const sortField = ref<SortField>('upload_date');
const sortOrder = ref<SortOrder>('desc');
const usageTypeFilter = ref<UsageTypeFilter>('all');

// Options
const sortOptions = [
  { value: 'upload_date', label: t('common.sortBy.uploadDate') },
  { value: 'name', label: t('common.sortBy.fileName') },
  { value: 'size', label: t('common.sortBy.fileSize') },
  { value: 'usage_type', label: t('admin.personalLibrary.sortBy.usageType') },
];

const usageTypeOptions = [
  { value: 'all', label: t('common.all') },
  { value: 'profile_picture', label: t('admin.personalLibrary.filter.profilePicture') },
  { value: 'card_media', label: t('admin.personalLibrary.filter.cardMedia') },
  { value: 'general', label: t('admin.personalLibrary.filter.general') },
  { value: 'generated', label: t('admin.personalLibrary.filter.generated') },
];

const listColumns = [
  { key: 'image', label: t('common.image'), width: '80px' },
  { key: 'name', label: t('common.filename'), width: '1fr' },
  { key: 'usage_type', label: t('admin.personalLibrary.usageType'), width: '150px' },
  { key: 'size', label: t('common.size'), width: '120px' },
  { key: 'status', label: t('common.statusLabel'), width: '120px' },
  { key: 'date', label: t('common.uploadedAt'), width: '150px' },
  { key: 'id', label: 'ID', width: '100px' },
];


const getUsageTypeLabel = (usageType: string): string => {
  const labels: Record<string, string> = {
    profile_picture: t('admin.personalLibrary.usageTypes.profilePicture'),
    card_media: t('admin.personalLibrary.usageTypes.cardMedia'),
    general: t('admin.personalLibrary.usageTypes.general'),
    generated: t('admin.personalLibrary.usageTypes.generated')
  };
  return labels[usageType] || usageType;
};

const getStatusType = (status?: string) => {
  switch (status) {
    case 'published':
      return 'success';
    case 'generated':
      return 'info';
    case 'failed':
    case 'rejected':
      return 'error';
    case 'generating':
      return 'warning';
    default:
      return 'default';
  }
};

// Convert UserMedia to MediaItem for TMediaTile compatibility
const convertToMediaItem = (userMedia: UserMedia): MediaItem => {
  return {
    id: userMedia.id,
    original_url: userMedia.url,
    original_filename: userMedia.original_filename,
    title: userMedia.original_filename,
    description: '',
    file_size: userMedia.file_size,
    mime_type: userMedia.mime_type,
    width: userMedia.width,
    height: userMedia.height,
    tags: userMedia.metadata?.tags || [],
    categories: [userMedia.usage_type],
    is_private: true,
    ai_analyzed: false,
    metadata: userMedia.metadata,
    created_at: userMedia.created_at,
    updated_at: userMedia.updated_at
  };
};

// Check if an image is the current profile picture
const isCurrentProfilePicture = (media: UserMedia): boolean => {
  const currentAvatarUrl = authStore.user?.user_metadata?.avatar_url || authStore.user?.avatar_url;
  return currentAvatarUrl === media.url;
};

// Context menu items for media tiles
const getContextMenuItems = (media: UserMedia) => {
  const items = [
    {
      id: 'view',
      label: t('common.view'),
      icon: Icons.EYE,
      action: () => selectMedia(new Event('click'), media)
    }
  ];

  // Only show "Set as Profile Picture" if it's not the current profile picture
  if (!isCurrentProfilePicture(media)) {
    items.push({
      id: 'set-profile',
      label: t('admin.personalLibrary.setAsProfile'),
      icon: Icons.USER,
      action: () => setAsProfilePicture(media)
    });
  }

  items.push(
    {
      id: 'separator-1',
      type: 'separator' as const
    },
    {
      id: 'add-to-collection',
      label: t('admin.personalLibrary.addToCollection'),
      icon: Icons.FOLDER_PLUS,
      action: () => addToCollection(media)
    },
    {
      id: 'delete',
      label: t('common.delete'),
      icon: Icons.TRASH,
      action: () => deleteMedia(media)
    }
  );

  return items;
};

// Computed property for sorted and filtered images
const sortedImages = computed(() => {
  let images = [...(filteredImages.value as UserMedia[])];

  // Apply usage type filter
  if (usageTypeFilter.value !== 'all') {
    images = images.filter(img => img.usage_type === usageTypeFilter.value);
  }

  // Sort
  images.sort((a, b) => {
    let compareValue = 0;

    switch (sortField.value) {
      case 'upload_date':
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        compareValue = dateA - dateB;
        break;

      case 'name':
        compareValue = (a.original_filename || '').localeCompare(b.original_filename || '');
        break;

      case 'size':
        compareValue = (a.file_size || 0) - (b.file_size || 0);
        break;

      case 'usage_type':
        compareValue = (a.usage_type || '').localeCompare(b.usage_type || '');
        break;
    }

    return sortOrder.value === 'asc' ? compareValue : -compareValue;
  });

  return images;
});

// Methods
const selectMedia = async (e: Event, media: UserMedia) => {
  e.preventDefault();

  if (!popupService) {
    console.error('PopupService not available');
    return;
  }

  // Import MediaDetailDialog dynamically
  const { default: MediaDetailDialog } = await import(
    '../components/dialogs/MediaDetailDialog.vue'
  );

  const popupId = popupService.open({
    component: MediaDetailDialog,
    title: media.original_filename,
    size: 'large',
    props: {
      media,
      onSetAsProfile: async (mediaItem: UserMedia) => {
        await setAsProfilePicture(mediaItem);
        popupService.close({ id: popupId });
      },
      onDelete: async (mediaItem: UserMedia) => {
        await deleteMedia(mediaItem);
        popupService.close({ id: popupId });
      }
    }
  });
};

const forceRefresh = async () => {
  console.log('[PersonalLibraryView] Force refreshing images...');
  await refresh();
  console.log('[PersonalLibraryView] Refresh complete. Total images:', imageList.value.length);
};

const setAsProfilePicture = async (media: UserMedia) => {
  try {
    await userMediaService.updateUserProfilePicture(media.url);

    // Refresh auth store to update avatar
    await authStore.refreshUserData();

    toastService?.show({
      message: t('admin.personalLibrary.profilePictureUpdated'),
      type: 'success'
    });

    await refresh();
  } catch (error) {
    console.error('Failed to set profile picture:', error);
    toastService?.show({
      message: t('admin.personalLibrary.profilePictureUpdateFailed'),
      type: 'error'
    });
  }
};

const addToCollection = async (media: UserMedia) => {
  if (!popupService) {
    console.error('PopupService not available');
    return;
  }

  // Import AddToCollectionDialog dynamically
  const { default: AddToCollectionDialog } = await import(
    '../components/dialogs/AddToCollectionDialog.vue'
  );

  const popupId = popupService.open({
    component: AddToCollectionDialog,
    title: t('admin.personalLibrary.addToCollection'),
    props: {
      mediaItem: {
        id: media.id,
        type: 'user_media' as const,
        name: media.original_filename,
        url: media.url
      },
      onAdd: async (collectionId: string) => {
        try {
          const { collectionsService } = await import('@tiko/core');
          await collectionsService.addItemToCollection(collectionId, {
            item_id: media.id,
            item_type: 'user_media'
          });

          popupService.close({ id: popupId });
          toastService?.show({
            message: t('admin.personalLibrary.addedToCollection'),
            type: 'success'
          });
        } catch (error: any) {
          console.error('Failed to add to collection:', error);

          // Check if it's a duplicate error
          if (error.code === '23505') {
            toastService?.show({
              message: t('admin.personalLibrary.alreadyInCollection'),
              type: 'warning'
            });
          } else {
            toastService?.show({
              message: t('admin.personalLibrary.addToCollectionFailed'),
              type: 'error'
            });
          }
        }
      }
    }
  });
};

const deleteMedia = async (media: UserMedia) => {
  if (!confirm(t('admin.personalLibrary.confirmDelete'))) {
    return;
  }

  try {
    await userMediaService.deleteUserMedia(media.id);

    toastService?.show({
      message: t('admin.personalLibrary.deleteSuccess'),
      type: 'success'
    });

    await refresh();
  } catch (error) {
    console.error('Failed to delete media:', error);
    toastService?.show({
      message: t('admin.personalLibrary.deleteFailed'),
      type: 'error'
    });
  }
};

// Watch for changes and save to user settings
watch(viewMode, async (newValue) => {
  await setSetting('personalLibraryViewMode', newValue);
});

watch(sortField, async (newValue) => {
  await setSetting('personalLibrarySortField', newValue);
});

watch(sortOrder, async (newValue) => {
  await setSetting('personalLibrarySortOrder', newValue);
});

// Lifecycle
onMounted(async () => {
  console.log('[PersonalLibraryView] Component mounted');

  // Load user settings
  await loadSettings();

  // Apply saved settings
  viewMode.value = settings.value.personalLibraryViewMode || 'tiles';
  sortField.value = settings.value.personalLibrarySortField || 'upload_date';
  sortOrder.value = settings.value.personalLibrarySortOrder || 'desc';

  // Load images
  console.log('[PersonalLibraryView] Loading images...');
  await loadImages();
  console.log('[PersonalLibraryView] Images loaded:', imageList.value.length);
  console.log('[PersonalLibraryView] First few images:', imageList.value.slice(0, 3));
});
</script>

<style lang="scss">
.personal-library-view {
  padding: var(--space);
  display: flex;
  flex-direction: column;

  &__sorting {
    display: flex;
    gap: var(--space-xs);
    align-items: center;
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: var(--space-xl);
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

  &__media-status {
    position: absolute;
    top: var(--space-s);
    right: var(--space-s);
    z-index: 2;
  }

  &__usage-badge {
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
