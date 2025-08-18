<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h1>{{ t('admin.items.publicItems.title') }}</h1>
      <p>{{ t('admin.items.publicItems.description') }}</p>
    </div>

    <div :class="bemm('controls')">
      <div :class="bemm('filters')">
        <TInputSelect
          v-model="selectedApp"
          :options="appOptions"
          :placeholder="t('admin.items.selectApp')"
        />

        <TInputSelect
          v-model="visibilityFilter"
          :options="visibilityOptions"
          :placeholder="t('admin.items.filterVisibility')"
        />
      </div>

      <div :class="bemm('search')">
        <TInputText
          v-model="searchQuery"
          :placeholder="t('common.search')"
          :icon="Icons.SEARCH"
          @input="debouncedSearch"
        />
      </div>
    </div>

    <div :class="bemm('content')">
      <div v-if="isLoading" :class="bemm('loading')">
        <TIcon name="spinner" size="large" />
        <p>{{ t('common.loading') }}</p>
      </div>

      <div v-else-if="filteredItems.length === 0" :class="bemm('empty')">
        <p>{{ t('admin.items.noItems') }}</p>
      </div>

      <div v-else>
        <div :class="bemm('bulk-actions')" v-if="selectedItems.length > 0">
          <span>{{ t('admin.items.selected', { count: selectedItems.length }) }}</span>
          <TButton
            type="primary"
            size="small"
            @click="toggleCuratedBulk(true)"
          >
            {{ t('admin.items.makeCurated') }}
          </TButton>
          <TButton
            type="ghost"
            size="small"
            @click="toggleCuratedBulk(false)"
          >
            {{ t('admin.items.removeCurated') }}
          </TButton>
          <TButton
            type="text"
            size="small"
            @click="clearSelection"
          >
            {{ t('common.clearSelection') }}
          </TButton>
        </div>

        <div :class="bemm('list')">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            :class="bemm('item', selectedItems.includes(item.id) ? 'selected' : '')"
          >
            <TInputCheckbox
              :model-value="selectedItems.includes(item.id)"
              @update:model-value="toggleItemSelection(item.id)"
            />
            
            <div :class="bemm('item-info')">
              <h3>{{ item.name || item.title }}</h3>
              <p>{{ t('admin.items.owner') }}: {{ item.owner_name || item.owner_email || t('common.unknown') }}</p>
              <div :class="bemm('badges')">
                <TChip v-if="item.is_public" type="info">
                  {{ t('common.public') }}
                </TChip>
                <TChip v-if="item.is_curated" type="warning">
                  {{ t('common.curated') }}
                </TChip>
              </div>
            </div>

            <div :class="bemm('item-actions')">
              <TButton
                v-if="!item.is_curated"
                type="primary"
                size="small"
                @click="toggleCurated(item.id, true)"
              >
                {{ t('admin.items.makeCurated') }}
              </TButton>
              <TButton
                v-else
                type="ghost"
                size="small"
                @click="toggleCurated(item.id, false)"
              >
                {{ t('admin.items.removeCurated') }}
              </TButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, inject } from 'vue';
import { useBemm } from 'bemm';
import { 
  TButton, 
  TInputText, 
  TInputSelect, 
  TIcon, 
  TInputCheckbox, 
  TChip,
  useI18n,
  type ToastService
} from '@tiko/ui';
import { Icons } from 'open-icon';
import { debounce } from 'lodash-es';

const bemm = useBemm('public-items-view');
const { t } = useI18n();
const toastService = inject<ToastService>('toastService');

// Direct import from sequence app
import { adminItemsService } from '../../../../apps/sequence/src/services/admin-items.service';

const selectedApp = ref<string>('all');
const visibilityFilter = ref<string>('all');
const searchQuery = ref('');
const isLoading = ref(false);
const items = ref<any[]>([]);
const selectedItems = ref<string[]>([]);

const appOptions = [
  { value: 'all', label: t('common.all') },
  { value: 'cards', label: t('admin.items.apps.cards') },
  { value: 'sequence', label: t('admin.items.apps.sequence') },
];

const visibilityOptions = [
  { value: 'all', label: t('admin.items.visibility.all') },
  { value: 'public-only', label: t('admin.items.visibility.publicOnly') },
  { value: 'curated', label: t('admin.items.visibility.curated') },
];

const filteredItems = computed(() => {
  let filtered = items.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(item => 
      (item.name || item.title || '').toLowerCase().includes(query) ||
      (item.owner_name || '').toLowerCase().includes(query)
    );
  }

  return filtered;
});

const toggleItemSelection = (itemId: string) => {
  const index = selectedItems.value.indexOf(itemId);
  if (index > -1) {
    selectedItems.value.splice(index, 1);
  } else {
    selectedItems.value.push(itemId);
  }
};

const clearSelection = () => {
  selectedItems.value = [];
};

const loadItems = async () => {
  isLoading.value = true;
  try {
    items.value = await adminItemsService.getPublicItems({
      app: selectedApp.value === 'all' ? undefined : selectedApp.value,
      visibility: visibilityFilter.value,
      search: searchQuery.value || undefined,
    });
  } catch (error) {
    console.error('Failed to load items:', error);
    toastService?.show({
      message: t('admin.items.loadError'),
      type: 'error'
    });
  } finally {
    isLoading.value = false;
  }
};

const toggleCurated = async (itemId: string, isCurated: boolean) => {
  try {
    await adminItemsService.toggleCurated(itemId, isCurated);
    
    toastService?.show({
      message: isCurated ? t('admin.items.madeCurated') : t('admin.items.removedCurated'),
      type: 'success'
    });
    
    await loadItems();
  } catch (error) {
    console.error('Failed to update item:', error);
    toastService?.show({
      message: t('admin.items.updateError'),
      type: 'error'
    });
  }
};

const toggleCuratedBulk = async (isCurated: boolean) => {
  if (selectedItems.value.length === 0) return;

  try {
    await adminItemsService.bulkToggleCurated(selectedItems.value, isCurated);
    
    toastService?.show({
      message: isCurated 
        ? t('admin.items.bulkMadeCurated', { count: selectedItems.value.length })
        : t('admin.items.bulkRemovedCurated', { count: selectedItems.value.length }),
      type: 'success'
    });
    
    selectedItems.value = [];
    await loadItems();
  } catch (error) {
    console.error('Failed to update items:', error);
    toastService?.show({
      message: t('admin.items.bulkUpdateError'),
      type: 'error'
    });
  }
};

const debouncedSearch = debounce(() => {
  loadItems();
}, 300);

// Watch for changes and reload
watch([selectedApp, visibilityFilter], () => {
  selectedItems.value = [];
  loadItems();
});

// Load items on mount
onMounted(() => {
  loadItems();
});
</script>

<style lang="scss">
.public-items-view {
  padding: var(--space-l);
  max-width: 1200px;

  &__header {
    margin-bottom: var(--space-l);

    h1 {
      margin: 0 0 var(--space-s) 0;
      font-size: 2rem;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: var(--color-text-secondary);
    }
  }

  &__controls {
    display: flex;
    gap: var(--space);
    margin-bottom: var(--space-l);
    flex-wrap: wrap;
  }

  &__filters {
    display: flex;
    gap: var(--space);
    flex: 1;
    min-width: 0;
  }

  &__search {
    width: 300px;
  }

  &__content {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: var(--space);
  }

  &__loading,
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-xl);
    color: var(--color-text-secondary);
    text-align: center;
  }

  &__bulk-actions {
    display: flex;
    align-items: center;
    gap: var(--space);
    padding: var(--space);
    background: var(--color-background-secondary);
    border-radius: var(--border-radius);
    margin-bottom: var(--space);

    span {
      font-weight: 500;
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
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
    }

    &--selected {
      background: var(--color-primary-light);
      border-color: var(--color-primary);
    }
  }

  &__item-info {
    flex: 1;

    h3 {
      margin: 0 0 var(--space-xs) 0;
      font-size: 1.125rem;
      font-weight: 500;
    }

    p {
      margin: 0 0 var(--space-xs) 0;
      color: var(--color-text-secondary);
      font-size: 0.875rem;
    }
  }

  &__badges {
    display: flex;
    gap: var(--space-xs);
  }

  &__item-actions {
    display: flex;
    gap: var(--space-xs);
  }
}
</style>