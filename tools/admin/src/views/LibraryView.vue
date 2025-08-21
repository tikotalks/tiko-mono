<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="t('admin.library.title')"
      :description="t('admin.library.description')"
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
          :icon="Icons.ARROW_UPLOAD"
          @click="router.push('/upload')"
        >
          {{ t('admin.library.uploadImages') }}
        </TButton>
      </template>

      <template #inputs>
        <TInputText
          v-model="searchQuery"
          :label="t('common.search')"
          :placeholder="t('common.searchPlaceholder')"
          :icon="Icons.SEARCH_L"
          @input="searchImages(searchQuery)"
        />

        <TInputSelect
          v-model="privacyFilter"
          :label="t('common.visibility')"
          :options="privacyFilterOptions"
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
            { key: t('admin.library.totalImages'), value: String(stats.totalImages) }
          ]"
        />
      </template>
    </AdminPageHeader>

    <!-- Selection Status Bar -->
    <TStatusBar :show="selectedMediaIds.size > 0">
      <div :class="bemm('selection-status')">
        <div :class="bemm('selection-info')">
          <TIcon :name="Icons.CHECK_M" />
          <span>
            {{ t('admin.library.itemsSelected', { count: selectedMediaIds.size }) }}
          </span>
        </div>

        <div :class="bemm('selection-actions')">
          <TButtonGroup>
            <TButton
              size="small"
              type="outline"
              :icon="Icons.FOLDER_PLUS"
              @click="addSelectedToCollection"
              :disabled="selectedMediaIds.size === 0"
            >
              {{ t('admin.library.addToCollection') }}
            </TButton>

            <TButton
              size="small"
              type="outline"
              :icon="Icons.CHECK_M"
              @click="selectAll"
              v-if="selectedMediaIds.size < sortedImages.length"
            >
              {{ t('common.selectAll') }}
            </TButton>

            <TButton
              size="small"
              type="outline"
              :icon="Icons.MULTIPLY_M"
              @click="clearSelection"
            >
              {{ t('common.clearSelection') }}
            </TButton>
          </TButtonGroup>
        </div>
      </div>
    </TStatusBar>

    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <div v-else-if="imageList.length === 0" :class="bemm('empty')">
      <TCard>
        <TIcon :name="Icons.IMAGE" size="large" />
        <p>{{ t('admin.library.noImages') }}</p>
        <TButton color="primary" @click="router.push('/upload')">
          {{ t('admin.library.uploadFirst') }}
        </TButton>
      </TCard>
    </div>

    <!-- Tiles View -->
    <TVirtualGrid
      v-else-if="viewMode === 'tiles'"
      :items="sortedImages"
      :min-item-width="250"
      :gap="16"
      :aspect-ratio="'3:2'"
    >
      <template #default="{ item }">
        <TMediaTile
          :media="item"
          :href="`/media/${item.id}`"
          :get-image-variants="getImageVariants"
          :context-menu-items="getContextMenuItems(item)"
          @click="(e) => handleMediaClick(e, item)"
          :class="{ 'is-selected': selectedMediaIds.has(item.id) }"
        >
          <template #content>
            <div v-if="isMultiSelectMode" :class="bemm('selection-indicator')">
              <TIcon 
                v-if="selectedMediaIds.has(item.id)" 
                :name="Icons.CHECK" 
                color="primary" 
              />
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
        :href="`/media/${media.id}`"
        clickable
        @click="(e) => handleMediaClick(e, media)"
        :class="{ 'is-selected': selectedMediaIds.has(media.id) }"
      >
        <TListCell
          type="image"
          :image-src="getImageVariants(media.original_url).thumbnail"
          :image-alt="media.original_filename"
        />
        <TListCell
          type="text"
          :content="media.title || media.original_filename"
        />
        <TListCell type="custom">
          <TChip
            :color="media.is_private ? 'warning' : 'success'"
            size="small"
          >
            {{ media.is_private ? t('common.private') : t('common.public') }}
          </TChip>
        </TListCell>
        <TListCell type="size" :content="media.file_size" />
        <TListCell type="chips" :chips="media.tags" :max-chips="2" />
        <TListCell type="chips" :chips="media.categories" :max-chips="2" />
        <TListCell type="id" :content="media.id" :truncate="true" />
      </TListItem>
    </TList>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Icons } from 'open-icon';
import { useBemm } from 'bemm';
import { useImageUrl, useImages, useUserSettings } from '@tiko/core';
import type { MediaItem, ToastService, PopupService } from '@tiko/ui';
import {
  TCard,
  TButton,
  TIcon,
  TSpinner,
  TInput,
  TViewToggle,
  TGrid,
  TMediaTile,
  TList,
  TListItem,
  TListCell,
  TInputSelect,
  TInputText,
  TKeyValue,
  TChip,
  TVirtualGrid,
  TStatusBar,
  TButtonGroup,
} from '@tiko/ui';
import { useI18n } from '@tiko/core';
import AdminPageHeader from '../components/AdminPageHeader.vue';
import { useMediaSelector } from '@/composables/useMediaSelector';

const toastService = inject<ToastService>('toastService');
const popupService = inject<PopupService>('popupService');
const { getImageVariants } = useImageUrl();
const { imageList, stats, loading, searchImages, filteredImages, loadImages, refresh } =
  useImages();
const { settings, loadSettings, setSetting } = useUserSettings('admin');
const { openMediaSelector } = useMediaSelector();

const bemm = useBemm('library-view');
const { t } = useI18n();
const router = useRouter();

const searchQuery = ref('');

// Multi-select state
const selectedMediaIds = ref<Set<string>>(new Set());
const lastSelectedIndex = ref<number | null>(null);
const isMultiSelectMode = ref(false);

// Sorting options
type ViewMode = 'tiles' | 'list';
type SortField = 'upload_date' | 'name' | 'size' | 'title';
type SortOrder = 'asc' | 'desc';
type PrivacyFilter = 'all' | 'public' | 'private';

// Initialize from user settings with defaults
const viewMode = ref<ViewMode>('tiles');
const sortField = ref<SortField>('upload_date');
const sortOrder = ref<SortOrder>('desc');
const privacyFilter = ref<PrivacyFilter>('all');

const sortOptions = [
  { value: 'upload_date', label: t('common.sortBy.uploadDate') },
  { value: 'name', label: t('common.sortBy.fileName') },
  { value: 'title', label: t('common.sortBy.title') },
  { value: 'size', label: t('common.sortBy.fileSize') },
];

const orderOptions = [
  { value: 'asc', label: t('common.orderBy.ascending') },
  { value: 'desc', label: t('common.orderBy.descending') },
];

const privacyFilterOptions = [
  { value: 'all', label: t('common.filter.all') },
  { value: 'public', label: t('common.filter.public') },
  { value: 'private', label: t('common.filter.private') },
];

const listColumns = [
  { key: 'image', label: t('common.image'), width: '80px' },
  { key: 'title', label: t('common.title'), width: '1fr' },
  { key: 'visibility', label: t('common.visibility'), width: '100px' },
  { key: 'size', label: t('common.size'), width: '120px' },
  { key: 'tags', label: t('common.tags'), width: '1fr' },
  { key: 'categories', label: t('common.categories'), width: '1fr' },
  { key: 'id', label: 'ID', width: '100px' },
];

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Computed property for sorted images
const sortedImages = computed(() => {
  let images = [...filteredImages.value];

  // Apply privacy filter
  if (privacyFilter.value === 'public') {
    images = images.filter(img => !img.is_private);
  } else if (privacyFilter.value === 'private') {
    images = images.filter(img => img.is_private);
  }

  images.sort((a, b) => {
    let compareValue = 0;

    switch (sortField.value) {
      case 'upload_date':
        // Assuming created_at field exists, otherwise use ID as proxy for upload order
        const dateA = new Date(a.created_at || a.id).getTime();
        const dateB = new Date(b.created_at || b.id).getTime();
        compareValue = dateA - dateB;
        break;

      case 'name':
        compareValue = (a.original_filename || '').localeCompare(b.original_filename || '');
        break;

      case 'title':
        compareValue = (a.title || a.original_filename || '').localeCompare(b.title || b.original_filename || '');
        break;

      case 'size':
        compareValue = (a.file_size || 0) - (b.file_size || 0);
        break;
    }

    // Apply sort order
    return sortOrder.value === 'asc' ? compareValue : -compareValue;
  });

  return images;
});

// Handle media click with multi-select support
const handleMediaClick = (e: MouseEvent, media: MediaItem) => {
  e.preventDefault();
  
  const currentIndex = sortedImages.value.findIndex(item => item.id === media.id);
  
  // If in multi-select mode or holding modifier keys
  if (isMultiSelectMode.value || e.shiftKey || e.metaKey || e.ctrlKey) {
    // Cmd/Ctrl + Click: Toggle individual selection
    if (e.metaKey || e.ctrlKey) {
      toggleSelection(media.id);
      lastSelectedIndex.value = currentIndex;
    }
    // Shift + Click: Range selection
    else if (e.shiftKey && lastSelectedIndex.value !== null) {
      const start = Math.min(lastSelectedIndex.value, currentIndex);
      const end = Math.max(lastSelectedIndex.value, currentIndex);
      
      // Select all items in the range
      for (let i = start; i <= end; i++) {
        const item = sortedImages.value[i];
        if (item) {
          selectedMediaIds.value.add(item.id);
        }
      }
      // Force reactivity
      selectedMediaIds.value = new Set(selectedMediaIds.value);
    }
    // Regular click in multi-select mode: Toggle selection
    else if (isMultiSelectMode.value) {
      toggleSelection(media.id);
      lastSelectedIndex.value = currentIndex;
    }
  } else {
    // Regular click: Navigate to detail
    router.push(`/media/${media.id}`);
  }
};

// Toggle selection of a media item
const toggleSelection = (mediaId: string) => {
  if (selectedMediaIds.value.has(mediaId)) {
    selectedMediaIds.value.delete(mediaId);
  } else {
    selectedMediaIds.value.add(mediaId);
  }
  // Force reactivity
  selectedMediaIds.value = new Set(selectedMediaIds.value);
};

// Select all visible items
const selectAll = () => {
  sortedImages.value.forEach(media => {
    selectedMediaIds.value.add(media.id);
  });
  selectedMediaIds.value = new Set(selectedMediaIds.value);
};

// Clear selection
const clearSelection = () => {
  selectedMediaIds.value.clear();
  selectedMediaIds.value = new Set(selectedMediaIds.value);
  lastSelectedIndex.value = null;
};

// Add selected items to collection
const addSelectedToCollection = async () => {
  if (!popupService || selectedMediaIds.value.size === 0) return;

  const { default: AddToCollectionDialog } = await import(
    '../components/dialogs/AddToCollectionDialog.vue'
  );

  const selectedItems = Array.from(selectedMediaIds.value)
    .map(id => sortedImages.value.find(m => m.id === id))
    .filter(Boolean) as MediaItem[];

  const popupId = popupService.open({
    component: AddToCollectionDialog,
    title: t('admin.library.addToCollection'),
    props: {
      mediaItem: {
        id: selectedItems[0].id, // Use first item as primary
        type: 'media' as const,
        name: selectedMediaIds.value.size > 1 
          ? t('admin.library.multipleItems', { count: selectedMediaIds.value.size })
          : selectedItems[0].title || selectedItems[0].original_filename,
        url: selectedItems[0].original_url
      },
      multipleItems: selectedItems,
      onAdd: async (collectionId: string) => {
        try {
          const { collectionsSupabaseService } = await import('@tiko/core');
          
          // Add all selected items to the collection
          const promises = selectedItems.map(media => 
            collectionsSupabaseService.addItemToCollection(collectionId, {
              item_id: media.id,
              item_type: 'media'
            })
          );
          
          await Promise.all(promises);
          
          popupService.close({ id: popupId });
          toastService?.show({
            message: t('admin.library.addedToCollection'),
            type: 'success'
          });
          
          // Clear selection after successful add
          clearSelection();
        } catch (error: any) {
          console.error('Failed to add to collection:', error);
          
          if (error.code === '23505') {
            toastService?.show({
              message: t('admin.library.someAlreadyInCollection'),
              type: 'warning'
            });
          } else {
            toastService?.show({
              message: t('admin.library.addToCollectionFailed'),
              type: 'error'
            });
          }
        }
      }
    }
  });
};

// Force refresh all images
async function forceRefresh() {
  console.log('[LibraryView] Force refreshing images...');
  await refresh();
  console.log('[LibraryView] Refresh complete. Total images:', imageList.value.length);
}

// Watch for changes and save to user settings
watch(viewMode, async (newValue) => {
  await setSetting('libraryViewMode', newValue);
});

watch(sortField, async (newValue) => {
  await setSetting('librarySortField', newValue);
});

watch(sortOrder, async (newValue) => {
  await setSetting('librarySortOrder', newValue);
});

// Context menu items for media tiles
const getContextMenuItems = (media: MediaItem) => {
  const items = [
    {
      id: 'view',
      label: t('common.view'),
      icon: Icons.EYE,
      action: () => viewMedia(media)
    },
    {
      id: 'separator-1',
      type: 'separator' as const
    },
    {
      id: 'add-to-collection',
      label: t('admin.library.addToCollection'),
      icon: Icons.FOLDER_PLUS,
      action: () => addToCollection(media)
    },
    {
      id: 'separator-2',
      type: 'separator' as const
    },
    {
      id: 'edit',
      label: t('common.edit'),
      icon: Icons.PENCIL,
      action: () => editMedia(media)
    },
    {
      id: 'toggle-privacy',
      label: media.is_private ? t('admin.library.makePublic') : t('admin.library.makePrivate'),
      icon: media.is_private ? Icons.GLOBE : Icons.LOCK,
      action: () => togglePrivacy(media)
    },
    {
      id: 'separator-3',
      type: 'separator' as const
    },
    {
      id: 'delete',
      label: t('common.delete'),
      icon: Icons.TRASH,
      action: () => deleteMedia(media)
    }
  ];

  return items;
};

// Context menu actions
const addToCollection = async (media: MediaItem) => {
  if (!popupService) return;

  const { default: AddToCollectionDialog } = await import(
    '../components/dialogs/AddToCollectionDialog.vue'
  );

  const popupId = popupService.open({
    component: AddToCollectionDialog,
    title: t('admin.library.addToCollection'),
    props: {
      mediaItem: {
        id: media.id,
        type: 'media' as const,
        name: media.title || media.original_filename,
        url: media.original_url
      },
      onAdd: async (collectionId: string) => {
        try {
          const { collectionsSupabaseService } = await import('@tiko/core');
          await collectionsSupabaseService.addItemToCollection(collectionId, {
            item_id: media.id,
            item_type: 'media'
          });

          popupService.close({ id: popupId });
          toastService?.show({
            message: t('admin.library.addedToCollection'),
            type: 'success'
          });
        } catch (error: any) {
          console.error('Failed to add to collection:', error);

          // Check if it's a duplicate error
          if (error.code === '23505') {
            toastService?.show({
              message: t('admin.library.alreadyInCollection'),
              type: 'warning'
            });
          } else {
            toastService?.show({
              message: t('admin.library.addToCollectionFailed'),
              type: 'error'
            });
          }
        }
      }
    }
  });
};

const viewMedia = async (media: MediaItem) => {
  if (!popupService) return;

  const { default: MediaDetailDialog } = await import(
    '../components/dialogs/MediaDetailDialog.vue'
  );

  popupService.open({
    component: MediaDetailDialog,
    title: media.title || media.original_filename,
    size: 'large',
    props: {
      media
    }
  });
};

const editMedia = (media: MediaItem) => {
  router.push(`/media/${media.id}`);
};

const togglePrivacy = async (media: MediaItem) => {
  try {
    const { mediaService } = await import('@tiko/core');
    
    // Update the media privacy
    await mediaService.updateMedia(media.id, {
      is_private: !media.is_private
    });

    toastService?.show({
      message: media.is_private 
        ? t('admin.library.madePublic') 
        : t('admin.library.madePrivate'),
      type: 'success'
    });

    // Refresh the list
    await forceRefresh();
  } catch (error) {
    console.error('Failed to toggle privacy:', error);
    toastService?.show({
      message: t('admin.library.privacyToggleFailed'),
      type: 'error'
    });
  }
};

const deleteMedia = async (media: MediaItem) => {
  if (!popupService) return;

  const { default: ConfirmDialog } = await import(
    '../components/dialogs/ConfirmDialog.vue'
  );

  const popupId = popupService.open({
    component: ConfirmDialog,
    title: t('admin.library.deleteMedia'),
    props: {
      message: t('admin.library.confirmDelete', { name: media.title || media.original_filename }),
      confirmText: t('common.delete'),
      confirmColor: 'error',
      onConfirm: async () => {
        try {
          const { mediaService } = await import('@tiko/core');
          
          // Delete the media
          await mediaService.deleteMedia(media.id);
          
          popupService.close({ id: popupId });
          
          toastService?.show({
            message: t('admin.library.deleteSuccess'),
            type: 'success'
          });

          // Clear selection if this item was selected
          if (selectedMediaIds.value.has(media.id)) {
            selectedMediaIds.value.delete(media.id);
            selectedMediaIds.value = new Set(selectedMediaIds.value);
          }

          // Refresh the list
          await forceRefresh();
        } catch (error) {
          console.error('Failed to delete media:', error);
          toastService?.show({
            message: t('admin.library.deleteFailed'),
            type: 'error'
          });
        }
      }
    }
  });
};

// Keyboard event handlers
const handleKeyDown = (e: KeyboardEvent) => {
  // Enter multi-select mode when Shift is pressed
  if (e.key === 'Shift' && !isMultiSelectMode.value) {
    isMultiSelectMode.value = true;
  }
  
  // Escape key clears selection
  if (e.key === 'Escape' && selectedMediaIds.value.size > 0) {
    clearSelection();
  }
};

const handleKeyUp = (e: KeyboardEvent) => {
  // Exit multi-select mode when Shift is released (if no items selected)
  if (e.key === 'Shift' && selectedMediaIds.value.size === 0) {
    isMultiSelectMode.value = false;
  }
};

onMounted(async () => {
  // Add keyboard event listeners
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  
  // Load user settings
  await loadSettings();

  // Apply saved settings
  viewMode.value = settings.value.libraryViewMode || 'tiles';
  sortField.value = settings.value.librarySortField || 'upload_date';
  sortOrder.value = settings.value.librarySortOrder || 'desc';

  // Load images
  await loadImages();

  // Debug: Check if created_at exists on loaded images
  console.log('Sample image data:', imageList.value[0]);
  console.log('Images with created_at:', imageList.value.filter(img => img.created_at).length);
  console.log('Total images:', imageList.value.length);
});

onUnmounted(() => {
  // Remove keyboard event listeners
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
});
</script>

<style lang="scss">
.library-view {
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

  // List View Styles for custom cells
  &__list-cell {
    display: flex;
    align-items: center;
    min-height: 60px;
    overflow: hidden;

    &--image {
      justify-content: center;
    }
  }

  &__list-image {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--color-border);

    // Checkerboard pattern for transparent images (smaller for list view)
    --dot-color: color-mix(in srgb, var(--color-foreground), transparent 90%);
    background-image:
      linear-gradient(45deg, var(--dot-color) 25%, transparent 25%),
      linear-gradient(-45deg, var(--dot-color) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--dot-color) 75%),
      linear-gradient(-45deg, transparent 75%, var(--dot-color) 75%);
    background-size: 10px 10px;
    background-position:
      0 0,
      0 5px,
      5px -5px,
      -5px 0px;
  }

  &__list-title {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__list-id {
    font-family: monospace;
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    opacity: 0.6;
  }

  &__list-chips {
    gap: var(--space-xs) !important;

    .t-chip {
      font-size: var(--font-size-xs);
    }
  }

  &__more-indicator {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    opacity: 0.6;
    padding: var(--space-xs);
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

// Selection status bar styles
.library-view {
  &__selection-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-s) var(--space);
    gap: var(--space);
  }

  &__selection-info {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    
    .t-icon {
      color: var(--color-primary);
    }
  }

  &__selection-actions {
    display: flex;
    gap: var(--space-s);
  }

  &__selection-indicator {
    position: absolute;
    top: var(--space-s);
    right: var(--space-s);
    width: 24px;
    height: 24px;
    background: var(--color-background);
    border-radius: var(--border-radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

// Selected state for media tiles
.t-media-tile.is-selected {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

// List view selection styles
.t-list-item.is-selected {
  background: color-mix(in srgb, var(--color-primary), transparent 95%);
}

// TMediaTile handles its own styling
</style>
