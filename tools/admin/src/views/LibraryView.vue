<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <div :class="bemm('stats')">
        <p :class="bemm('stats-value')">
          {{ t('admin.library.totalImages') }}: {{ stats.totalImages }}
        </p>
      </div>

        <TInputText
          v-model="searchQuery"
          :placeholder="t('admin.library.searchPlaceholder')"
          :icon="Icons.SEARCH_L"
          @input="searchImages(searchQuery)"
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
    </div>

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
    <TGrid v-else-if="viewMode === 'tiles'" :min-item-width="'250px'">
      <TMediaTile
        v-for="media in sortedImages"
        :key="media.id"
        :media="media"
        :href="`/media/${media.id}`"
        :get-image-variants="getImageVariants"
        @click="selectMedia"
      />
    </TGrid>

    <!-- List View -->
    <TList v-else :columns="listColumns">
      <TListItem
        v-for="media in sortedImages"
        :key="media.id"
        :href="`/media/${media.id}`"
        clickable
        @click="(e) => selectMedia(e, media)"
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
        <TListCell type="size" :content="media.file_size" />
        <TListCell type="chips" :chips="media.tags" :max-chips="2" />
        <TListCell type="chips" :chips="media.categories" :max-chips="2" />
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
import { useImageUrl, useImages, useUserSettings } from '@tiko/core';
import type { MediaItem, ToastService } from '@tiko/ui';
import {
  useI18n,
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
} from '@tiko/ui';

const toastService = inject<ToastService>('toastService');
const { getImageVariants } = useImageUrl();
const { imageList, stats, loading, searchImages, filteredImages, loadImages } =
  useImages();
const { settings, loadSettings, setSetting } = useUserSettings('admin');

const bemm = useBemm('library-view');
const { t } = useI18n();
const router = useRouter();

const searchQuery = ref('');

// Sorting options
type ViewMode = 'tiles' | 'list';
type SortField = 'upload_date' | 'name' | 'size' | 'title';
type SortOrder = 'asc' | 'desc';

// Initialize from user settings with defaults
const viewMode = ref<ViewMode>('tiles');
const sortField = ref<SortField>('upload_date');
const sortOrder = ref<SortOrder>('desc');

const sortOptions = [
  { value: 'upload_date', label: t('admin.library.sortBy.uploadDate') },
  { value: 'name', label: t('admin.library.sortBy.fileName') },
  { value: 'title', label: t('admin.library.sortBy.title') },
  { value: 'size', label: t('admin.library.sortBy.fileSize') },
];

const orderOptions = [
  { value: 'asc', label: t('admin.library.order.ascending') },
  { value: 'desc', label: t('admin.library.order.descending') },
];

const listColumns = [
  { key: 'image', label: t('common.image'), width: '80px' },
  { key: 'title', label: t('common.title'), width: '1fr' },
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
  const images = [...filteredImages.value];

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

const selectMedia = (e: Event, media: MediaItem) => {
  e.preventDefault();
  // Navigate to media detail page
  router.push(`/media/${media.id}`);
};

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

onMounted(async () => {
  // Load user settings
  await loadSettings();

  // Apply saved settings
  viewMode.value = settings.value.libraryViewMode || 'tiles';
  sortField.value = settings.value.librarySortField || 'upload_date';
  sortOrder.value = settings.value.librarySortOrder || 'desc';

  // Load images
  loadImages();

  // Temporary: Add mock data for testing if no images are loaded
  setTimeout(() => {
    if (imageList.value.length === 0) {
      imageList.value = [
        {
          id: 'test-1',
          title: 'Test Image 1',
          original_filename: 'test1.jpg',
          original_url: 'https://via.placeholder.com/300x200',
          file_size: 1024000,
          tags: ['test', 'demo'],
          categories: ['sample'],
        },
        {
          id: 'test-2',
          title: 'Test Image 2',
          original_filename: 'test2.png',
          original_url: 'https://via.placeholder.com/400x300',
          file_size: 2048000,
          tags: ['test'],
          categories: ['sample', 'demo'],
        },
      ];
      stats.value.totalImages = 2;
    }
  }, 1000);
});
</script>

<style lang="scss">
.library-view {
  padding: var(--space);
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    gap: var(--space);
    align-items: flex-start;
    align-items: center;
    padding: var(--space);

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  &__stats {
    opacity: 0.5;
  }


  &__view-toggle {
    display: flex;
    gap: var(--space-xs);
  }

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

// TMediaTile handles its own styling
</style>
