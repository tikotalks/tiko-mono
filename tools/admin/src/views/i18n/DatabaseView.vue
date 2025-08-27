<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="t('admin.i18n.database.title')"
      :description="t('admin.i18n.database.description')"
    >
      <template #actions>
        <TButton @click="openAddKeyDialog" :icon="Icons.ADD" color="primary">
          {{ t('admin.i18n.database.addKey') }}
        </TButton>
        <TButton
          @click="router.push({ name: 'I18nImport' })"
          :icon="Icons.ARROW_UPLOAD"
          type="outline"
        >
          {{ t('admin.i18n.database.importTranslations') }}
        </TButton>
        <TButton
          @click="router.push({ name: 'I18nLanguages' })"
          :icon="Icons.SPEECH_BALLOON"
          type="outline"
        >
          {{ t('admin.i18n.database.viewLanguages') }}
        </TButton>
      </template>

      <template #stats>
        <TKeyValue
          :items="[
            { key: t('admin.i18n.database.stats.totalKeys'), value: String(stats.totalKeys) },
            { key: t('admin.i18n.database.stats.totalLanguages'), value: String(stats.totalLanguages) },
            { key: t('admin.i18n.database.stats.totalTranslations'), value: String(stats.totalTranslations) }
          ]"
        />
      </template>
    </AdminPageHeader>

    <!-- Conflict Alert -->
    <I18nConflictAlert :keys="keys.map(k => ({ id: String(k.id), key: k.key }))" />

    <!-- Keys List -->
    <div :class="bemm('keys-section')">
      <!-- Keys List -->
      <TList
        :columns="[
          { key: 'key', label: t('common.key'), width: '35%', sortable: true },
          { key: 'category', label: t('common.category'), width: '15%', sortable: true },
          { key: 'description', label: t('common.description'), width: '20%', sortable: true },
          {
            key: 'translations',
            label: t('common.translations'),
            width: '15%',
            sortable: true
          },
          {
            key: 'actions',
            label: t('common.actions'),
            width: '15%',
            sortable: false
          },
        ]"
        :striped="true"
        :bordered="true"
        :hover="true"
        :sortBy="sortBy"
        :sortDirection="sortDirection"
        :show-stats="true"
        @sort="handleSort"
        :style="{ width: '100%' }"
      >
        <template #header-prepend>
          <th :style="{ width: '40px' }">
            <TInputCheckbox
              v-model="selectAll"
              @update:modelValue="toggleSelectAll"
            />
          </th>
        </template>
        <template #header>
          <h4>{{ t('admin.i18n.database.keys.title')}}</h4>

          <!-- Search -->
          <TInputText
            v-model="searchQuery"
            :placeholder="t('common.search')"
            :icon="Icons.SEARCH_M"
            :class="bemm('search')"
          />
        </template>
        <TListItem
          v-for="key in filteredKeys"
          :key="key.id"
          :id="key.key"
          :clickable="true"
          @click="viewKeyDetails(key)"
        >
          <template #prepend>
            <TListCell type="custom" :style="{ width: '40px' }">
              <TInputCheckbox
                :modelValue="selectedIds.has(String(key.id))"
                @update:modelValue="toggleSelection(String(key.id))"
                @click.stop
              />
            </TListCell>
          </template>
          <TListCell type="custom">
            <span class="id">
              {{ key.key }}
            </span>
          </TListCell>
          <TListCell type="custom">
            <span :class="bemm('category-badge')">
              {{ key.category || '-' }}
            </span>
          </TListCell>
          <TListCell type="text" :size="Size.SMALL" :content="key.description || '-'" />
          <TListCell type="custom">
            <div :class="bemm('translation-count')">
              <TProgressBar
                :prefix="`${key.translationCount} / ${stats.totalLanguages}`"
                :value="((key?.translationCount || 0) / stats.totalLanguages) * 100"
                :class="bemm('translation-progress')"
                size="small"
              />
            </div>
          </TListCell>
          <TListCell
            type="actions"
            :actions="[
              listActions.edit((e) => { e.stopPropagation(); handleEdit(e, key) }),
              listActions.custom({
                handler: (e) => { e.stopPropagation(); handleEditKey(e, key) },
                tooltip: t('admin.i18n.database.editKey', 'Edit Key'),
                icon: Icons.CODE_BRACKETS,
                buttonType: 'outline',
                disabled: false
              }),
              listActions.delete((e) => { e.stopPropagation(); handleDelete(e, key) })
            ]"
          />
        </TListItem>
      </TList>

      <!-- Empty state when no search performed -->
      <TEmptyState
        v-if="!hasSearched && !searchQuery && !loading && filteredKeys.length === 0"
        :icon="Icons.SEARCH_M"
        :title="t('admin.i18n.database.searchPrompt', 'Start typing to search')"
        :description="t('admin.i18n.database.searchPromptDescription', 'Enter a key, category, or description to find translations')"
      />

      <!-- No results -->
      <TEmptyState
        v-else-if="hasSearched && filteredKeys.length === 0 && !loading"
        :icon="Icons.FILE_TEXT"
        :title="t('admin.i18n.database.noResults', 'No results found')"
        :description="t('admin.i18n.database.noResultsDescription', 'Try adjusting your search terms')"
      >
        <TButton @click="clearSearch" type="outline">
          {{ t('common.clear') }}
        </TButton>
      </TEmptyState>

      <!-- Loading state -->
      <div v-else-if="loading" :class="bemm('loading')">
        <TSpinner />
        <p>{{ t('common.loading') }}</p>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1 && hasSearched" :class="bemm('pagination')">
        <TButton
          type="outline"
          :disabled="currentPage === 1"
          @click="loadKeys(currentPage - 1)"
          :icon="Icons.CHEVRON_LEFT"
          size="small"
        >
          {{ t('common.previous') }}
        </TButton>

        <span :class="bemm('pagination-info')">
          {{ t('common.pageXofY', { x: currentPage, y: totalPages }, `Page ${currentPage} of ${totalPages}`) }}
        </span>

        <TButton
          type="outline"
          :disabled="currentPage === totalPages"
          @click="loadKeys(currentPage + 1)"
          :icon="Icons.CHEVRON_RIGHT"
          iconPosition="right"
          size="small"
        >
          {{ t('common.next') }}
        </TButton>
      </div>
    </div>
  </div>

  <!-- Status Bar for Bulk Actions -->
  <TStatusBar :show="selectedIds.size > 0">
    <div :class="bemm('status-bar')">
      <div :class="bemm('status-bar-info')">
        {{ t('admin.i18n.database.selectedKeys', { count: selectedIds.size }) }}
      </div>
      <div :class="bemm('status-bar-actions')">
        <TButton
          @click="bulkGenerateTranslations"
          :icon="Icons.SPARKLE"
          size="small"
          color="primary"
          :disabled="!canGenerateTranslations"
        >
          {{ t('admin.i18n.database.generateTranslations') }}
        </TButton>
        <TButton
          @click="bulkDelete"
          :icon="Icons.MULTIPLY_M"
          size="small"
          color="error"
        >
          {{ t('admin.i18n.database.deleteSelected') }}
        </TButton>
        <TButton
          @click="clearSelection"
          type="ghost"
          size="small"
        >
          {{ t('common.clearSelection') }}
        </TButton>
      </div>
    </div>
  </TStatusBar>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useBemm } from 'bemm';
import { Icons } from 'open-icon';

import {
  TButton,
  TInputText,
  TList,
  TListItem,
  TListCell,
  TKeyValue,
  ToastService,
  TProgressBar,
  listActions,
  TInputCheckbox,
  TStatusBar,
  TEmptyState,
  TSpinner,
  ConfirmDialog,
  Size
} from '@tiko/ui';
import AddTranslationKeyDialog from '../../components/dialogs/AddTranslationKeyDialog.vue';
import EditKeyDialog from '../../components/dialogs/EditKeyDialog.vue';
import AdminPageHeader from '@/components/AdminPageHeader.vue';
import I18nConflictAlert from '@/components/I18nConflictAlert.vue';
import { useI18nDatabaseService, useUserPreferences, USER_PREFERENCE_KEYS, useI18n } from '@tiko/core';

import type { I18nKey } from '../../types/i18n.types';
import type { PopupService } from '@tiko/ui';

const bemm = useBemm('i18n-database-view');
const { t } = useI18n();
const router = useRouter();
const translationService = useI18nDatabaseService();
const popupService = inject<PopupService>('popupService');
const toastService = inject<ToastService>('toastService');
const { getListPreferences, updateListPreferences, loadPreferences } = useUserPreferences();

// Data
const keys = ref<I18nKey[]>([]);
const allKeys = ref<I18nKey[]>([]); // Store all keys for client-side filtering
const searchQuery = ref('');
const loading = ref(false);
const sortBy = ref('key');
const sortDirection = ref<'asc' | 'desc'>('asc');
const selectedIds = ref(new Set<string>());
const selectAll = ref(false);
const currentPage = ref(1);
const itemsPerPage = ref(50);
const totalItems = ref(0);
const hasSearched = ref(false);

// Stats
const stats = ref({
  totalKeys: 0,
  totalLanguages: 0,
  totalTranslations: 0,
});

// Computed for total pages
const totalPages = computed(() => {
  return Math.ceil(totalItems.value / itemsPerPage.value) || 1;
});

// Computed
const filteredKeys = computed(() => {
  return keys.value;
});

// Methods
function clearSearch() {
  searchQuery.value = '';
  hasSearched.value = false;
  keys.value = [];
  totalItems.value = 0;
  currentPage.value = 1;
}

function handleSort(column: string, direction: 'asc' | 'desc') {
  sortBy.value = column;
  sortDirection.value = direction;

  // Save preferences
  updateListPreferences(USER_PREFERENCE_KEYS.LISTS.I18N_DATABASE_KEYS, {
    sortBy: column,
    sortDirection: direction
  });

  // Re-sort current results
  if (hasSearched.value || searchQuery.value) {
    loadKeys(currentPage.value);
  }
}

async function loadKeys(page = 1) {
  loading.value = true;
  currentPage.value = page;

  try {
    // Load all keys only once
    if (allKeys.value.length === 0) {
      const data = await translationService.getKeysWithTranslationCounts();
      allKeys.value = data.map((key) => ({
        ...key,
        translationCount: key.translation_count || 0,
      }));

      // Load stats only once
      await loadStats();
    }

    // Apply search filter
    let filtered = allKeys.value;
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter(
        (key) =>
          key.key.toLowerCase().includes(query) ||
          key.category?.toLowerCase().includes(query) ||
          key.description?.toLowerCase().includes(query)
      );
      hasSearched.value = true;
    }

    // Apply sorting
    if (sortBy.value) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortBy.value] || '';
        let bVal = b[sortBy.value] || '';

        // Handle translation count separately
        if (sortBy.value === 'translations') {
          aVal = a.translationCount || 0;
          bVal = b.translationCount || 0;
        }

        // Convert to strings for comparison
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();

        if (sortDirection.value === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
      });
    }

    // Update total items
    totalItems.value = filtered.length;

    // Apply pagination
    const offset = (page - 1) * itemsPerPage.value;
    keys.value = filtered.slice(offset, offset + itemsPerPage.value);

    // Log the actual number of keys fetched
    console.log(`Showing ${keys.value.length} of ${totalItems.value} translation keys (page ${page})`);
  } catch (error) {
    console.error('Failed to load keys:', error);
    toastService?.show({
      message: t('admin.i18n.database.loadError', 'Failed to load translation keys'),
      type: 'error'
    });
  } finally {
    loading.value = false;
  }
}

async function loadStats() {
  try {
    // Only load languages, we already have the translation counts
    const languages = await translationService.getLanguages();

    // Calculate total translations from all keys
    const totalTranslations = allKeys.value.reduce(
      (sum, key) => sum + (key.translationCount || 0),
      0,
    );

    stats.value = {
      totalKeys: allKeys.value.length,
      totalLanguages: languages.filter((l) => l.is_active).length,
      totalTranslations,
    };
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// Open Add Key Dialog
function openAddKeyDialog() {
  if (!popupService) {
    console.error('PopupService not available');
    return;
  }

  popupService.open({
    component: AddTranslationKeyDialog,
    props: {
      mode: 'create',
      title: t('admin.i18n.addKey.title'),
      onSave: async (data) => {
        try {
          // Create the key
          const key = await translationService.createTranslationKey({
            key: data.key,
            category: data.category,
            description: data.description,
          });

          // Create translations for each language
          for (const [localeCode, value] of Object.entries(data.translations)) {
            if (value) {
              await translationService.createTranslation({
                key_id: key.id,
                language_code: localeCode,
                value: value as string,
                is_published: true,
                notes: 'Created via admin interface',
              });
            }
          }

          toastService?.show({
            message: t('admin.i18n.addKey.success'),
            type: 'success',
          });

          // Reload keys to show the new one
          await loadKeys(currentPage.value);
        } catch (error) {
          console.error('Failed to create translation key:', error);
          toastService?.show({
            message: t('admin.i18n.addKey.error'),
            type: 'error',
          });
        }
      },
      onBatchSave: (result) => {
        // Handle batch save result
        const successCount = result.createdKeys?.length || 0;
        const errorCount = result.errors?.length || 0;
        const skippedCount = result.skippedCount || 0;

        // Build message based on results
        if (successCount > 0 && errorCount === 0) {
          toastService?.show({
            message: t('admin.i18n.addKey.batchSuccess', `Successfully created ${successCount} translation keys`),
            type: 'success',
          });
        } else if (successCount > 0 && errorCount > 0) {
          toastService?.show({
            message: t('admin.i18n.addKey.batchPartialSuccess',
              `Created ${successCount} keys successfully. ${errorCount} failed.`),
            type: 'warning',
          });
        } else if (errorCount > 0) {
          toastService?.show({
            message: t('admin.i18n.addKey.batchErrors', `Failed to create keys. ${errorCount} errors occurred.`),
            type: 'error',
          });
        }

        if (skippedCount > 0) {
          console.log(`Skipped ${skippedCount} entries with validation errors`);
        }

        if (errorCount > 0) {
          console.error('Batch save errors:', result.errors);
        }

        // Reload keys to show the new ones
        if (successCount > 0) {
          loadKeys();
        }
      },
    },
  });
}

// Handle edit action
function handleEdit(event: Event, key: I18nKey) {
  event.stopPropagation();
  viewKeyDetails(key);
}

// Handle edit key action
async function handleEditKey(event: Event, key: I18nKey) {
  event.stopPropagation();

  if (!popupService) {
    console.error('PopupService not available');
    return;
  }

  popupService.open({
    component: EditKeyDialog,
    props: {
      title: t('admin.i18n.editKey.title', 'Edit Translation Key'),
      originalKey: key.key,
      onSave: async (newKey: string) => {
        try {
          await translationService.updateTranslationKey(key.id, {
            key: newKey
          });

          toastService?.show({
            message: t('admin.i18n.editKey.success', 'Key updated successfully'),
            type: 'success',
          });

          // Reload keys to show updated data
          await loadKeys(currentPage.value);
        } catch (error) {
          console.error('Failed to update translation key:', error);
          toastService?.show({
            message: t('admin.i18n.editKey.error', 'Failed to update key'),
            type: 'error',
          });
        }
      },
    },
  });
}

// Handle delete action
async function handleDelete(event: Event, key: I18nKey) {
  event.stopPropagation();

  if (!popupService) {
    console.error('PopupService not available');
    return;
  }

  // Show confirmation dialog
  popupService.open({
    component: ConfirmDialog,
    props: {
      title: t('admin.i18n.database.deleteKey.title'),
      message: t('admin.i18n.database.deleteKey.message', { key: key.key }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      confirmColor: 'error',
      onConfirm: async () => {
        try {
          await translationService.deleteTranslationKey(key.id);

          toastService?.show({
            message: t('admin.i18n.database.deleteKey.success'),
            type: 'success',
          });

          // Reload keys to reflect the deletion
          await loadKeys(currentPage.value);
        } catch (error) {
          console.error('Failed to delete translation key:', error);
          toastService?.show({
            message: t('admin.i18n.database.deleteKey.error'),
            type: 'error',
          });
        }
      }
    }
  });
}

// View key details
async function viewKeyDetails(key: I18nKey) {
  console.log('viewKeyDetails called with key:', key);

  if (!popupService) {
    console.error('PopupService not available');
    return;
  }

  console.log('Opening popup with props:', {
    mode: 'edit',
    editKey: {
      id: key.id,
      key: key.key,
      category: key.category,
      description: key.description,
    },
  });

  // Use nextTick to ensure proper timing
  await nextTick();

  popupService.open({
    component: AddTranslationKeyDialog,
    props: {
      mode: 'edit',
      editKey: {
        id: key.id,
        key: key.key,
        category: key.category,
        description: key.description,
      },
      title: t('admin.i18n.editKey.title'),
      onSave: async (data) => {
        try {
          // Update the key details (category and description only)
          if (
            data.category !== key.category ||
            data.description !== key.description
          ) {
            await translationService.updateTranslationKey(key.id, {
              category: data.category,
              description: data.description,
            });
          }

          // Update translations
          for (const [localeCode, value] of Object.entries(data.translations)) {
            if (value) {
              await translationService.createTranslation({
                key_id: key.id,
                language_code: localeCode,
                value: value as string,
                is_published: true,
                notes: 'Updated via admin interface',
              });
            }
          }

          toastService?.show({
            message: t('admin.i18n.editKey.success'),
            type: 'success',
          });

          // Reload keys to show updated data
          await loadKeys(currentPage.value);
        } catch (error) {
          console.error('Failed to update translation key:', error);
          toastService?.show({
            message: t('admin.i18n.editKey.error'),
            type: 'error',
          });
        }
      },
    },
  });
}

// Selection methods
function toggleSelection(keyId: string) {
  if (selectedIds.value.has(keyId)) {
    selectedIds.value.delete(keyId);
  } else {
    selectedIds.value.add(keyId);
  }

  // Update select all checkbox
  selectAll.value = selectedIds.value.size === filteredKeys.value.length && filteredKeys.value.length > 0;
}

function toggleSelectAll(value: boolean) {
  if (value) {
    filteredKeys.value.forEach(key => selectedIds.value.add(String(key.id)));
  } else {
    selectedIds.value.clear();
  }
}

function clearSelection() {
  selectedIds.value.clear();
  selectAll.value = false;
}

// Bulk actions
async function bulkDelete() {
  if (!popupService) {
    console.error('PopupService not available');
    return;
  }

  const count = selectedIds.value.size;

  popupService.open({
    component: ConfirmDialog,
    props: {
      title: t('admin.i18n.database.bulkDelete.title'),
      message: t('admin.i18n.database.bulkDelete.message', { count }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      confirmColor: 'error',
      onConfirm: async () => {
        try {
          // Delete all selected keys
          const promises = Array.from(selectedIds.value).map(id => {
            const key = keys.value.find(k => String(k.id) === id);
            if (key) {
              return translationService.deleteTranslationKey(key.id);
            }
          });

          await Promise.all(promises);

          toastService?.show({
            message: t('admin.i18n.database.bulkDelete.success', { count }),
            type: 'success',
          });

          // Clear selection and reload
          clearSelection();
          await loadKeys(currentPage.value);
        } catch (error) {
          console.error('Failed to delete translation keys:', error);
          toastService?.show({
            message: t('admin.i18n.database.bulkDelete.error'),
            type: 'error',
          });
        }
      }
    }
  });
}

// Check if we can generate translations (if English translations exist)
const canGenerateTranslations = computed(() => {
  // Check if any selected keys have English translations
  return Array.from(selectedIds.value).some(id => {
    const key = keys.value.find(k => String(k.id) === id);
    // This is a simplified check - you may need to load actual translations
    return key && (key.translationCount || 0) > 0;
  });
});

async function bulkGenerateTranslations() {
  if (!popupService) {
    console.error('PopupService not available');
    return;
  }

  const count = selectedIds.value.size;

  popupService.open({
    component: ConfirmDialog,
    props: {
      title: t('admin.i18n.database.bulkGenerate.title'),
      message: t('admin.i18n.database.bulkGenerate.message', { count }),
      confirmLabel: t('admin.i18n.database.bulkGenerate.confirm'),
      cancelLabel: t('common.cancel'),
      confirmColor: 'primary',
      icon: Icons.STAR_M,
      onConfirm: async () => {
        try {
          // TODO: Implement GPT translation generation for selected keys
          // This would involve:
          // 1. Get English translations for selected keys
          // 2. Generate translations for other languages
          // 3. Save generated translations

          toastService?.show({
            message: t('admin.i18n.database.bulkGenerate.success', { count }),
            type: 'success',
          });

          // Clear selection and reload
          clearSelection();
          await loadKeys(currentPage.value);
        } catch (error) {
          console.error('Failed to generate translations:', error);
          toastService?.show({
            message: t('admin.i18n.database.bulkGenerate.error'),
            type: 'error',
          });
        }
      }
    }
  });
}

// Watch for search query changes
let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchQuery, (newValue) => {
  clearTimeout(searchTimeout);

  if (!newValue) {
    // If search is cleared, reset immediately
    currentPage.value = 1;
    if (hasSearched.value) {
      loadKeys(1);
    } else {
      keys.value = [];
      totalItems.value = 0;
    }
  } else {
    // Debounce search
    searchTimeout = setTimeout(() => {
      currentPage.value = 1;
      hasSearched.value = true;
      loadKeys(1);
    }, 300);
  }
});

// Lifecycle
onMounted(async () => {
  // Only load if we're on this page
  if (router.currentRoute.value.name === 'I18nDatabase') {
    // Load user preferences first
    await loadPreferences();

    // Apply saved preferences
    const savedPrefs = getListPreferences(USER_PREFERENCE_KEYS.LISTS.I18N_DATABASE_KEYS);
    if (savedPrefs.sortBy) {
      sortBy.value = savedPrefs.sortBy;
    }
    if (savedPrefs.sortDirection) {
      sortDirection.value = savedPrefs.sortDirection;
    }

    // Don't load keys on mount - wait for user to search
    // Just clear the display
    keys.value = [];
    totalItems.value = 0;
  }
});
</script>

<style lang="scss">
.i18-n-database-view {
  display: flex;
  flex-direction: column;
  gap: var(--space);

  &__stat {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space);
    background: var(--color-background-secondary);
    border-radius: var(--border-radius);
    min-width: 120px;
  }

  &__stat-label {
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
  }

  &__stat-value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-foreground);
  }

  &__keys-section {
    display: flex;
    flex-direction: column;
    gap: var(--space);
    justify-content: space-between;
    h2 {
      font-size: var(--font-size-lg);
      margin-bottom: var(--space);
    }
  }

  &__search {
    margin-bottom: var(--space);
    max-width: 400px;
  }

  &__translation-count {
    display: flex;
    flex-direction: column;
    gap: var(--space-xxs);
  }

  &__translation-count-text {
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
  }

  &__translation-progress {
    width: 100%;
    height: 4px;
  }

  &__category-badge {
    display: inline-block;
    padding: var(--space-xxs) var(--space-xs);
    background: var(--color-primary-10);
    color: var(--color-primary);
    border-radius: var(--border-radius);
    font-size: var(--font-size-s);
  }

  &__translation-count {
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
  }

  &__empty {
    padding: var(--space-xl);
    text-align: center;
    color: var(--color-foreground-secondary);
  }

  &__status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space);
    width: 100%;
  }

  &__status-bar-info {
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
  }

  &__status-bar-actions {
    display: flex;
    gap: var(--space-s);
    align-items: center;
  }

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-xl);
    gap: var(--space);
    color: var(--color-foreground-secondary);
  }

  &__pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space);
    padding: var(--space-lg);
    border-top: 1px solid var(--color-accent);

    &-info {
      font-size: var(--font-size-sm);
      color: var(--color-foreground-secondary);
    }
  }
}
</style>
