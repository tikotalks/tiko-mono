<template>
  <div :class="bemm()">
    <!-- Header -->
    <div :class="bemm('header')">
      <h1 :class="bemm('title')">{{ t('admin.publicItems') }}</h1>
      <div :class="bemm('stats')" v-if="stats">
        <div :class="bemm('stat')">
          <span :class="bemm('stat-label')">{{ t('admin.totalPublicItems') }}:</span>
          <span :class="bemm('stat-value')">{{ stats.public }}</span>
        </div>
        <div :class="bemm('stat')">
          <span :class="bemm('stat-label')">{{ t('admin.curatedItems') }}:</span>
          <span :class="bemm('stat-value')">{{ stats.curated }}</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div :class="bemm('filters')">
      <!-- App selector -->
      <div :class="bemm('filter-group')">
        <label :class="bemm('filter-label')">{{ t('admin.selectApp') }}</label>
        <TInputSelect
          v-model="filters.app"
          :options="appOptions"
          @change="loadItems"
        />
      </div>

      <!-- Type filter -->
      <div :class="bemm('filter-group')">
        <label :class="bemm('filter-label')">{{ t('admin.itemType') }}</label>
        <TButtonGroup>
          <TButton
            v-for="type in typeOptions"
            :key="type.value"
            :type="filters.type === type.value ? 'default' : 'outline'"
            size="small"
            @click="filters.type = type.value; loadItems()"
          >
            {{ type.label }}
          </TButton>
        </TButtonGroup>
      </div>

      <!-- Visibility filter -->
      <div :class="bemm('filter-group')">
        <label :class="bemm('filter-label')">{{ t('admin.visibility') }}</label>
        <TButtonGroup>
          <TButton
            v-for="vis in visibilityOptions"
            :key="vis.value"
            :type="filters.visibility === vis.value ? 'default' : 'outline'"
            size="small"
            @click="filters.visibility = vis.value; loadItems()"
          >
            {{ vis.label }}
          </TButton>
        </TButtonGroup>
      </div>

      <!-- Search -->
      <div :class="bemm('filter-group', 'search')">
        <TInputText
          v-model="filters.search"
          :placeholder="t('common.search')"
          :icon="Icons.SEARCH"
          @input="debouncedSearch"
        />
      </div>
    </div>

    <!-- Selection actions -->
    <div v-if="selectedIds.size > 0" :class="bemm('selection-actions')">
      <span :class="bemm('selection-count')">
        {{ t('admin.selectedItems', { count: selectedIds.size }) }}
      </span>
      <TButtonGroup>
        <TButton
          size="small"
          type="outline"
          @click="clearSelection"
        >
          {{ t('common.clearSelection') }}
        </TButton>
        <TButton
          size="small"
          color="success"
          @click="bulkSetCurated(true)"
        >
          {{ t('admin.markAsCurated') }}
        </TButton>
        <TButton
          size="small"
          color="danger"
          type="outline"
          @click="bulkSetCurated(false)"
        >
          {{ t('admin.removeFromCurated') }}
        </TButton>
      </TButtonGroup>
    </div>

    <!-- Items list -->
    <div :class="bemm('content')">
      <div v-if="isLoading" :class="bemm('loading')">
        <TIcon name="spinner" size="large" />
        <p>{{ t('common.loading') }}</p>
      </div>

      <div v-else-if="items.length === 0" :class="bemm('empty')">
        <TIcon name="inbox" size="xlarge" />
        <p>{{ t('admin.noItemsFound') }}</p>
      </div>

      <div v-else :class="bemm('list')">
        <div
          v-for="item in items"
          :key="item.id"
          :class="bemm('item', [
            selectedIds.has(item.id) ? 'selected' : '',
            item.isCurated ? 'curated' : ''
          ])"
        >
          <!-- Selection checkbox -->
          <div :class="bemm('item-select')">
            <input
              type="checkbox"
              :checked="selectedIds.has(item.id)"
              @change="toggleSelection(item.id)"
            />
          </div>

          <!-- Item preview -->
          <div :class="bemm('item-preview')">
            <TCardTile
              :card="item"
              :show-image="true"
              :show-title="true"
              :edit-mode="false"
            />
          </div>

          <!-- Item info -->
          <div :class="bemm('item-info')">
            <h3 :class="bemm('item-title')">{{ item.title }}</h3>
            <div :class="bemm('item-meta')">
              <span :class="bemm('item-type')">{{ item.type }}</span>
              <span :class="bemm('item-owner')">{{ t('admin.owner') }}: {{ item.ownerId }}</span>
              <span :class="bemm('item-date')">{{ formatDate(item.createdAt) }}</span>
            </div>
            <div :class="bemm('item-badges')">
              <span v-if="item.isPublic" :class="bemm('badge', 'public')">
                <TIcon name="users" size="small" />
                {{ t('common.public') }}
              </span>
              <span v-if="item.isCurated" :class="bemm('badge', 'curated')">
                <TIcon name="star" size="small" />
                {{ t('common.curated') }}
              </span>
            </div>
          </div>

          <!-- Item actions -->
          <div :class="bemm('item-actions')">
            <TButton
              v-if="!item.isCurated"
              size="small"
              color="success"
              @click="toggleCurated(item.id, true)"
            >
              {{ t('admin.makeCurated') }}
            </TButton>
            <TButton
              v-else
              size="small"
              color="danger"
              type="outline"
              @click="toggleCurated(item.id, false)"
            >
              {{ t('admin.removeCurated') }}
            </TButton>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" :class="bemm('pagination')">
        <TButton
          :disabled="currentPage === 1"
          type="outline"
          size="small"
          @click="changePage(currentPage - 1)"
        >
          {{ t('common.previous') }}
        </TButton>
        <span :class="bemm('page-info')">
          {{ t('common.pageOf', { current: currentPage, total: totalPages }) }}
        </span>
        <TButton
          :disabled="currentPage === totalPages"
          type="outline"
          size="small"
          @click="changePage(currentPage + 1)"
        >
          {{ t('common.next') }}
        </TButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, inject } from 'vue';
import { useBemm } from 'bemm';
import {
  TButton,
  TButtonGroup,
  TInputText,
  TInputSelect,
  TIcon,
  TCardTile,
  type ToastService
} from '@tiko/ui';
import { useI18n } from "@tiko/core";
import { Icons } from 'open-icon';
import { debounce } from 'lodash-es';
import { adminItemsService } from '../../services/admin-items.service';
import type { TCardTile as CardTileType } from '@tiko/ui';
import type { AdminItemsFilter } from '../../services/admin-items.service';

const bemm = useBemm('public-items-admin');
const { t } = useI18n();
const toast = inject<ToastService>('toastService');

// State
const isLoading = ref(false);
const items = ref<CardTileType[]>([]);
const selectedIds = ref<Set<string>>(new Set());
const currentPage = ref(1);
const totalPages = ref(1);
const total = ref(0);
const stats = ref<any>(null);

// Filters
const filters = reactive<AdminItemsFilter>({
  app: 'sequence',
  type: 'all',
  visibility: 'public',
  search: '',
  page: 1,
  limit: 50
});

// Options
const appOptions = [
  { value: 'sequence', label: t('apps.sequence') },
  { value: 'cards', label: t('apps.cards') },
  { value: 'radio', label: t('apps.radio') },
  { value: 'timer', label: t('apps.timer') },
  { value: 'todo', label: t('apps.todo') },
  { value: 'type', label: t('apps.type') },
  { value: 'yes-no', label: t('apps.yesNo') },
];

const typeOptions = [
  { value: 'all', label: t('common.all') },
  { value: 'card', label: t('common.cards') },
  { value: 'sequence', label: t('common.sequences') },
];

const visibilityOptions = [
  { value: 'all', label: t('admin.allPublicItems') }, // All public items (including curated)
  { value: 'public-only', label: t('admin.publicNotCurated') }, // Public but not curated
  { value: 'curated', label: t('admin.curatedOnly') }, // Curated only (always public)
];

// Methods
const loadItems = async () => {
  isLoading.value = true;
  try {
    const response = await adminItemsService.loadPublicItems({
      ...filters,
      page: currentPage.value
    });

    items.value = response.items;
    total.value = response.total;
    totalPages.value = response.totalPages;
  } catch (error) {
    console.error('Failed to load items:', error);
    toast?.show({ message: t('admin.failedToLoadItems'), type: 'error' });
  } finally {
    isLoading.value = false;
  }
};

const loadStats = async () => {
  try {
    stats.value = await adminItemsService.getItemStats();
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
};

const toggleSelection = (itemId: string) => {
  const newSet = new Set(selectedIds.value);
  if (newSet.has(itemId)) {
    newSet.delete(itemId);
  } else {
    newSet.add(itemId);
  }
  selectedIds.value = newSet;
};

const clearSelection = () => {
  selectedIds.value = new Set();
};

const toggleCurated = async (itemId: string, isCurated: boolean) => {
  try {
    await adminItemsService.toggleCuratedStatus(itemId, isCurated);

    // Update local state
    const item = items.value.find(i => i.id === itemId);
    if (item) {
      item.isCurated = isCurated;
    }

    toast?.show({
      message: isCurated
        ? t('admin.itemMarkedAsCurated')
        : t('admin.itemRemovedFromCurated'),
      type: 'success'
    });

    // Reload stats
    await loadStats();
  } catch (error) {
    console.error('Failed to toggle curated status:', error);
    toast?.show({ message: t('admin.failedToUpdateItem'), type: 'error' });
  }
};

const bulkSetCurated = async (isCurated: boolean) => {
  if (selectedIds.value.size === 0) return;

  try {
    await adminItemsService.bulkToggleCurated(
      Array.from(selectedIds.value),
      isCurated
    );

    // Update local state
    items.value.forEach(item => {
      if (selectedIds.value.has(item.id)) {
        item.isCurated = isCurated;
      }
    });

    clearSelection();

    toast?.show({
      message: isCurated
        ? t('admin.itemsMarkedAsCurated', { count: selectedIds.value.size })
        : t('admin.itemsRemovedFromCurated', { count: selectedIds.value.size }),
      type: 'success'
    });

    // Reload stats
    await loadStats();
  } catch (error) {
    console.error('Failed to bulk update curated status:', error);
    toast?.show({ message: t('admin.failedToUpdateItems'), type: 'error' });
  }
};

const changePage = (page: number) => {
  currentPage.value = page;
  loadItems();
};

const debouncedSearch = debounce(() => {
  currentPage.value = 1;
  loadItems();
}, 300);

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

// Check admin access on mount
onMounted(async () => {
  try {
    const isAdmin = await adminItemsService.isUserAdmin();
    if (!isAdmin) {
      toast?.show({ message: t('admin.unauthorizedAccess'), type: 'error' });
      // Redirect to home or show error
      return;
    }

    await Promise.all([
      loadItems(),
      loadStats()
    ]);
  } catch (error) {
    console.error('Failed to initialize admin view:', error);
    toast?.show({ message: t('admin.failedToInitialize'), type: 'error' });
  }
});
</script>

<style lang="scss">
.public-items-admin {
  padding: var(--space);
  max-width: 1400px;
  margin: 0 auto;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-xl);
  }

  &__title {
    font-size: 2rem;
    font-weight: 600;
    margin: 0;
  }

  &__stats {
    display: flex;
    gap: var(--space-xl);
  }

  &__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__stat-label {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  &__stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-primary);
  }

  &__filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space);
    padding: var(--space);
    background: var(--color-background-secondary);
    border-radius: var(--border-radius);
    margin-bottom: var(--space);
  }

  &__filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);

    &--search {
      flex: 1;
      min-width: 300px;
    }
  }

  &__filter-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  &__selection-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space);
    background: var(--color-info-light);
    border-radius: var(--border-radius);
    margin-bottom: var(--space);
  }

  &__selection-count {
    font-weight: 500;
  }

  &__content {
    min-height: 400px;
  }

  &__loading,
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    color: var(--color-text-secondary);
    gap: var(--space);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--space);
    padding: var(--space);
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--color-primary-light);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    &--selected {
      background: var(--color-primary-light);
      border-color: var(--color-primary);
    }

    &--curated {
      border-color: goldenrod;
      box-shadow: 0 0 0 1px goldenrod;
    }
  }

  &__item-select {
    display: flex;
    align-items: center;

    input[type="checkbox"] {
      width: 1.25rem;
      height: 1.25rem;
      cursor: pointer;
    }
  }

  &__item-preview {
    width: 100px;
    height: 100px;
    flex-shrink: 0;
  }

  &__item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__item-title {
    font-size: 1.125rem;
    font-weight: 500;
    margin: 0;
  }

  &__item-meta {
    display: flex;
    gap: var(--space);
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  &__item-type {
    padding: 0.125rem 0.5rem;
    background: var(--color-background-secondary);
    border-radius: var(--border-radius-s);
  }

  &__item-badges {
    display: flex;
    gap: var(--space-s);
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.75rem;
    border-radius: var(--border-radius-s);
    font-size: 0.875rem;
    font-weight: 500;

    &--public {
      background: var(--color-info-light);
      color: var(--color-info);
    }

    &--curated {
      background: rgba(255, 215, 0, 0.2);
      color: goldenrod;
    }
  }

  &__item-actions {
    display: flex;
    gap: var(--space-s);
    flex-shrink: 0;
  }

  &__pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space);
    margin-top: var(--space-xl);
    padding-top: var(--space);
    border-top: 1px solid var(--color-border);
  }

  &__page-info {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }
}
</style>
