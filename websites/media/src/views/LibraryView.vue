<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h1 :class="bemm('title')">{{ t('media.library.title') }}</h1>
      <p :class="bemm('description')">{{ t('media.library.description') }}</p>

      <!-- Active Filter Display -->
      <div
        v-if="categoryFilter !== 'all' || tagFilter"
        :class="bemm('active-filter')"
      >
        <span :class="bemm('filter-label')"
          >{{ t('media.library.filtering') }}:</span
        >
        <TChip
          v-if="categoryFilter !== 'all'"
          color="secondary"
          removable
          @remove="categoryFilter = 'all'"
        >
          {{ t('media.library.category') }}: {{ categoryFilter }}
        </TChip>
        <TChip
          v-if="tagFilter"
          removable
          @remove="
            tagFilter = null;
            searchQuery = '';
          "
        >
          {{ t('media.library.tag') }}: {{ tagFilter }}
        </TChip>
      </div>

      <div :class="bemm('stats')">
        <TMarkdownRenderer v-if="filteredByCategoryImages.length == imageList.length"
        :content="t('media.library.showingAll', { count: imageList.length })" />
        <TMarkdownRenderer v-else :content="t('media.library.showingFiltered', {
              count: filteredByCategoryImages.length,
              total: imageList.length,
            })" />
      </div>

      <div :class="bemm('filters')">
        <TInputText
          :label="t('media.library.search')"
          v-model="searchQuery"
          :placeholder="t('media.library.searchPlaceholder')"
          :icon="Icons.SEARCH_L"
          @input="searchImages(searchQuery)"
        />

        <TInputSelect
          v-model="categoryFilter"
          :label="t('media.library.category')"
          :options="categoryOptions"
        />

        <TInputSelect
          v-model="sortBy"
          :label="t('common.sortByLabel')"
          :options="sortOptions"
        />

        <TInputSelect
          v-model="sortOrder"
          :label="t('common.orderDirectionLabel')"
          :options="sortOrderOptions"
        />

        <TViewToggle
          v-model="viewMode"
          :tiles-label="t('common.views.tiles')"
          :list-label="t('common.views.list')"
          :tiles-icon="Icons.BLOCK_PARTIALS"
          :list-icon="Icons.CHECK_LIST"
        />
      </div>
    </div>

    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <div
      v-else-if="filteredByCategoryImages.length === 0"
      :class="bemm('empty')"
    >
      <TEmptyState
        :icon="Icons.IMAGE"
        :title="t('media.library.noImages')"
        :description="t('media.library.noImagesDescription')"
      />
    </div>

    <!-- Tiles View -->
    <TGrid
      v-else-if="viewMode === 'tiles'"
      :min-item-width="'300px'"
      :lazy="true"
      :lazy-root-margin="'100px'"
    >
      <router-link
        v-for="media in filteredByCategoryImages"
        :key="media.id"
        :to="`/media/${media.id}`"
        :class="bemm('tile-link')"
      >
        <TMediaTile :media="media" :get-image-variants="getImageVariants" />
      </router-link>
    </TGrid>

    <!-- List View -->
    <TList v-else :columns="listColumns" :show-stats="true">
      <router-link
        v-for="media in filteredByCategoryImages"
        :key="media.id"
        :to="`/media/${media.id}`"
        style="text-decoration: none; color: inherit"
      >
        <TListItem clickable>
          <TListCell
            type="image"
            :image-src="getImageVariants(media.original_url).thumbnail"
            :image-alt="media.original_filename"
          />
          <TListCell
            type="text"
            :content="media.title || media.original_filename"
          />
          <TListCell type="chips" :chips="media.categories" :max-chips="2" />
          <TListCell type="size" :content="media.file_size" />
          <TListCell type="date" :content="formatDate(media.created_at)" />
        </TListItem>
      </router-link>
    </TList>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useBemm } from 'bemm';
import { Icons } from 'open-icon';
import { useImageUrl, useImages } from '@tiko/core';
import {
  useI18n,
  TGrid,
  TMediaTile,
  TList,
  TListItem,
  TListCell,
  TInputSelect,
  TInputText,
  TViewToggle,
  TSpinner,
  TEmptyState,
  TChip,
  TMarkdownRenderer,
} from '@tiko/ui';

const bemm = useBemm('library-view');
const { t } = useI18n();
const route = useRoute();
const { getImageVariants } = useImageUrl();
const { imageList, loading, searchImages, filteredImages, loadImages } =
  useImages(true); // Use public mode

// State
const searchQuery = ref('');
const categoryFilter = ref<string>('all');
const tagFilter = ref<string | null>(null);
const viewMode = ref<'tiles' | 'list'>('tiles');
const sortBy = ref<'date' | 'name' | 'size' | 'category'>('date');
const sortOrder = ref<'asc' | 'desc'>('desc');

// Computed
const categoryOptions = computed(() => {
  const categories = new Set<string>();
  imageList.value.forEach((img) => {
    img.categories?.forEach((cat) => categories.add(cat));
  });

  return [
    { value: 'all', label: t('common.all') },
    ...Array.from(categories).map((cat) => ({ value: cat, label: cat })),
  ];
});

const listColumns = [
  { key: 'image', label: t('common.image'), width: '100px' },
  { key: 'title', label: t('common.title'), width: '1fr' },
  { key: 'categories', label: t('common.categories'), width: '200px' },
  { key: 'size', label: t('common.size'), width: '120px' },
  { key: 'date', label: t('common.uploadDate'), width: '150px' },
];

const sortOptions = computed(() => [
  { value: 'date', label: t('common.sortBy.date') },
  { value: 'name', label: t('common.sortBy.name') },
  { value: 'size', label: t('common.sortBy.size') },
  { value: 'category', label: t('common.sortBy.category') },
]);

const sortOrderOptions = [
  { value: 'desc', label: t('common.sortBy.desc') },
  { value: 'asc', label: t('common.sortBy.asc') },
];

// Format date for display with i18n support
function formatDate(dateString: string): string {
  const inputDate = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - inputDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return t('common.today');
  } else if (diffDays === 1) {
    return t('common.yesterday');
  } else if (diffDays < 7) {
    return t('common.daysAgo', { days: diffDays });
  } else {
    // Format as regular date
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(inputDate);
  }
}

// Use filtered images from useImages and apply category and tag filters
const filteredByCategoryImages = computed(() => {
  let result = filteredImages.value;

  // Apply category filter
  if (categoryFilter.value !== 'all') {
    result = result.filter((img) =>
      img.categories?.includes(categoryFilter.value),
    );
  }

  // Apply tag filter
  if (tagFilter.value) {
    result = result.filter((img) => img.tags?.includes(tagFilter.value));
  }

  // Apply sorting
  result = [...result].sort((a, b) => {
    let comparison = 0;

    switch (sortBy.value) {
      case 'date':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'name':
        const nameA = (a.title || a.original_filename).toLowerCase();
        const nameB = (b.title || b.original_filename).toLowerCase();
        comparison = nameA.localeCompare(nameB);
        break;
      case 'size':
        comparison = a.file_size - b.file_size;
        break;
      case 'category':
        const catA = (a.categories?.[0] || '').toLowerCase();
        const catB = (b.categories?.[0] || '').toLowerCase();
        comparison = catA.localeCompare(catB);
        break;
    }

    return sortOrder.value === 'asc' ? comparison : -comparison;
  });

  return result;
});

// Watch for query parameter changes
watch(
  () => route.query,
  (query) => {
    if (query.category) {
      categoryFilter.value = query.category as string;
      tagFilter.value = null;
    } else if (query.tag) {
      tagFilter.value = query.tag as string;
      categoryFilter.value = 'all';
      searchQuery.value = query.tag as string;
      searchImages(searchQuery.value);
    }
  },
  { immediate: true },
);

// Clear tag filter when category changes manually
watch(categoryFilter, (newValue) => {
  if (newValue !== 'all' && tagFilter.value) {
    tagFilter.value = null;
  }
});

onMounted(() => {
  loadImages();
});
</script>

<style lang="scss">
.library-view {
  padding: var(--spacing);
  max-width: var(--max-width);
  margin: 0 auto;

  &__header {
    margin-bottom: var(--space-xl);
  }

  &__description {
    color: var(--color-foreground-secondary);
    margin: 0 0 var(--space-lg) 0;
  }

  &__stats {
    display: flex;
    align-items: baseline;
    gap: var(--space-xs);
    margin-bottom: var(--space-lg);
  }

  &__stat-count {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
  }

  &__stat-total {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-medium);
    color: var(--color-foreground);
  }

  &__stat-label {
    color: var(--color-foreground-secondary);
  }

  &__active-filter {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    margin-bottom: var(--space);
    padding: var(--space-s);
    background: color-mix(in srgb, var(--color-info), transparent 90%);
    border-radius: var(--border-radius);
  }

  &__filter-label {
    font-weight: var(--font-weight-medium);
    color: var(--color-foreground-secondary);
  }

  &__filters {
    display: flex;
    gap: var(--space);
    align-items: center;
    flex-wrap: wrap;
    padding: var(--space);
    border: 1px solid color-mix(in srgb, var(--color-primary), transparent 75%);
    background: color-mix(in srgb, var(--color-primary), transparent 90%);
    border-radius: var(--border-radius);
    margin-top: var(--space-l);
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: var(--space-2xl);
  }

  &__empty {
    padding: var(--space-2xl);
  }

  &__tile-link {
    text-decoration: none;
    color: inherit;
    display: block;
  }
}
</style>
